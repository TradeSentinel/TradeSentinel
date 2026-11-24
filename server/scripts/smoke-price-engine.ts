import dotenv from 'dotenv';
import { PriceEngine } from '../src/prices/engine';
import { APP_PAIRS, CRYPTO_PAIRS, FOREX_PAIRS } from '../src/prices/pairs';
import { Quote } from '../src/prices/types';

dotenv.config();

interface LatestQuote {
    source: string;
    delayed: boolean;
    marketOpen: boolean;
    stale: boolean;
    bid: string;
    ask: string;
}

const engine = new PriceEngine();
const latest = new Map<string, LatestQuote>();
const startedAt = Date.now();

engine.on('quote', (quote: Quote) => {
    latest.set(quote.pair, {
        source: quote.source,
        delayed: quote.delayed,
        marketOpen: quote.marketOpen,
        stale: engine.isStale(quote),
        bid: quote.bid,
        ask: quote.ask
    });
});

engine.start();

setTimeout(() => {
    const elapsed = Math.round((Date.now() - startedAt) / 1000);
    const failures: string[] = [];

    for (const pair of FOREX_PAIRS) {
        const quote = latest.get(pair);
        if (!quote) {
            failures.push(`${pair}: missing`);
            continue;
        }
        if (quote.source !== 'biquote') failures.push(`${pair}: source=${quote.source}, expected biquote`);
        if (quote.delayed) failures.push(`${pair}: delayed, expected realtime`);
        if (quote.stale) failures.push(`${pair}: stale, expected fresh`);
        if (!quote.marketOpen) console.warn(`[smoke] ${pair}: market closed at test time`);
        console.log(`[smoke] ${pair.padEnd(7)} ${quote.bid}/${quote.ask} source=${quote.source} delayed=${quote.delayed} stale=${quote.stale}`);
    }

    for (const pair of CRYPTO_PAIRS) {
        const quote = latest.get(pair);
        if (!quote) {
            failures.push(`${pair}: missing`);
            continue;
        }
        if (quote.source !== 'coinbase') failures.push(`${pair}: source=${quote.source}, expected coinbase`);
        if (quote.delayed) failures.push(`${pair}: delayed, expected realtime`);
        if (quote.stale) failures.push(`${pair}: stale, expected fresh`);
        console.log(`[smoke] ${pair.padEnd(7)} ${quote.bid}/${quote.ask} source=${quote.source} delayed=${quote.delayed} stale=${quote.stale}`);
    }

    console.log(`[smoke] latest quotes for ${latest.size}/${APP_PAIRS.length} pairs after ${elapsed}s`);

    if (failures.length > 0) {
        console.error('[smoke] failures:');
        for (const failure of failures) {
            console.error(`  - ${failure}`);
        }
        console.error(JSON.stringify(engine.getStatus().providers, null, 2));
    } else {
        console.log('[smoke] PASS: all forex on biquote and all crypto on Coinbase, fresh and realtime.');
    }

    engine.stop();
    process.exit(failures.length > 0 ? 1 : 0);
}, 15000);
