export type PriceSourceId = 'biquote' | 'coinbase' | 'exchangerate.dev';

export interface ProviderQuote {
    pair: string; // normalized, e.g. EURUSD
    bid: number;
    ask: number;
    timestamp: number; // source timestamp, unix seconds, 0 when unknown
    source: PriceSourceId;
    marketOpen: boolean;
    delayed?: boolean;
    quoteAgeSeconds?: number;
    providerStale?: boolean;
}

export interface Quote {
    pair: string;
    bid: string;
    ask: string;
    timestamp: number; // source timestamp, unix seconds, 0 when unknown
    source: PriceSourceId;
    marketOpen: boolean;
    delayed: boolean;
    quoteAgeSeconds?: number;
    providerStale?: boolean;
    receivedAt: number; // server receive time, ms epoch
}

export type ProviderState = 'starting' | 'connected' | 'degraded' | 'stopped';

export interface ProviderStatus {
    id: PriceSourceId;
    state: ProviderState;
    lastSuccessAt: number | null; // ms epoch
    lastError: string | null;
    quoteCount: number;
}

export interface PriceEnginePairStatus {
    pair: string;
    displayPair: string;
    missing?: boolean;
    bid?: string;
    ask?: string;
    timestamp?: number; // source timestamp, unix seconds
    source?: PriceSourceId;
    receivedAt?: number; // ms epoch
    stale?: boolean;
    delayed?: boolean;
    marketOpen?: boolean;
    quoteAgeSeconds?: number;
}

export interface PriceEngineStatus {
    now: number; // ms epoch
    providers: ProviderStatus[];
    pairs: PriceEnginePairStatus[];
}

/**
 * Parse a positive integer environment value, falling back to the default
 * and warning once when the value is invalid.
 */
export function readPositiveInt(value: string | undefined, fallback: number, name: string): number {
    if (value === undefined || value.trim() === '') return fallback;
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) return Math.floor(parsed);
    console.warn(`[config] Ignoring invalid ${name}=${value}; using ${fallback}`);
    return fallback;
}
