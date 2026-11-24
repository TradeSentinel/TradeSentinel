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
    private failures = 0;
    private lastMessageAt = 0;
    private readonly lastQuoteAt: Record<string, number> = {};
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

        const pair = PRODUCTS[message.product_id];
        if (!pair) return;

        // Cap UI and alert evaluation at 4 updates per second per product.
        const now = Date.now();
        if (now - (this.lastQuoteAt[message.product_id] || 0) < 250) return;
        this.lastQuoteAt[message.product_id] = now;

        const bid = Number(message.best_bid);
        const ask = Number(message.best_ask);
        if (!Number.isFinite(bid) || !Number.isFinite(ask) || bid <= 0 || ask <= 0) return;

        const parsedTimestamp = message.time ? Date.parse(message.time) : NaN;
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
