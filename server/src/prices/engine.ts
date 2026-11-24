import { EventEmitter } from 'events';
import { APP_PAIRS, displayPair, isCryptoPair, isSupportedPair, normalizePair } from './pairs';
import { ProviderQuote, ProviderStatus, PriceEngineStatus, Quote } from './types';
import { BiquoteProvider } from './providers/biquote';
import { CoinbaseProvider } from './providers/coinbase';
import { ExchangerateProvider } from './providers/exchangerate';

const FRESH_MS = Number(process.env.PRICE_STALE_MS || 5000);
const MAX_SOURCE_AGE_SECONDS = Number(process.env.PRICE_MAX_SOURCE_AGE_SECONDS || 10);

interface ProviderLike extends EventEmitter {
    id: string;
    start(): void;
    stop(): void;
    getStatus(): ProviderStatus;
}

/**
 * Owns the upstream market data connections and produces one normalized
 * quote stream for both the browser hub and the alert evaluator.
 *
 * Routing:
 * - forex: biquote primary, exchangerate.dev delayed fallback
 * - crypto: Coinbase primary, biquote fallback
 *
 * A fallback quote is ignored while the preferred source is fresh, so the
 * displayed price does not flicker between venues.
 */
export class PriceEngine extends EventEmitter {
    private readonly quotes = new Map<string, Quote>();
    private readonly providers: ProviderLike[];
    private started = false;

    constructor() {
        super();
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

        const normalized: Quote = {
            pair,
            bid: this.formatPrice(pair, quote.bid),
            ask: this.formatPrice(pair, quote.ask),
            timestamp: Math.floor(quote.timestamp),
            source: quote.source,
            marketOpen: quote.marketOpen,
            delayed: Boolean(quote.delayed),
            quoteAgeSeconds: quote.quoteAgeSeconds,
            receivedAt: Date.now()
        };

        this.quotes.set(pair, normalized);
        this.emit('quote', normalized);
    }

    public isStale(quote: Quote): boolean {
        if (Date.now() - quote.receivedAt > FRESH_MS) return true;
        if (quote.quoteAgeSeconds !== undefined && quote.quoteAgeSeconds > MAX_SOURCE_AGE_SECONDS) return true;
        return false;
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
                    marketOpen: quote.marketOpen
                };
            })
        };
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
