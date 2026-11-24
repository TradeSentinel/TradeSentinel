import assert from 'assert/strict';
import WebSocket from 'ws';

interface SnapshotQuote {
    pair: string;
    displayPair: string;
    bid: string;
    ask: string;
    stale: boolean;
    delayed: boolean;
    receivedAt: number;
    timestamp: number;
}

const url = process.env.WS_TEST_URL || 'ws://localhost:8787';
const ws = new WebSocket(url, {
    origin: process.env.WS_TEST_ORIGIN
});
let gotSnapshot = false;
let gotPrice = false;

const timer = setTimeout(() => {
    console.error(`[ws-test] timeout waiting for ${url}`);
    process.exit(1);
}, 15000);

ws.on('open', () => {
    console.log(`[ws-test] connected to ${url}`);
    ws.send(JSON.stringify({ type: 'subscribe_prices', pairs: ['EURUSD', 'BTCUSD'] }));
});

ws.on('message', (data: WebSocket.RawData) => {
    const message = JSON.parse(data.toString()) as {
        type?: string;
        pairs?: string[];
        quotes?: SnapshotQuote[];
        pair?: string;
        displayPair?: string;
        bid?: string;
        ask?: string;
        stale?: boolean;
        delayed?: boolean;
        timestamp?: number;
        source?: string;
        marketOpen?: boolean;
        receivedAt?: number;
    };

    switch (message.type) {
        case 'subscribed_prices':
            assert.ok(Array.isArray(message.pairs), 'subscribed_prices.pairs must be an array');
            console.log('[ws-test] subscribed:', message.pairs.join(','));
            break;

        case 'price_snapshot':
            assert.ok(Array.isArray(message.quotes), 'price_snapshot.quotes must be an array');
            for (const quote of message.quotes) {
                assert.equal(typeof quote.pair, 'string');
                assert.equal(typeof quote.displayPair, 'string');
                assert.equal(typeof quote.bid, 'string');
                assert.equal(typeof quote.ask, 'string');
                assert.equal(typeof quote.stale, 'boolean');
                assert.equal(typeof quote.delayed, 'boolean');
                assert.equal(typeof quote.receivedAt, 'number');
                assert.equal(typeof quote.timestamp, 'number');
            }
            gotSnapshot = true;
            console.log('[ws-test] snapshot:', message.quotes.map(quote => quote.displayPair).join(','));
            break;

        case 'price':
            assert.equal(typeof message.pair, 'string');
            assert.equal(typeof message.displayPair, 'string');
            assert.equal(typeof message.bid, 'string');
            assert.equal(typeof message.ask, 'string');
            assert.equal(typeof message.stale, 'boolean');
            assert.equal(typeof message.timestamp, 'number');
            assert.equal(typeof message.source, 'string');
            assert.equal(typeof message.delayed, 'boolean');
            assert.equal(typeof message.marketOpen, 'boolean');
            assert.equal(typeof message.receivedAt, 'number');
            gotPrice = true;
            console.log(`[ws-test] price: ${message.displayPair} ${message.bid}/${message.ask} source=${message.source} stale=${message.stale}`);
            break;

        default:
            break;
    }

    if (gotSnapshot && gotPrice) {
        clearTimeout(timer);
        ws.close();
        console.log('[ws-test] PASS');
        process.exit(0);
    }
});

ws.on('error', (error) => {
    console.error('[ws-test] error:', error.message);
    process.exit(1);
});
