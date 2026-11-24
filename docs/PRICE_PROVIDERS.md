# Price provider notes

Checked 2026-11-24. These notes are an engineering record, not legal advice.

## biquote.io (primary forex, crypto fallback)

- Free, no key, no signup.
- Batch endpoint used by the engine: `GET https://biquote.io/api/latest?symbols=EURUSD&symbols=GBPUSD...`
  Repeat `symbols`, do not comma-separate. A comma-separated request returns `{}`.
- Returned all 11 app pairs with `bid`, `ask`, `mid`, `timestamp`, `quoteAgeSeconds`, `stale` and `marketState`.
  Observed quote age was 0 to 2 seconds.
- Terms (last updated 2026-09-30) allow commercial and non-commercial use, in-product display to paying users, caching and polling.
  They prohibit reselling or redistributing the raw feed. Attribution is appreciated, not required.
- Stated rate limit: 15,000 requests per minute per IP. The SignalR stream at `/hubs/tick` is not currently metered.
- No SLA. Data is indicative, aggregated from third party broker feeds including MetaTrader 5, not exchange-licensed.
- Sources: https://biquote.io/terms.html and https://biquote.io/docs/

## Coinbase Exchange public WebSocket (primary crypto)

- No key required for the public feed: `wss://ws-feed.exchange.coinbase.com`.
- Ticker messages include `best_bid`, `best_ask`, `price` and `time`.
- We subscribe to BTC-USD, ETH-USD and LTC-USD on the `ticker` and `heartbeat` channels.
- Ticker messages only fire on trades, so a product silent for 10 seconds is refreshed from the public REST ticker at `https://api.exchange.coinbase.com/products/{product}/ticker`. This keeps thin pairs such as LTC-USD fresh.
- Source: https://docs.cdp.coinbase.com/exchange/websocket-feed/overview

## exchangerate.dev (delayed forex fallback)

- Keyless access works at 10 requests per minute and 100 per hour per IP.
- Free key adds 5,000 requests per month at 10 per minute. No WebSocket on the free plan.
- Free rates are delayed by about 15 minutes. `data_updated_at`, `source`, `market_session` and `stale` are returned.
- Commercial display is allowed on Free with a visible linked credit. Redistribution is not allowed.
- The engine polls one batch every two minutes as a last-resort forex feed and marks it delayed.
- Source: https://exchangerate.dev/free-plan-limits and https://exchangerate.dev/docs/api-reference

## Considered and not used

- OANDA v20 practice: free demo account, realtime streaming bid/ask, but the API licence restricts distribution to the licensee or their organisation and prohibits providing access to third parties. Suitable for a personal dashboard only.
- Twelve Data free: 8 credits per minute, 800 per day, 8 trial WebSocket symbols, licensed for internal non-display use only and explicitly not for production or display to users.
- Finnhub free: 60 calls per minute, 50-symbol WebSocket, positioned for personal and non-commercial use. Commercial use requires written approval.
- FreeForexAPI: down for an extended period and moved to a key-based partnership. Not used.
- Alpha Vantage, Polygon free, ExchangeRate-API free, Frankfurter: daily or too limited for realtime alerting. Frankfurter remains a possible last-resort daily fallback, not wired in.
