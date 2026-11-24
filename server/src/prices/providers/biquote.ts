import { EventEmitter } from 'events';
import { APP_PAIRS, normalizePair } from '../pairs';
import { ProviderQuote, ProviderStatus, PriceSourceId, readPositiveInt } from '../types';

interface BiquoteRecord {
    symbol?: string;
    bid?: number | string;
    ask?: number | string;
    timestamp?: string | number;
    marketState?: string;
    quoteAgeSeconds?: number | string;
    stale?: boolean | string;
}

const DEFAULT_BASE_URL = 'https://biquote.io';
const DEFAULT_POLL_MS = 1000;

function asRecord(value: unknown): BiquoteRecord | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    return value as BiquoteRecord;
}

/**
 * Parse both payload shapes biquote has used: a map keyed by symbol and an
 * array of records with a symbol field. Exported so the contract is covered
 * by a fixture test.
 */
export function parseBiquotePayload(payload: unknown): ProviderQuote[] {
    const records: BiquoteRecord[] = [];

    if (Array.isArray(payload)) {
        for (const value of payload) {
            const record = asRecord(value);
            if (record) records.push(record);
        }
    } else if (payload && typeof payload === 'object') {
        for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
            const record = asRecord(value);
            if (record) records.push({ ...record, symbol: record.symbol || key });
        }
    }

    const quotes: ProviderQuote[] = [];

    for (const record of records) {
        const pair = normalizePair(record.symbol || '');
        if (!(APP_PAIRS as readonly string[]).includes(pair)) continue;

        const bid = Number(record.bid);
        const ask = Number(record.ask);
        if (!Number.isFinite(bid) || !Number.isFinite(ask) || bid <= 0 || ask <= 0) continue;

        const parsedTimestamp = (() => {
            const raw = record.timestamp;
            if (typeof raw === 'number') return raw;
            if (typeof raw === 'string' && raw.trim() !== '') {
                const iso = Date.parse(raw);
                if (Number.isFinite(iso)) return iso;

                const numeric = Number(raw);
                if (Number.isFinite(numeric)) return numeric;
            }
            return NaN;
        })();
        const timestamp = Number.isFinite(parsedTimestamp)
            ? Math.floor(parsedTimestamp > 1e12 ? parsedTimestamp / 1000 : parsedTimestamp)
            : 0;

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
export class BiquoteProvider extends EventEmitter {
    public readonly id: PriceSourceId = 'biquote';
    private readonly baseUrl: string;
    private readonly pollMs: number;
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

    constructor() {
        super();
        this.baseUrl = process.env.BIQUOTE_BASE_URL || DEFAULT_BASE_URL;
        this.pollMs = readPositiveInt(process.env.PRICE_POLL_MS, DEFAULT_POLL_MS, 'PRICE_POLL_MS');
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
            const query = APP_PAIRS.map(pair => `symbols=${encodeURIComponent(pair)}`).join('&');
            const response = await fetch(`${this.baseUrl}/api/latest?${query}`, {
                signal: AbortSignal.timeout(5000)
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const payload = await response.json();
            if (this.stopped) return;

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
