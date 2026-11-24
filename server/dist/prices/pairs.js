"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.APP_PAIRS = exports.CRYPTO_PAIRS = exports.FOREX_PAIRS = void 0;
exports.normalizePair = normalizePair;
exports.displayPair = displayPair;
exports.isSupportedPair = isSupportedPair;
exports.isCryptoPair = isCryptoPair;
exports.FOREX_PAIRS = [
    'EURUSD',
    'USDJPY',
    'GBPUSD',
    'USDCHF',
    'AUDUSD',
    'USDCAD',
    'NZDUSD',
    'EURGBP'
];
exports.CRYPTO_PAIRS = [
    'BTCUSD',
    'ETHUSD',
    'LTCUSD'
];
exports.APP_PAIRS = [...exports.FOREX_PAIRS, ...exports.CRYPTO_PAIRS];
function normalizePair(input) {
    return String(input || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}
function displayPair(input) {
    const pair = normalizePair(input);
    return pair.length === 6 ? `${pair.slice(0, 3)}/${pair.slice(3)}` : pair;
}
function isSupportedPair(input) {
    return exports.APP_PAIRS.includes(normalizePair(input));
}
function isCryptoPair(input) {
    return exports.CRYPTO_PAIRS.includes(normalizePair(input));
}
//# sourceMappingURL=pairs.js.map