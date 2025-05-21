# Trade Sentinel - Implementation Plan

This document tracks the development progress of the Trade Sentinel PWA.

## Core Features

### 1. Authentication
- [x] User Signup (Email/Password)
  - [x] Store `fullName` in Firestore.
- [x] Email Verification
  - [x] Send verification email on signup.
  - [x] Redirect to a confirmation page after verification link is clicked.
- [x] User Login (Email/Password)
  - [x] Check for email verification status before allowing login.
- [x] Google Social Sign-In
  - [x] Create user document in Firestore if it doesn't exist.
  - [x] Handle `displayName` and `emailVerified` status.
- [x] Password Reset
  - [x] Forgot Password page to request reset email.
  - [x] Email Sent confirmation page.
  - [x] Reset Password page (verifies oobCode, allows new password input).
  - [x] Password Changed confirmation page.
- [x] Session Persistence & Management
  - [x] Ensure user remains logged in on page refresh (handled with `authLoading` state).
- [x] Protected Routes
  - [x] Prevent access to authenticated areas if not logged in.
  - [x] Show loading indicator while checking auth state.

### 2. User Profile & Homepage
- [x] Dynamic Username Display on Homepage
  - [x] Prioritize `fullName` from Firestore.
  - [x] Fallback to Google `displayName` or email-derived name.
- [x] "My Todos" Section on Homepage
  - [x] Track "Setup Avatar" status (using `hasSetAvatar` from Firestore).
  - [x] Track "Add to Home Screen" PWA prompt status (using `pwaPromptDismissed` from Firestore).
  - [x] Dynamic display of Todos (completed/pending states with checkmarks/icons).
  - [x] Navigation for todo items (`/account` for avatar, `/setup_pwa` for PWA).
  - [x] Update Firestore when PWA todo is actioned.
- [ ] Avatar Setup & Management
  - [ ] UI on `/account` page for avatar selection/upload.
  - [ ] Logic to update `avatarUrl` or `hasSetAvatar` in Firestore.
  - [ ] Display chosen avatar on Homepage and Account page.
- [ ] PWA Installation Guidance
  - [x] Create `SetupPWA.tsx` placeholder page.
  - [ ] Add detailed instructions for iOS, Android, and Desktop PWA installation.

### 3. Alert System
- [x] Alert Data Structure Refined (Zustand & Firestore)
  - [x] `notificationPreferences` object (`email`, `push` booleans).
  - [x] Defined statuses (active, triggered, cancelled, paused).
  - [x] `createdAt` timestamp.
- [x] Alert Data Management (Firestore & Zustand)
  - [x] Fetch active alerts (status="active" or "paused", limit 10, ordered) for the current user.
  - [x] Fetch previous alerts (status in ["triggered", "cancelled"], limit 5, ordered) for the current user.
  - [x] Update Zustand store with fetched alerts.
  - [x] Firestore indexes created for queries.
  - [x] "Paused" alerts are treated as active and displayed in the "Active Alerts" list with a badge.
- [x] Create New Alert (`CreateAlert.tsx`)
  - [x] UI for creating alerts.
  - [x] Save new alert configurations to Firestore under `/users/{userId}/alerts`.
  - [x] Use `serverTimestamp()` for `createdAt`.
  - [x] Set default status to "active".
  - [x] Validate input fields (all fields filled, at least one notification type selected).
  - [x] Reset form/global state after successful creation and on unmount.
- [x] Display Alerts (`Alerts.tsx`, `ActiveAlerts.tsx`, `PreviousAlerts.tsx`, `Homepage.tsx`)
  - [x] Homepage shows `CreateFirstAlert` component (with updated SVG) if no active/previous alerts for the user.
  - [x] `ActiveAlerts.tsx` displays active/paused alerts, with a "Paused" badge if applicable. Shows "No active alerts found." message when empty.
  - [x] `PreviousAlerts.tsx` displays triggered/cancelled alerts. Shows "No previous alerts found." message when empty.
  - [x] `Alerts.tsx` component renders `ActiveAlerts` and `PreviousAlerts` in respective tabs.
- [x] Alert Modal (`AlertInfoToShow.tsx`)
  - [x] Display detailed alert information (status, pair, type, trigger price, createdAt, notification preferences).
  - [x] Functional "Delete" button with confirmation dialog (styled to match app design).
  - [x] Functional "Pause/Play" button to toggle status (active <-> paused); disabled for "triggered" or "cancelled" statuses.
  - [x] Functional "Edit" button navigating to `/edit_alert/:alertId`.
  - [x] Handles loading states for actions.
- [x] Edit Alert (`EditAlert.tsx`)
  - [x] Route `/edit_alert/:alertId` defined and protected.
  - [x] Fetch specific alert data from Firestore and populate form.
  - [x] Update alert configurations in Firestore.
  - [x] Update alert in Zustand store.
  - [x] Handle notification preferences.
  - [x] PageLoader shown during initial data fetch.
  - [x] Reset global alert state on unmount.
- [ ] Alert Triggering Logic (Backend)
  - [ ] **Next:** Backend service/Cloud Function to monitor currency prices against active alerts.
  - [ ] When an alert's condition is met:
    - [ ] Update alert `status` to "triggered" in Firestore.
    - [ ] Initiate notifications (email/push).

### 4. Real-time Data Integration (XChange API & WebSockets)
- [ ] **Next:** Integrate XChange API for Currency Pair Data
  - [ ] Fetch list of available currency pairs for selection in `CreateAlert`/`EditAlert`.
  - [ ] Potentially use for validating currency pairs.
- [ ] **Next:** Implement WebSocket Connection for Real-time Price Updates
  - [ ] Establish WebSocket connection to XChange for subscribed currency pairs (pairs present in active alerts).
  - [ ] Update UI elements (e.g., `TopPairs.tsx`, potentially live price on alert details) with real-time data.
  - [ ] This real-time data will feed into the backend alert triggering logic.
- [ ] Securely manage API keys/credentials (likely via backend or environment variables for build).

### 5. Notifications
- [x] Firebase Cloud Messaging (FCM) Setup
  - [x] Initialize Firebase Messaging (`firebaseInit.ts`).
  - [x] Request notification permission (`requestPermission.ts`).
  - [x] Get FCM token.
- [ ] Send Notifications for Triggered Alerts
  - [ ] **Next:** Backend function (e.g., Firebase Cloud Function) to send push notifications via FCM when an alert is triggered (status changes to "triggered").
  - [ ] **Next:** Logic to send email notifications if selected by the user when an alert is triggered.

### 6. General Application Structure & UX
- [x] Global State Management (Zustand)
  - [x] Store `currentUser`, `userProfileName`, alert data, UI states etc.
- [x] Firebase Integration
  - [x] `firebaseInit.ts` for app, auth, firestore, messaging.
- [x] User Feedback
  - [x] Toast notifications for actions (login, signup, errors, success messages).
- [x] PWA Configuration (`vite.config.ts`)
  - [x] Basic manifest file (`sentinel_logo.png` as icon).
  - [x] Basic service worker setup for caching.
- [x] Error Handling
  - [x] Basic `ErrorPage.tsx` for routing errors.
  - [x] More specific error handling for API calls and Firestore operations (ongoing).
- [x] UI/UX Refinements
  - [x] Consistent styling and component usage.
  - [x] Accessibility improvements (ongoing).
  - [x] Updated `CreateFirstAlert` UI in Homepage.

## Future Enhancements (Post-MVP)
- [ ] Advanced alert conditions (e.g., percentage change, moving averages).
- [ ] Customizable notification sounds.
- [ ] Charting/Graphing for currency pairs.
- [ ] More PWA features (e.g., offline access to some data, background sync).
- [ ] User settings for notification preferences (beyond on/off per alert).
- [ ] Dark mode.

--------------------
*Marked with [x] = Done/Mostly Done. Blank = To Do.*
*Marked with **Next:** = Immediate next steps.* 