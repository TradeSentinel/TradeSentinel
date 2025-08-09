# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Crypto pairs (BTC/USD, ETH/USD, LTC/USD) in pair selector and Top Pairs tiles (requires xChangeAPI plan with crypto WS access).
- Fixed-height (500px) pair selection modal with scrollable list.

### Changed
- Aligned email verification routes and redirects to use `/verify_email` and `/email_verified`.

### Fixed
- Unverified login now redirects to the correct verify email route instead of the 404 error page.

---

## Current Functionality

### App & UX
- Progressive Web App (PWA) with install prompt and offline shell via Workbox.
- Responsive mobile-first UI.

### Authentication
- Email/password signup with email verification.
- Login with email/password; unverified users are guided to verification.
- Google social login (uses provider `emailVerified` when available).
- Password reset (request link, validate code, and set new password).
- Protected routes based on authenticated session.

### Alerts
- Create, edit, pause/resume, and delete price alerts.
- Alert types: "Price reaching", "Price rising above", "Price dropping below".
- Live price preview while creating/editing alerts.
- Active and Previous alerts lists with statuses (active, paused, triggered, cancelled).

### Realtime Prices
- WebSocket live prices from xChangeAPI.
- Top Pairs live tiles on dashboard.
- Pair-agnostic streaming (fiat and, if plan allows, crypto).

### Notifications
- Web Push via Firebase Cloud Messaging (FCM): token registration and delivery for triggered alerts.
- Email notifications via SMTP when alerts trigger.

### Backend Services
- Node.js WebSocket server for client connections, FCM token registration, and notifications.
- `XChangeService` for resilient WS connection to xChangeAPI with dynamic pair subscribe/unsubscribe.
- Firestore listeners to update subscriptions in near real-time when alerts change.

### Data
- Firestore collections for users, alerts, and FCM tokens.
