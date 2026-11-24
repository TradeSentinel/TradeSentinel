import { EventEmitter } from 'events';
import { ProviderQuote, ProviderStatus, PriceSourceId, readPositiveInt } from '../types';

const URL = 'https://api.exchangerate.dev/v1/latest/USD?symbols=EUR,GBP,CHF,AUD,JPY,CAD,NZD';
const DEFAULT_POLL_MS = 120000;

interface ExchangerateResponse {
    result?: string;
    rates?: Record<string, number>;
    source?: string;
    market_session?: string;
    data_updated_at?: string;
    stale?: Record<string, boolean>;
}

/**
 * exchangerate.dev keyless fallback for forex.
 * Free tier is delayed by roughly 15 minutes, so the engine marks these
 * quotes as delayed and never triggers alerts from them.
 */
export class ExchangerateProvider extends EventEmitter {
    public readonly id: PriceSourceId = 'exchangerate.dev';
    private readonly pollMs: number;
    private timer: NodeJS.Timeout | null = null;
    private stopped = true;
    private status: ProviderStatus = {
        id: 'exchangerate.dev',
        state: 'stopped',
        lastSuccessAt: null,
        lastError: null,
        quoteCount: 0
    };

    constructor() {
        super();
        this.pollMs = readPositiveInt(process.env.FX_FALLBACK_POLL_MS, DEFAULT_POLL_MS, 'FX_FALLBACK_POLL_MS');
    }

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
            const response = await fetch(URL, { signal: AbortSignal.timeout(8000) });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const payload = await response.json() as ExchangerateResponse;
            if (this.stopped) return;
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

            const derived: Array<[string, number | undefined]> = [
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
                if (mid === undefined || !Number.isFinite(mid) || mid <= 0) continue;
                const quote: ProviderQuote = {
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
        } catch (error) {
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
