export const FOREX_PAIRS = [
    'EURUSD',
    'USDJPY',
    'GBPUSD',
    'USDCHF',
    'AUDUSD',
    'USDCAD',
    'NZDUSD',
    'EURGBP'
] as const;

export const CRYPTO_PAIRS = [
    'BTCUSD',
    'ETHUSD',
    'LTCUSD'
] as const;

export const APP_PAIRS = [...FOREX_PAIRS, ...CRYPTO_PAIRS] as const;

export type AppPair = typeof APP_PAIRS[number];

export function normalizePair(input: string): string {
    return String(input || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function displayPair(input: string): string {
    const pair = normalizePair(input);
    return pair.length === 6 ? `${pair.slice(0, 3)}/${pair.slice(3)}` : pair;
}

export function isSupportedPair(input: string): boolean {
    return (APP_PAIRS as readonly string[]).includes(normalizePair(input));
}

export function isCryptoPair(input: string): boolean {
    return (CRYPTO_PAIRS as readonly string[]).includes(normalizePair(input));
}
