export type PriceSourceId = 'biquote' | 'coinbase' | 'exchangerate.dev';

export interface ProviderQuote {
    pair: string; // normalized, e.g. EURUSD
    bid: number;
    ask: number;
    timestamp: number; // unix seconds
    source: PriceSourceId;
    marketOpen: boolean;
    delayed?: boolean;
    quoteAgeSeconds?: number;
}

export interface Quote {
    pair: string;
    bid: string;
    ask: string;
    timestamp: number; // unix seconds
    source: PriceSourceId;
    marketOpen: boolean;
    delayed: boolean;
    quoteAgeSeconds?: number;
    receivedAt: number; // ms epoch
}

export type ProviderState = 'starting' | 'connected' | 'degraded' | 'stopped';

export interface ProviderStatus {
    id: PriceSourceId;
    state: ProviderState;
    lastSuccessAt: number | null;
    lastError: string | null;
    quoteCount: number;
}

export interface PriceEnginePairStatus {
    pair: string;
    displayPair: string;
    missing?: boolean;
    bid?: string;
    ask?: string;
    timestamp?: number;
    source?: PriceSourceId;
    receivedAt?: number;
    stale?: boolean;
    delayed?: boolean;
    marketOpen?: boolean;
}

export interface PriceEngineStatus {
    now: number;
    providers: ProviderStatus[];
    pairs: PriceEnginePairStatus[];
}
