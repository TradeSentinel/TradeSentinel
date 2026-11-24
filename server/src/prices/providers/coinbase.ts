import { EventEmitter } from 'events';
import WebSocket from 'ws';
import { ProviderQuote, ProviderStatus, PriceSourceId } from '../types';

const PRODUCTS: Record<string, string> = {
    'BTC-USD': 'BTCUSD',
    'ETH-USD': 'ETHUSD',
    'LTC-USD': 'LTCUSD'
};

const WS_URL = 'wss://ws-feed.exchange.coinbase.com';
const STALE_AFTER_MS = 30000;

interface CoinbaseMessage {
    type?: string;
    product_id?: string;
    best_bid?: string;
    best_ask?: string;
    time?: string;
}

/**
 * Coinbase Exchange public WebSocket feed.
 * No key required. Ticker messages carry best bid and best ask.
 */
export class CoinbaseProvider extends EventEmitter {
    public readonly id: PriceSourceId = 'coinbase';
    private ws: WebSocket | null = null;
    private stopped = true;
    private reconnectTimer: NodeJS.Timeout | null = null;
    private watchdog: NodeJS.Timeout | null = null;
    private snapshotTimer: NodeJS.Timeout | null = null;
    private failures = 0;
    private lastMessageAt = 0;
    private readonly lastQuoteAt: Record<string, number> = {};
    private readonly lastTickerAt: Record<string, number> = {};
    private status: ProviderStatus = {
        id: 'coinbase',
        state: 'stopped',
        lastSuccessAt: null,
        lastError: null,
        quoteCount: 0
    };

    public start(): void {
        if (!this.stopped) return;
        this.stopped = false;
        this.connect();
        this.startSnapshotTimer();
    }

    public stop(): void {
        this.stopped = true;
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        if (this.watchdog) {
            clearInterval(this.watchdog);
            this.watchdog = null;
        }
        if (this.snapshotTimer) {
            clearInterval(this.snapshotTimer);
            this.snapshotTimer = null;
        }
        if (this.ws) {
            this.ws.removeAllListeners();
            this.ws.close();
            this.ws = null;
        }
        this.status = { ...this.status, state: 'stopped' };
        this.emit('status', this.getStatus());
    }

    public getStatus(): ProviderStatus {
        return { ...this.status };
    }

    private connect(): void {
        if (this.stopped) return;

        this.status = { ...this.status, state: 'starting' };
        this.emit('status', this.getStatus());

        const ws = new WebSocket(WS_URL);
        this.ws = ws;
        this.lastMessageAt = Date.now();

        ws.on('open', () => {
            this.failures = 0;
            this.lastMessageAt = Date.now();
            this.status = {
                id: 'coinbase',
                state: 'connected',
                lastSuccessAt: Date.now(),
                lastError: null,
                quoteCount: 0
            };
            this.emit('status', this.getStatus());
            ws.send(JSON.stringify({
                type: 'subscribe',
                product_ids: Object.keys(PRODUCTS),
                channels: ['ticker', 'heartbeat']
            }));
            this.startWatchdog();
        });

        ws.on('message', (data: WebSocket.RawData) => {
            this.lastMessageAt = Date.now();
            this.handleMessage(data.toString());
        });

        ws.on('error', (error: Error) => {
            this.status = {
                ...this.status,
                state: 'degraded',
                lastError: error.message
            };
            this.emit('status', this.getStatus());
        });

        ws.on('close', () => {
            if (this.watchdog) {
                clearInterval(this.watchdog);
                this.watchdog = null;
            }
            if (this.ws === ws) {
                this.ws = null;
            }
            if (!this.stopped) {
                this.scheduleReconnect();
            }
        });
    }

    private handleMessage(raw: string): void {
        let message: CoinbaseMessage;
        try {
            message = JSON.parse(raw) as CoinbaseMessage;
        } catch {
            return;
        }

        if (message.type !== 'ticker' || !message.product_id) return;
        if (!PRODUCTS[message.product_id]) return;

        // Cap UI and alert evaluation at 4 updates per second per product.
        const now = Date.now();
        if (now - (this.lastQuoteAt[message.product_id] || 0) < 250) return;
        this.lastQuoteAt[message.product_id] = now;
        this.lastTickerAt[message.product_id] = now;

        this.emitQuote(message.product_id, message.best_bid, message.best_ask, message.time);
    }

    private emitQuote(productId: string, bidValue?: string, askValue?: string, timeValue?: string): void {
        if (this.stopped) return;

        const pair = PRODUCTS[productId];
        if (!pair) return;

        const bid = Number(bidValue);
        const ask = Number(askValue);
        if (!Number.isFinite(bid) || !Number.isFinite(ask) || bid <= 0 || ask <= 0) return;

        const parsedTimestamp = timeValue ? Date.parse(timeValue) : NaN;
        const timestamp = Number.isFinite(parsedTimestamp)
            ? Math.floor(parsedTimestamp / 1000)
            : Math.floor(Date.now() / 1000);

        const quote: ProviderQuote = {
            pair,
            bid,
            ask,
            timestamp,
            source: 'coinbase',
            marketOpen: true
        };

        this.status = {
            ...this.status,
            state: 'connected',
            lastSuccessAt: Date.now(),
            quoteCount: this.status.quoteCount + 1
        };
        this.emit('quote', quote);
    }

    /**
     * Ticker messages only fire on trades. Thin pairs such as LTC/USD can go
     * silent for long periods, so refresh any product without a tick in the
     * last 10 seconds from Coinbase's public REST ticker. This keeps the
     * primary source fresh without polling while the WebSocket is active.
     */
    private startSnapshotTimer(): void {
        if (this.snapshotTimer) return;
        this.snapshotTimer = setInterval(() => {
            void this.refreshSilentProducts();
        }, 5000);
        this.snapshotTimer.unref();
    }

    private async refreshSilentProducts(): Promise<void> {
        if (this.stopped) return;

        const now = Date.now();
        for (const productId of Object.keys(PRODUCTS)) {
            if (now - (this.lastTickerAt[productId] || 0) <= 10000) continue;

            try {
                const response = await fetch(`https://api.exchange.coinbase.com/products/${productId}/ticker`, {
                    signal: AbortSignal.timeout(5000)
                });
                if (!response.ok) continue;

                const data = await response.json() as { bid?: string; ask?: string; time?: string };
                this.emitQuote(productId, data.bid, data.ask, data.time);
                this.lastTickerAt[productId] = Date.now();
            } catch {
                // The WebSocket remains the primary path; a REST miss is not fatal.
            }
        }
    }

    private startWatchdog(): void {
        if (this.watchdog) clearInterval(this.watchdog);
        this.watchdog = setInterval(() => {
            if (Date.now() - this.lastMessageAt <= STALE_AFTER_MS) return;
            this.status = {
                ...this.status,
                state: 'degraded',
                lastError: 'No messages for 30s'
            };
            this.emit('status', this.getStatus());
            this.ws?.terminate();
        }, 10000);
    }

    private scheduleReconnect(): void {
        if (this.reconnectTimer || this.stopped) return;
        const delay = Math.min(30000, 1000 * Math.pow(2, Math.min(this.failures, 5)));
        this.failures++;
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connect();
        }, delay);
    }
}
