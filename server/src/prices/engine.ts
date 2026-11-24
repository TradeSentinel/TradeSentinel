import { EventEmitter } from 'events';
import { APP_PAIRS, displayPair, isCryptoPair, isSupportedPair, normalizePair } from './pairs';
import { ProviderQuote, ProviderStatus, PriceEngineStatus, Quote, readPositiveInt } from './types';
import { BiquoteProvider } from './providers/biquote';
import { CoinbaseProvider } from './providers/coinbase';
import { ExchangerateProvider } from './providers/exchangerate';

interface ProviderLike extends EventEmitter {
    id: string;
    start(): void;
    stop(): void;
    getStatus(): ProviderStatus;
}

interface PriceEngineOptions {
    freshMs?: number;
    maxSourceAgeSeconds?: number;
}

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
export class PriceEngine extends EventEmitter {
    private readonly quotes = new Map<string, Quote>();
    private readonly providers: ProviderLike[];
    private readonly freshMs: number;
    private readonly maxSourceAgeSeconds: number;
    private started = false;

    constructor(options: PriceEngineOptions = {}) {
        super();
        this.freshMs = options.freshMs ?? readPositiveInt(process.env.PRICE_STALE_MS, 5000, 'PRICE_STALE_MS');
        this.maxSourceAgeSeconds = options.maxSourceAgeSeconds
            ?? readPositiveInt(process.env.PRICE_MAX_SOURCE_AGE_SECONDS, 10, 'PRICE_MAX_SOURCE_AGE_SECONDS');

        this.providers = [
            new BiquoteProvider(),
            new CoinbaseProvider(),
            new ExchangerateProvider()
        ];

        for (const provider of this.providers) {
            provider.on('quote', (quote: ProviderQuote) => this.ingest(quote));
            provider.on('status', () => this.emit('status', this.getStatus()));
        }
    }

    public start(): void {
        if (this.started) return;
        this.started = true;
        for (const provider of this.providers) {
            provider.start();
        }
    }

    public stop(): void {
        if (!this.started) return;
        this.started = false;
        for (const provider of this.providers) {
            provider.stop();
        }
    }

    public ingest(quote: ProviderQuote): void {
        const pair = normalizePair(quote.pair);
        if (!isSupportedPair(pair)) return;

        const preferred = isCryptoPair(pair) ? 'coinbase' : 'biquote';
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

        const normalized: Quote = {
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

    public isStale(quote: Quote): boolean {
        if (Date.now() - quote.receivedAt > this.freshMs) return true;
        if (quote.providerStale) return true;
        if (quote.quoteAgeSeconds !== undefined && quote.quoteAgeSeconds > this.maxSourceAgeSeconds) return true;
        if (!Number.isFinite(quote.timestamp) || quote.timestamp <= 0) return true;

        const sourceAgeSeconds = Math.floor(Date.now() / 1000) - quote.timestamp;
        return sourceAgeSeconds > this.maxSourceAgeSeconds;
    }

    public canTriggerAlerts(quote: Quote): boolean {
        return !quote.delayed && quote.marketOpen && !this.isStale(quote);
    }

    public getSnapshot(pairs: string[]): Quote[] {
        const snapshot: Quote[] = [];
        for (const input of pairs) {
            const pair = normalizePair(input);
            if (!isSupportedPair(pair)) continue;
            const quote = this.quotes.get(pair);
            if (quote) snapshot.push(quote);
        }
        return snapshot;
    }

    public getStatus(): PriceEngineStatus {
        return {
            now: Date.now(),
            providers: this.providers.map(provider => provider.getStatus()),
            pairs: APP_PAIRS.map(pair => {
                const quote = this.quotes.get(pair);
                if (!quote) {
                    return { pair, displayPair: displayPair(pair), missing: true };
                }
                return {
                    pair,
                    displayPair: displayPair(pair),
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

    private isSourceStale(quote: ProviderQuote): boolean {
        if (quote.providerStale) return true;
        if (quote.quoteAgeSeconds !== undefined && quote.quoteAgeSeconds > this.maxSourceAgeSeconds) return true;
        if (!Number.isFinite(quote.timestamp) || quote.timestamp <= 0) return true;

        const sourceAgeSeconds = Math.floor(Date.now() / 1000) - quote.timestamp;
        return sourceAgeSeconds > this.maxSourceAgeSeconds;
    }

    private formatPrice(pair: string, value: number): string {
        if (!Number.isFinite(value)) return '';
        if (isCryptoPair(pair)) {
            return value >= 1000 ? value.toFixed(2) : value.toFixed(3);
        }
        if (pair.endsWith('JPY')) {
            return value.toFixed(3);
        }
        return value.toFixed(5);
    }
}
