"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceEngine = void 0;
const events_1 = require("events");
const pairs_1 = require("./pairs");
const types_1 = require("./types");
const biquote_1 = require("./providers/biquote");
const coinbase_1 = require("./providers/coinbase");
const exchangerate_1 = require("./providers/exchangerate");
/**
 * Owns the upstream market data connections and produces one normalized
 * quote stream for both the browser hub and the alert evaluator.
 *
 * Routing:
 * - forex: biquote primary, exchangerate.dev delayed fallback
 * - crypto: Coinbase primary, biquote fallback
 *
 * Freshness is decided from three independent signals: the server receive
 * time, the provider quote age, and the provider timestamp. A frozen provider
 * timestamp can never be re-stamped as fresh by a successful poll.
 */
class PriceEngine extends events_1.EventEmitter {
    constructor(options = {}) {
        super();
        this.quotes = new Map();
        this.started = false;
        this.freshMs = options.freshMs ?? (0, types_1.readPositiveInt)(process.env.PRICE_STALE_MS, 5000, 'PRICE_STALE_MS');
        this.maxSourceAgeSeconds = options.maxSourceAgeSeconds
            ?? (0, types_1.readPositiveInt)(process.env.PRICE_MAX_SOURCE_AGE_SECONDS, 10, 'PRICE_MAX_SOURCE_AGE_SECONDS');
        this.providers = [
            new biquote_1.BiquoteProvider(),
            new coinbase_1.CoinbaseProvider(),
            new exchangerate_1.ExchangerateProvider()
        ];
        for (const provider of this.providers) {
            provider.on('quote', (quote) => this.ingest(quote));
            provider.on('status', () => this.emit('status', this.getStatus()));
        }
    }
    start() {
        if (this.started)
            return;
        this.started = true;
        for (const provider of this.providers) {
            provider.start();
        }
    }
    stop() {
        if (!this.started)
            return;
        this.started = false;
        for (const provider of this.providers) {
            provider.stop();
        }
    }
    ingest(quote) {
        const pair = (0, pairs_1.normalizePair)(quote.pair);
        if (!(0, pairs_1.isSupportedPair)(pair))
            return;
        const preferred = (0, pairs_1.isCryptoPair)(pair) ? 'coinbase' : 'biquote';
        const existing = this.quotes.get(pair);
        if (quote.source !== preferred && existing && existing.source === preferred && !this.isStale(existing)) {
            return;
        }
        // Do not replace a fresher displayed quote with a stale one. A stale
        // quote is still stored when nothing better exists, so the UI can show
        // it with a stale flag while alerts stay suppressed.
        if (this.isSourceStale(quote) && existing && !this.isStale(existing)) {
            return;
        }
        const normalized = {
            pair,
            bid: this.formatPrice(pair, quote.bid),
            ask: this.formatPrice(pair, quote.ask),
            timestamp: Math.floor(quote.timestamp),
            source: quote.source,
            marketOpen: quote.marketOpen,
            delayed: Boolean(quote.delayed),
            quoteAgeSeconds: quote.quoteAgeSeconds,
            providerStale: Boolean(quote.providerStale),
            receivedAt: Date.now()
        };
        this.quotes.set(pair, normalized);
        this.emit('quote', normalized);
    }
    isStale(quote) {
        if (Date.now() - quote.receivedAt > this.freshMs)
            return true;
        if (quote.providerStale)
            return true;
        if (quote.quoteAgeSeconds !== undefined && quote.quoteAgeSeconds > this.maxSourceAgeSeconds)
            return true;
        if (!Number.isFinite(quote.timestamp) || quote.timestamp <= 0)
            return true;
        const sourceAgeSeconds = Math.floor(Date.now() / 1000) - quote.timestamp;
        return sourceAgeSeconds > this.maxSourceAgeSeconds;
    }
    canTriggerAlerts(quote) {
        return !quote.delayed && quote.marketOpen && !this.isStale(quote);
    }
    getSnapshot(pairs) {
        const snapshot = [];
        for (const input of pairs) {
            const pair = (0, pairs_1.normalizePair)(input);
            if (!(0, pairs_1.isSupportedPair)(pair))
                continue;
            const quote = this.quotes.get(pair);
            if (quote)
                snapshot.push(quote);
        }
        return snapshot;
    }
    getStatus() {
        return {
            now: Date.now(),
            providers: this.providers.map(provider => provider.getStatus()),
            pairs: pairs_1.APP_PAIRS.map(pair => {
                const quote = this.quotes.get(pair);
                if (!quote) {
                    return { pair, displayPair: (0, pairs_1.displayPair)(pair), missing: true };
                }
                return {
                    pair,
                    displayPair: (0, pairs_1.displayPair)(pair),
                    bid: quote.bid,
                    ask: quote.ask,
                    timestamp: quote.timestamp,
                    source: quote.source,
                    receivedAt: quote.receivedAt,
                    stale: this.isStale(quote),
                    delayed: quote.delayed,
                    marketOpen: quote.marketOpen,
                    quoteAgeSeconds: quote.quoteAgeSeconds
                };
            })
        };
    }
    isSourceStale(quote) {
        if (quote.providerStale)
            return true;
        if (quote.quoteAgeSeconds !== undefined && quote.quoteAgeSeconds > this.maxSourceAgeSeconds)
            return true;
        if (!Number.isFinite(quote.timestamp) || quote.timestamp <= 0)
            return true;
        const sourceAgeSeconds = Math.floor(Date.now() / 1000) - quote.timestamp;
        return sourceAgeSeconds > this.maxSourceAgeSeconds;
    }
    formatPrice(pair, value) {
        if (!Number.isFinite(value))
            return '';
        if ((0, pairs_1.isCryptoPair)(pair)) {
            return value >= 1000 ? value.toFixed(2) : value.toFixed(3);
        }
        if (pair.endsWith('JPY')) {
            return value.toFixed(3);
        }
        return value.toFixed(5);
    }
}
exports.PriceEngine = PriceEngine;
//# sourceMappingURL=engine.js.map