import assert from 'assert/strict';
import { PriceEngine } from '../src/prices/engine';
import { parseBiquotePayload } from '../src/prices/providers/biquote';

const now = Math.floor(Date.now() / 1000);
const options = { freshMs: 5000, maxSourceAgeSeconds: 10 };

function freshQuote(overrides: Partial<Parameters<PriceEngine['ingest']>[0]> = {}) {
    return {
        pair: 'EURUSD',
        bid: 1.1,
        ask: 1.1001,
        timestamp: now,
        source: 'biquote' as const,
        marketOpen: true,
        ...overrides
    };
}

// Parser: map keyed by symbol, the live shape observed on 2026-11-24.
const mapPayload = {
    EURUSD: {
        symbol: 'EURUSD',
        bid: 1.09339,
        ask: 1.09345,
        timestamp: new Date(now * 1000).toISOString(),
        marketState: 'open',
        quoteAgeSeconds: 1,
        stale: false
    }
};
const mapQuotes = parseBiquotePayload(mapPayload);
assert.equal(mapQuotes.length, 1);
assert.equal(mapQuotes[0].pair, 'EURUSD');
assert.equal(mapQuotes[0].marketOpen, true);
assert.equal(mapQuotes[0].providerStale, false);
assert.equal(mapQuotes[0].quoteAgeSeconds, 1);
console.log('PASS parser: map payload');

// Parser: array shape, string numbers, stale flag, missing timestamp.
const arrayPayload = [{
    symbol: 'GBPUSD',
    bid: '1.2',
    ask: '1.2001',
    marketState: 'open',
    quoteAgeSeconds: '2',
    stale: 'true'
}];
const arrayQuotes = parseBiquotePayload(arrayPayload);
assert.equal(arrayQuotes.length, 1);
assert.equal(arrayQuotes[0].pair, 'GBPUSD');
assert.equal(arrayQuotes[0].providerStale, true);
assert.equal(arrayQuotes[0].timestamp, 0);
console.log('PASS parser: array payload and stale flag');

assert.deepEqual(parseBiquotePayload({ EURUSD: { bid: 0, ask: 0 } }), []);
assert.deepEqual(parseBiquotePayload(null), []);
console.log('PASS parser: invalid records rejected');

// Alert gate: fresh, closed, delayed, stale source age, frozen timestamp, provider stale.
for (const testCase of [
    { name: 'fresh', quote: freshQuote(), expected: true },
    { name: 'closed market', quote: freshQuote({ marketOpen: false }), expected: false },
    { name: 'delayed fallback', quote: freshQuote({ source: 'exchangerate.dev', delayed: true }), expected: false },
    { name: 'stale quote age', quote: freshQuote({ quoteAgeSeconds: 60 }), expected: false },
    { name: 'frozen provider timestamp', quote: freshQuote({ timestamp: now - 60 }), expected: false },
    { name: 'provider stale flag', quote: freshQuote({ providerStale: true }), expected: false }
]) {
    const engine = new PriceEngine(options);
    engine.ingest(testCase.quote);
    const quote = engine.getSnapshot(['EURUSD'])[0];
    assert.equal(engine.canTriggerAlerts(quote), testCase.expected, testCase.name);
    console.log(`PASS gate: ${testCase.name} -> ${testCase.expected}`);
}

// Preferred source suppression and fallback promotion.
const priority = new PriceEngine(options);
priority.ingest(freshQuote());
priority.ingest(freshQuote({ source: 'exchangerate.dev', delayed: true, bid: 9, ask: 9 }));
assert.equal(priority.getSnapshot(['EURUSD'])[0].source, 'biquote');
console.log('PASS priority: fresh biquote suppresses delayed fallback');

const fallback = new PriceEngine(options);
fallback.ingest(freshQuote({ timestamp: now - 60 }));
fallback.ingest(freshQuote({ source: 'exchangerate.dev', delayed: true, timestamp: now - 900 }));
assert.equal(fallback.getSnapshot(['EURUSD'])[0].source, 'exchangerate.dev');
console.log('PASS fallback: stale biquote promotes exchangerate.dev');

// Snapshot and status expose staleness.
const status = fallback.getStatus();
const eurusd = status.pairs.find(pair => pair.pair === 'EURUSD');
assert.ok(eurusd);
assert.equal(eurusd?.stale, true);
assert.equal(eurusd?.delayed, true);
console.log('PASS status: pair staleness and delay are exposed');

console.log('\nAll price engine tests passed.');
