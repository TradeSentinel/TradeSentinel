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
   - `FIREBASE_SERVICE_ACCOUNT_KEY_PATH=path/to/serviceAccountKey.json`
   - `SMTP_HOST=...`, `SMTP_PORT=465`, `SMTP_USER=...`, `SMTP_PASS=...`, `SMTP_FROM_EMAIL=...`
   - `CLIENT_URL=http://localhost:5173`
   - Optional price engine tuning: `PRICE_POLL_MS=1000`, `FX_FALLBACK_POLL_MS=120000`, `PRICE_STALE_MS=5000`

3. Run
   - Server: `cd server && npm run dev`
   - Client: `cd client && npm run dev`

## Deployment

- Configure `VITE_WS_SERVER_URL` to your backend WS (e.g., `wss://server.tradesentinel.xyz`).
- Ensure valid TLS certs for production.

## Price engine

- Forex: biquote batch feed, polled once per second. exchangerate.dev is the fallback, delayed by about 15 minutes and marked as delayed in the UI.
- Crypto: Coinbase Exchange public WebSocket for BTC, ETH and LTC. biquote is the fallback.
- Only fresh, open-market quotes trigger alerts. Delayed and stale quotes update the UI but do not fire notifications.
- Prices are indicative and not suitable for trading or settlement.
- `GET /health` returns provider state and the latest quote for every pair.
- `cd server && npm run smoke:prices` verifies that all 11 pairs arrive from the live feeds.

## Notes

- Market data by biquote.io (attribution appreciated, not required).
- No xChangeAPI key or subscription is required.

## Changelog

See `CHANGELOG.md` for current functionality and recent changes.