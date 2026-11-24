import dotenv from 'dotenv';
import { PriceEngine } from '../src/prices/engine';
import { APP_PAIRS } from '../src/prices/pairs';

dotenv.config();

const engine = new PriceEngine();
const seen = new Map<string, string>();
const startedAt = Date.now();

engine.on('quote', (quote: { pair: string; bid: string; ask: string; source: string; delayed: boolean; marketOpen: boolean }) => {
    if (seen.has(quote.pair)) return;
    seen.set(quote.pair, `${quote.bid}/${quote.ask}`);
    console.log(`[smoke] ${quote.pair.padEnd(7)} bid=${quote.bid} ask=${quote.ask} source=${quote.source} delayed=${quote.delayed} open=${quote.marketOpen}`);
});

engine.start();

setTimeout(() => {
    const elapsed = Math.round((Date.now() - startedAt) / 1000);
    const missing = APP_PAIRS.filter(pair => !seen.has(pair));

    console.log(`[smoke] received ${seen.size}/${APP_PAIRS.length} pairs in ${elapsed}s`);
    if (missing.length > 0) {
        console.error(`[smoke] missing: ${missing.join(', ')}`);
        console.error(JSON.stringify(engine.getStatus().providers, null, 2));
    }

    engine.stop();
    process.exit(missing.length > 0 ? 1 : 0);
}, 15000);
