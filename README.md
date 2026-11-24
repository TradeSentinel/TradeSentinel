# TradeSentinel

Monitor currency and crypto prices, create alerts, and get notified via push and email.

Live app: https://tradesentinel.xyz

## Features

- Authentication: email/password with email verification, Google login, password reset
- Alerts: create, edit, pause/resume, delete; types: Price reaching, Price rising above, Price dropping below
- Realtime prices: server-side price engine (biquote for forex, Coinbase for crypto, exchangerate.dev as delayed forex fallback); Top Pairs tiles
- Notifications: Web Push (FCM) and Email (SMTP) on alert trigger
- PWA: installable, offline-ready shell via Workbox

## Tech Stack

- Frontend: React + Vite, Zustand, Firebase Auth, Firestore, react-toastify
- Backend: Node.js WebSocket server, price engine (biquote + Coinbase + exchangerate.dev fallback), Firebase Admin SDK, Nodemailer
- Realtime data: biquote REST feed (forex and fallback), Coinbase Exchange WebSocket (crypto)

## Getting Started (Local)

1. Clone repo and install deps:
   - Client: `cd client && npm i`
   - Server: `cd server && npm i`

2. Environment variables

   Client (`client/.env`):
   - `VITE_WS_SERVER_URL=ws://localhost:8787` (for local dev)
   - `VITE_EMAIL_VERIFICATION_REDIRECT_URL=http://localhost:5173/email_verified`
   - `VITE_PASSWORD_RESET_CONTINUE_URL=http://localhost:5173/password_changed`
   - Firebase web config as required in `firebaseInit`
   - No market data provider key is needed in the browser. Prices come from the server price engine.

   Server (`server/.env`):
   - `PORT=8787`
   - `ALLOWED_ORIGINS=` (comma-separated site origins; empty allows all, set it in production)
   - `FIREBASE_SERVICE_ACCOUNT_KEY_PATH=path/to/serviceAccountKey.json`
   - `SMTP_HOST=...`, `SMTP_PORT=465`, `SMTP_USER=...`, `SMTP_PASS=...`, `SMTP_FROM_EMAIL=...`
   - `CLIENT_URL=http://localhost:5173`
   - Optional price engine tuning: `PRICE_POLL_MS=1000`, `FX_FALLBACK_POLL_MS=120000`, `PRICE_STALE_MS=5000`, `PRICE_MAX_SOURCE_AGE_SECONDS=30`, `PRICE_ALERT_MAX_SOURCE_AGE_SECONDS=10`
   - `TRUST_PROXY=false` (set true only behind a trusted proxy that sets `X-Forwarded-For`)
   - `MAX_WS_CONNECTIONS=500`, `MAX_WS_CONNECTIONS_PER_IP=20` (per-IP cap applies only when `TRUST_PROXY=true`)

3. Run
   - Server: `cd server && npm run dev`
   - Client: `cd client && npm run dev`

## Deployment

- Build the server before starting: `cd server && npm run build && npm start`.
- The repo tracks `server/dist` so platforms that run only `npm start` get the current server. Rebuild it after any server change.
- Set `VITE_WS_SERVER_URL` to the public WebSocket URL at build time, for example `wss://server.tradesentinel.xyz`. The client refuses to connect if a production build is missing the URL or uses `ws://`.
- Set `ALLOWED_ORIGINS` on the server to the site origin in production.
- Ensure valid TLS certificates for the WebSocket endpoint and use `wss://` in production.

## Tests

- `cd server && npm test` runs the deterministic price engine tests: parser shapes, alert gating, display vs alert freshness, fallback priority and status flags.
- `cd server && npm run smoke:prices` checks the live primary sources. It fails unless all 8 forex pairs are on biquote and all 3 crypto pairs are on Coinbase, fresh and realtime.
- `cd server && npm run test:ws` checks the subscribe, snapshot and price protocol against the running server on port 8787. Set `WS_TEST_ORIGIN` when `ALLOWED_ORIGINS` is configured.
- `cd server && npm run test:limits` starts an isolated server, exceeds the per-IP cap and sends an oversized frame on the rejected connection, then verifies the process is still alive.
- `cd server && npm run check:dist` rebuilds and fails if the committed `server/dist` is stale, including untracked output.
- Provider terms and verification notes: `docs/PRICE_PROVIDERS.md`.

## Security notes

- `register_token` verifies a Firebase ID token and derives the user ID server-side.
- In production, set `ALLOWED_ORIGINS`. The server refuses to start without it when `NODE_ENV=production`.
- If the previous unauthenticated token registration was exposed, purge existing `users/*/fcmTokens` documents or force re-registration after deploying this version.
- Rotate any xChangeAPI key that was shipped in an earlier browser bundle. The current client source and build contain no provider key.

## Price engine

- Forex: biquote batch feed, polled once per second. exchangerate.dev is the fallback, delayed by about 15 minutes, marked as delayed in the UI and credited with a link when displayed.
- Crypto: Coinbase Exchange public WebSocket for BTC, ETH and LTC. biquote is the fallback.
- Only fresh, open-market quotes trigger alerts. Delayed and stale quotes update the UI but do not fire notifications.
- Prices are indicative and not suitable for trading or settlement.
- `GET /health` is a liveness endpoint. It always returns 200 with `ok`, provider state, per-pair freshness flags and `alertEligible`.
- `GET /ready` is the strict readiness endpoint. It returns 503 when no provider is connected or no pair is alert-eligible. `freshPairs` counts alert-eligible pairs, not just displayable ones.
- `cd server && npm run smoke:prices` verifies that all 11 pairs arrive from the live feeds.

## Notes

- Market data by biquote.io (attribution appreciated, not required).
- No xChangeAPI key or subscription is required.

## Changelog

See `CHANGELOG.md` for current functionality and recent changes.