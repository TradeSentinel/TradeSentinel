import { EventEmitter } from 'events';
import { APP_PAIRS, normalizePair } from '../pairs';
import { ProviderQuote, ProviderStatus, PriceSourceId } from '../types';

interface BiquoteRecord {
    symbol?: string;
    bid?: number | string;
    ask?: number | string;
    timestamp?: string;
    marketState?: string;
    quoteAgeSeconds?: number;
    stale?: boolean;
}

const DEFAULT_BASE_URL = 'https://biquote.io';
const DEFAULT_POLL_MS = 1000;

/**
 * biquote.io free market data feed.
 * One batched request per second returns every supported pair with bid/ask.
 * Terms allow in-product display; the raw feed may not be resold.
 */
export class BiquoteProvider extends EventEmitter {
    public readonly id: PriceSourceId = 'biquote';
    private readonly baseUrl = process.env.BIQUOTE_BASE_URL || DEFAULT_BASE_URL;
    private readonly pollMs = Number(process.env.PRICE_POLL_MS || DEFAULT_POLL_MS);
    private timer: NodeJS.Timeout | null = null;
    private stopped = true;
    private failures = 0;
    private status: ProviderStatus = {
        id: 'biquote',
        state: 'stopped',
        lastSuccessAt: null,
        lastError: null,
        quoteCount: 0
    };

    public start(): void {
        if (!this.stopped) return;
        this.stopped = false;
        this.status = { ...this.status, state: 'starting' };
        this.emit('status', this.getStatus());
        void this.poll();
    }

    public stop(): void {
        this.stopped = true;
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        this.status = { ...this.status, state: 'stopped' };
        this.emit('status', this.getStatus());
    }

    public getStatus(): ProviderStatus {
        return { ...this.status };
    }

    private schedule(delayMs: number): void {
        if (this.stopped) return;
        this.timer = setTimeout(() => {
            this.timer = null;
            void this.poll();
        }, delayMs);
    }

    private async poll(): Promise<void> {
        if (this.stopped) return;

        try {
            const query = APP_PAIRS.map(pair => `symbols=${encodeURIComponent(pair)}`).join('&');
            const response = await fetch(`${this.baseUrl}/api/latest?${query}`, {
                signal: AbortSignal.timeout(5000)
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const payload = await response.json() as Record<string, BiquoteRecord>;
            let quoteCount = 0;

            for (const [symbol, record] of Object.entries(payload)) {
                const pair = normalizePair(symbol);
                if (!(APP_PAIRS as readonly string[]).includes(pair)) continue;

                const bid = Number(record.bid);
                const ask = Number(record.ask);
                if (!Number.isFinite(bid) || !Number.isFinite(ask) || bid <= 0 || ask <= 0) continue;

                const parsedTimestamp = record.timestamp ? Date.parse(record.timestamp) : NaN;
                const timestamp = Number.isFinite(parsedTimestamp)
                    ? Math.floor(parsedTimestamp / 1000)
                    : Math.floor(Date.now() / 1000);

                const quote: ProviderQuote = {
                    pair,
                    bid,
                    ask,
                    timestamp,
                    source: 'biquote',
                    marketOpen: record.marketState === 'open',
                    quoteAgeSeconds: typeof record.quoteAgeSeconds === 'number' ? record.quoteAgeSeconds : undefined
                };

                this.emit('quote', quote);
                quoteCount++;
            }

            if (quoteCount === 0) {
                throw new Error('No quotes returned');
            }

            this.failures = 0;
            this.status = {
                id: 'biquote',
                state: 'connected',
                lastSuccessAt: Date.now(),
                lastError: null,
                quoteCount
            };
            this.emit('status', this.getStatus());
            this.schedule(this.pollMs);
        } catch (error) {
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
