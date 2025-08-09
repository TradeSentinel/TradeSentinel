# TradeSentinel

Monitor currency and crypto prices, create alerts, and get notified via push and email.

Live app: https://tradesentinel.xyz

## Features

- Authentication: email/password with email verification, Google login, password reset
- Alerts: create, edit, pause/resume, delete; types: Price reaching, Price rising above, Price dropping below
- Realtime prices: WebSocket live prices from xChangeAPI; Top Pairs tiles
- Notifications: Web Push (FCM) and Email (SMTP) on alert trigger
- PWA: installable, offline-ready shell via Workbox

## Tech Stack

- Frontend: React + Vite, Zustand, Firebase Auth, Firestore, react-toastify
- Backend: Node.js WebSocket server, Firebase Admin SDK, Nodemailer
- Realtime data: xChangeAPI WebSocket

## Getting Started (Local)

1. Clone repo and install deps:
   - Client: `cd client && npm i`
   - Server: `cd server && npm i`

2. Environment variables

   Client (`client/.env`):
   - `VITE_XCHANGE_API=your_xchange_api_key`
   - `VITE_WS_SERVER_URL=ws://localhost:8080` (for local dev)
   - `VITE_EMAIL_VERIFICATION_REDIRECT_URL=http://localhost:5173/email_verified`
   - `VITE_PASSWORD_RESET_CONTINUE_URL=http://localhost:5173/password_changed`
   - Firebase web config as required in `firebaseInit`

   Server (`server/.env`):
   - `PORT=8080`
   - `XCHANGE_API_KEY=your_xchange_api_key`
   - `FIREBASE_SERVICE_ACCOUNT_KEY_PATH=path/to/serviceAccountKey.json`
   - `SMTP_HOST=...`, `SMTP_PORT=465`, `SMTP_USER=...`, `SMTP_PASS=...`, `SMTP_FROM_EMAIL=...`
   - `CLIENT_URL=http://localhost:5173`

3. Run
   - Server: `cd server && npm run dev`
   - Client: `cd client && npm run dev`

## Deployment

- Configure `VITE_WS_SERVER_URL` to your backend WS (e.g., `wss://server.tradesentinel.xyz`).
- Ensure valid TLS certs for production.

## Notes

- Crypto pairs require xChangeAPI plan with crypto WebSocket access.
- If the provider uses multipliers for some pairs, adjust display if values appear scaled.

## Changelog

See `CHANGELOG.md` for current functionality and recent changes.