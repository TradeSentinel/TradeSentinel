"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BiquoteProvider = void 0;
exports.parseBiquotePayload = parseBiquotePayload;
const events_1 = require("events");
const pairs_1 = require("../pairs");
const types_1 = require("../types");
const DEFAULT_BASE_URL = 'https://biquote.io';
const DEFAULT_POLL_MS = 1000;
function asRecord(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        return null;
    return value;
}
/**
 * Parse both payload shapes biquote has used: a map keyed by symbol and an
 * array of records with a symbol field. Exported so the contract is covered
 * by a fixture test.
 */
function parseBiquotePayload(payload) {
    const records = [];
    if (Array.isArray(payload)) {
        for (const value of payload) {
            const record = asRecord(value);
            if (record)
                records.push(record);
        }
    }
    else if (payload && typeof payload === 'object') {
        for (const [key, value] of Object.entries(payload)) {
            const record = asRecord(value);
            if (record)
                records.push({ ...record, symbol: record.symbol || key });
        }
    }
    const quotes = [];
    for (const record of records) {
        const pair = (0, pairs_1.normalizePair)(record.symbol || '');
        if (!pairs_1.APP_PAIRS.includes(pair))
            continue;
        const bid = Number(record.bid);
        const ask = Number(record.ask);
        if (!Number.isFinite(bid) || !Number.isFinite(ask) || bid <= 0 || ask <= 0)
            continue;
        const parsedTimestamp = record.timestamp ? Date.parse(record.timestamp) : NaN;
        const timestamp = Number.isFinite(parsedTimestamp) ? Math.floor(parsedTimestamp / 1000) : 0;
        const rawAge = typeof record.quoteAgeSeconds === 'number'
            ? record.quoteAgeSeconds
            : typeof record.quoteAgeSeconds === 'string'
                ? Number(record.quoteAgeSeconds)
                : NaN;
        const quoteAgeSeconds = Number.isFinite(rawAge) && rawAge >= 0 ? rawAge : undefined;
        const providerStale = record.stale === true || record.stale === 'true';
        quotes.push({
            pair,
            bid,
            ask,
            timestamp,
            source: 'biquote',
            marketOpen: String(record.marketState || '').toLowerCase() === 'open',
            quoteAgeSeconds,
            providerStale: providerStale || timestamp === 0
        });
    }
    return quotes;
}
/**
 * biquote.io free market data feed.
 * One batched request per second returns every supported pair with bid/ask.
 * Terms allow in-product display; the raw feed may not be resold.
 */
class BiquoteProvider extends events_1.EventEmitter {
    constructor() {
        super();
        this.id = 'biquote';
        this.timer = null;
        this.stopped = true;
        this.failures = 0;
        this.status = {
            id: 'biquote',
            state: 'stopped',
            lastSuccessAt: null,
            lastError: null,
            quoteCount: 0
        };
        this.baseUrl = process.env.BIQUOTE_BASE_URL || DEFAULT_BASE_URL;
        this.pollMs = (0, types_1.readPositiveInt)(process.env.PRICE_POLL_MS, DEFAULT_POLL_MS, 'PRICE_POLL_MS');
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
            const query = pairs_1.APP_PAIRS.map(pair => `symbols=${encodeURIComponent(pair)}`).join('&');
            const response = await fetch(`${this.baseUrl}/api/latest?${query}`, {
                signal: AbortSignal.timeout(5000)
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const payload = await response.json();
            if (this.stopped)
                return;
            const quotes = parseBiquotePayload(payload);
            if (quotes.length === 0) {
                throw new Error('No quotes returned');
            }
            for (const quote of quotes) {
                this.emit('quote', quote);
            }
            this.failures = 0;
            this.status = {
                id: 'biquote',
                state: 'connected',
                lastSuccessAt: Date.now(),
                lastError: null,
                quoteCount: quotes.length
            };
            this.emit('status', this.getStatus());
            this.schedule(this.pollMs);
        }
        catch (error) {
            this.failures++;
            const message = error instanceof Error ? error.message : String(error);
            this.status = {
                ...this.status,
                state: 'degraded',
                lastError: message
            };
            this.emit('status', this.getStatus());
            const delay = Math.min(30000, this.pollMs * Math.pow(2, Math.min(this.failures, 5)));
            this.schedule(delay);
        }
    }
}
exports.BiquoteProvider = BiquoteProvider;
//# sourceMappingURL=biquote.js.map