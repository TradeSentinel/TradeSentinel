"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExchangerateProvider = void 0;
const events_1 = require("events");
const types_1 = require("../types");
const URL = 'https://api.exchangerate.dev/v1/latest/USD?symbols=EUR,GBP,CHF,AUD,JPY,CAD,NZD';
const DEFAULT_POLL_MS = 120000;
/**
 * exchangerate.dev keyless fallback for forex.
 * Free tier is delayed by roughly 15 minutes, so the engine marks these
 * quotes as delayed and never triggers alerts from them.
 */
class ExchangerateProvider extends events_1.EventEmitter {
    constructor() {
        super();
        this.id = 'exchangerate.dev';
        this.timer = null;
        this.stopped = true;
        this.status = {
            id: 'exchangerate.dev',
            state: 'stopped',
            lastSuccessAt: null,
            lastError: null,
            quoteCount: 0
        };
        this.pollMs = (0, types_1.readPositiveInt)(process.env.FX_FALLBACK_POLL_MS, DEFAULT_POLL_MS, 'FX_FALLBACK_POLL_MS');
    }
    start() {
        if (!this.stopped)
            return;
        this.stopped = false;
        this.status = { ...this.status, state: 'starting' };
        this.emit('status', this.getStatus());
        void this.poll();
    }
    stop() {
        this.stopped = true;
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        this.status = { ...this.status, state: 'stopped' };
        this.emit('status', this.getStatus());
    }
    getStatus() {
        return { ...this.status };
    }
    schedule(delayMs) {
        if (this.stopped)
            return;
        this.timer = setTimeout(() => {
            this.timer = null;
            void this.poll();
        }, delayMs);
    }
    async poll() {
        if (this.stopped)
            return;
        try {
            const response = await fetch(URL, { signal: AbortSignal.timeout(8000) });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const payload = await response.json();
            if (this.stopped)
                return;
            const rates = payload.rates || {};
            const updatedMs = payload.data_updated_at ? Date.parse(payload.data_updated_at) : NaN;
            const timestamp = Number.isFinite(updatedMs)
                ? Math.floor(updatedMs / 1000)
                : Math.floor(Date.now() / 1000);
            const quoteAgeSeconds = Number.isFinite(updatedMs)
                ? Math.max(0, Math.floor((Date.now() - updatedMs) / 1000))
                : undefined;
            const marketOpen = payload.market_session === 'open';
            const providerStale = Object.values(payload.stale || {}).some(Boolean);
            const derived = [
                ['EURUSD', rates.EUR ? 1 / rates.EUR : undefined],
                ['GBPUSD', rates.GBP ? 1 / rates.GBP : undefined],
                ['AUDUSD', rates.AUD ? 1 / rates.AUD : undefined],
                ['USDCHF', rates.CHF],
                ['USDJPY', rates.JPY],
                ['USDCAD', rates.CAD],
                ['NZDUSD', rates.NZD ? 1 / rates.NZD : undefined],
                ['EURGBP', rates.EUR && rates.GBP ? rates.GBP / rates.EUR : undefined]
            ];
            let quoteCount = 0;
            for (const [pair, mid] of derived) {
                if (mid === undefined || !Number.isFinite(mid) || mid <= 0)
                    continue;
                const quote = {
                    pair,
                    bid: mid,
                    ask: mid,
                    timestamp,
                    source: 'exchangerate.dev',
                    marketOpen,
                    delayed: true,
                    quoteAgeSeconds,
                    providerStale
                };
                this.emit('quote', quote);
                quoteCount++;
            }
            if (quoteCount === 0) {
                throw new Error('No forex rates returned');
            }
            this.status = {
                id: 'exchangerate.dev',
                state: 'connected',
                lastSuccessAt: Date.now(),
                lastError: null,
                quoteCount
            };
            this.emit('status', this.getStatus());
            this.schedule(this.pollMs);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.status = {
                ...this.status,
                state: 'degraded',
                lastError: message
            };
            this.emit('status', this.getStatus());
            this.schedule(this.pollMs);
        }
    }
}
exports.ExchangerateProvider = ExchangerateProvider;
//# sourceMappingURL=exchangerate.js.map