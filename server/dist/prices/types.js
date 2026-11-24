"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readPositiveInt = readPositiveInt;
/**
 * Parse a positive integer environment value, falling back to the default
 * and warning once when the value is invalid.
 */
function readPositiveInt(value, fallback, name) {
    if (value === undefined || value.trim() === '')
        return fallback;
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0)
        return Math.floor(parsed);
    console.warn(`[config] Ignoring invalid ${name}=${value}; using ${fallback}`);
    return fallback;
}
//# sourceMappingURL=types.js.map