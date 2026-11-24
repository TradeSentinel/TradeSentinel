"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoinbaseProvider = void 0;
const events_1 = require("events");
const ws_1 = __importDefault(require("ws"));
const PRODUCTS = {
    'BTC-USD': 'BTCUSD',
    'ETH-USD': 'ETHUSD',
    'LTC-USD': 'LTCUSD'
};
const WS_URL = 'wss://ws-feed.exchange.coinbase.com';
const STALE_AFTER_MS = 30000;
/**
 * Coinbase Exchange public WebSocket feed.
 * No key required. Ticker messages carry best bid and best ask.
 */
class CoinbaseProvider extends events_1.EventEmitter {
    constructor() {
        super(...arguments);
        this.id = 'coinbase';
        this.ws = null;
        this.stopped = true;
        this.reconnectTimer = null;
        this.watchdog = null;
        this.snapshotTimer = null;
        this.failures = 0;
        this.lastMessageAt = 0;
        this.lastQuoteAt = {};
        this.lastTickerAt = {};
        this.status = {
            id: 'coinbase',
            state: 'stopped',
            lastSuccessAt: null,
            lastError: null,
            quoteCount: 0
        };
    }
    start() {
        if (!this.stopped)
            return;
        this.stopped = false;
        this.connect();
        this.startSnapshotTimer();
        void this.refreshSilentProducts();
    }
    stop() {
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
    getStatus() {
        return { ...this.status };
    }
    connect() {
        if (this.stopped)
            return;
        this.status = { ...this.status, state: 'starting' };
        this.emit('status', this.getStatus());
        const ws = new ws_1.default(WS_URL);
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
        ws.on('message', (data) => {
            this.lastMessageAt = Date.now();
            this.handleMessage(data.toString());
        });
        ws.on('error', (error) => {
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
    handleMessage(raw) {
        let message;
        try {
            message = JSON.parse(raw);
        }
        catch {
            return;
        }
        if (message.type !== 'ticker' || !message.product_id)
            return;
        if (!Object.prototype.hasOwnProperty.call(PRODUCTS, message.product_id))
            return;
        // Cap UI and alert evaluation at 4 updates per second per product.
        const now = Date.now();
        if (now - (this.lastQuoteAt[message.product_id] || 0) < 250)
            return;
        this.lastQuoteAt[message.product_id] = now;
        this.lastTickerAt[message.product_id] = now;
        this.emitQuote(message.product_id, message.best_bid, message.best_ask, message.time);
    }
    emitQuote(productId, bidValue, askValue, timeValue) {
        if (this.stopped)
            return;
        if (!Object.prototype.hasOwnProperty.call(PRODUCTS, productId))
            return;
        const pair = PRODUCTS[productId];
        if (!pair)
            return;
        const bid = Number(bidValue);
        const ask = Number(askValue);
        if (!Number.isFinite(bid) || !Number.isFinite(ask) || bid <= 0 || ask <= 0)
            return;
        const parsedTimestamp = timeValue ? Date.parse(timeValue) : NaN;
        const timestamp = Number.isFinite(parsedTimestamp)
            ? Math.floor(parsedTimestamp / 1000)
            : Math.floor(Date.now() / 1000);
        const quote = {
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
     * last few seconds from Coinbase's public REST ticker. The REST snapshot
     * is timestamped at fetch time because bid/ask is current even when the
     * last trade is old. The interval stays below the engine freshness window
     * so the biquote fallback cannot win while Coinbase is silent.
     */
    startSnapshotTimer() {
        if (this.snapshotTimer)
            return;
        this.snapshotTimer = setInterval(() => {
            void this.refreshSilentProducts();
        }, 2000);
        this.snapshotTimer.unref();
    }
    async refreshSilentProducts() {
        if (this.stopped)
            return;
        const now = Date.now();
        for (const productId of Object.keys(PRODUCTS)) {
            if (now - (this.lastTickerAt[productId] || 0) <= 2000)
                continue;
            try {
                const response = await fetch(`https://api.exchange.coinbase.com/products/${productId}/ticker`, {
                    signal: AbortSignal.timeout(5000)
                });
                if (!response.ok)
                    continue;
                const data = await response.json();
                // Do not use data.time here: it is the last trade time, which can
                // be old on a thin pair even though bid/ask is current.
                this.emitQuote(productId, data.bid, data.ask);
                this.lastTickerAt[productId] = Date.now();
            }
            catch {
                // The WebSocket remains the primary path; a REST miss is not fatal.
            }
        }
    }
    startWatchdog() {
        if (this.watchdog)
            clearInterval(this.watchdog);
        this.watchdog = setInterval(() => {
            if (Date.now() - this.lastMessageAt <= STALE_AFTER_MS)
                return;
            this.status = {
                ...this.status,
                state: 'degraded',
                lastError: 'No messages for 30s'
            };
            this.emit('status', this.getStatus());
            this.ws?.terminate();
        }, 10000);
    }
    scheduleReconnect() {
        if (this.reconnectTimer || this.stopped)
            return;
        const delay = Math.min(30000, 1000 * Math.pow(2, Math.min(this.failures, 5)));
        this.failures++;
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connect();
        }, delay);
    }
}
exports.CoinbaseProvider = CoinbaseProvider;
//# sourceMappingURL=coinbase.js.map