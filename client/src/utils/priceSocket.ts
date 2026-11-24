export interface PriceQuote {
    pair: string;
    displayPair: string;
    bid: string;
    ask: string;
    timestamp: number;
    source: string;
    stale: boolean;
    delayed: boolean;
    marketOpen: boolean;
    receivedAt: number;
}

export type PriceSocketStatus = 'disconnected' | 'connecting' | 'connected' | 'subscribed' | 'error';

type QuoteListener = (quote: PriceQuote) => void;
type StatusListener = (status: PriceSocketStatus) => void;

const WS_URL = import.meta.env.VITE_WS_SERVER_URL || 'ws://localhost:8787';

function normalizePair(input: string): string {
    return String(input || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * One shared WebSocket to the Trade Sentinel server for every price consumer
 * in the app. Components subscribe to pairs; the singleton handles connect,
 * resubscribe and backoff.
 */
class PriceSocket {
    private ws: WebSocket | null = null;
    private readonly listeners = new Map<string, Set<QuoteListener>>();
    private readonly statusListeners = new Set<StatusListener>();
    private readonly desiredPairs = new Set<string>();
    private status: PriceSocketStatus = 'disconnected';
    private reconnectTimer: number | null = null;
    private reconnectAttempts = 0;

    public subscribe(pair: string, listener: QuoteListener): () => void {
        const key = normalizePair(pair);
        let listeners = this.listeners.get(key);
        if (!listeners) {
            listeners = new Set();
            this.listeners.set(key, listeners);
        }
        listeners.add(listener);
        this.desiredPairs.add(key);
        this.ensureConnected();
        this.send({ type: 'subscribe_prices', pairs: [key] });

        return () => {
            const current = this.listeners.get(key);
            if (!current) return;
            current.delete(listener);
            if (current.size > 0) return;

            this.listeners.delete(key);
            this.desiredPairs.delete(key);
            this.send({ type: 'unsubscribe_prices', pairs: [key] });
            this.closeIfIdle();
        };
    }

    public subscribeMany(pairs: string[], listener: QuoteListener): () => void {
        const unsubscribers = pairs.map(pair => this.subscribe(pair, listener));
        return () => {
            for (const unsubscribe of unsubscribers) {
                unsubscribe();
            }
        };
    }

    public onStatus(listener: StatusListener): () => void {
        this.statusListeners.add(listener);
        return () => {
            this.statusListeners.delete(listener);
        };
    }

    public getStatus(): PriceSocketStatus {
        return this.status;
    }

    public reconnect(): void {
        this.reconnectAttempts = 0;
        if (this.reconnectTimer !== null) {
            window.clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        if (this.ws) {
            const socket = this.ws;
            this.ws = null;
            socket.close();
        }
        this.setStatus('connecting');
        this.ensureConnected();
    }

    private ensureConnected(): void {
        if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
            return;
        }

        this.setStatus('connecting');
        const socket = new WebSocket(WS_URL);
        this.ws = socket;

        socket.onopen = () => {
            this.reconnectAttempts = 0;
            this.setStatus('connected');
            if (this.desiredPairs.size > 0) {
                this.send({ type: 'subscribe_prices', pairs: Array.from(this.desiredPairs) });
            }
        };

        socket.onmessage = (event) => {
            let parsed: unknown;
            try {
                parsed = JSON.parse(String(event.data));
            } catch {
                return;
            }
            if (!parsed || typeof parsed !== 'object') return;

            const message = parsed as {
                type?: string;
                message?: string;
                quotes?: PriceQuote[];
            };

            switch (message.type) {
                case 'subscribed_prices':
                    this.setStatus('subscribed');
                    break;
                case 'price':
                    this.dispatch(parsed as PriceQuote);
                    break;
                case 'price_snapshot':
                    if (Array.isArray(message.quotes)) {
                        for (const quote of message.quotes) {
                            this.dispatch(quote);
                        }
                    }
                    break;
                case 'price_status':
                    break;
                case 'error':
                    console.error('[priceSocket] server error:', message.message);
                    this.setStatus('error');
                    break;
                default:
                    break;
            }
        };

        socket.onerror = () => {
            this.setStatus('error');
        };

        socket.onclose = () => {
            if (this.ws === socket) {
                this.ws = null;
            }
            this.setStatus('disconnected');
            this.scheduleReconnect();
        };
    }

    private dispatch(quote: PriceQuote): void {
        if (!quote || !quote.pair) return;
        const listeners = this.listeners.get(quote.pair);
        if (!listeners) return;
        for (const listener of Array.from(listeners)) {
            listener(quote);
        }
    }

    private send(payload: unknown): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(payload));
        }
    }

    private closeIfIdle(): void {
        if (this.desiredPairs.size > 0) return;
        if (this.reconnectTimer !== null) {
            window.clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        if (this.ws) {
            const socket = this.ws;
            this.ws = null;
            socket.close();
        }
        this.setStatus('disconnected');
    }

    private scheduleReconnect(): void {
        if (this.reconnectTimer !== null || this.desiredPairs.size === 0) return;
        const delay = Math.min(15000, 1000 * Math.pow(2, Math.min(this.reconnectAttempts, 4)));
        this.reconnectAttempts++;
        this.reconnectTimer = window.setTimeout(() => {
            this.reconnectTimer = null;
            this.ensureConnected();
        }, delay);
    }

    private setStatus(status: PriceSocketStatus): void {
        if (this.status === status) return;
        this.status = status;
        for (const listener of Array.from(this.statusListeners)) {
            listener(status);
        }
    }
}

export const priceSocket = new PriceSocket();
