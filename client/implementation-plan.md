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
  - [ ] Placeholder: UI on `/account` page for avatar selection/upload.
  - [ ] Placeholder: Logic to update `avatarUrl` or `hasSetAvatar` in Firestore.
  - [ ] Display chosen avatar on Homepage and Account page.
- [ ] PWA Installation Guidance
  - [x] Create `SetupPWA.tsx` placeholder page.
  - [ ] Add detailed instructions for iOS, Android, and Desktop PWA installation.

### 3. Alert System
- [x] Alert Data Structure Refined (Zustand & Firestore)
  - [x] `notificationPreferences` object instead of string.
  - [x] Defined statuses (active, triggered, cancelled, paused).
  - [x] `createdAt` timestamp.
- [x] Alert Data Management (Firestore)
  - [x] Fetch active alerts (status="active", limit 10, ordered) for the current user.
  - [x] Fetch previous alerts (status in ["triggered", "cancelled", "paused"], limit 5, ordered) for the current user.
  - [x] Update Zustand store with fetched alerts.
  - [x] Firestore indexes created for queries.
- [x] Create New Alert (`CreateAlert.tsx`)
  - [x] UI for creating alerts.
  - [x] Save new alert configurations to Firestore under `/users/{userId}/alerts`.
  - [x] Use `serverTimestamp()` for `createdAt`.
  - [x] Set default status to "active".
  - [x] Validate input fields.
  - [x] Reset form/global state after successful creation.
- [ ] Display Alerts (`Alerts.tsx` & `Homepage.tsx`)
  - [x] Homepage shows `CreateFirstAlert` component (with updated SVG) if no active/previous alerts for the user.
  - [ ] Placeholder: `Alerts.tsx` to render lists of active and previous alerts (needs implementation).
- [ ] Edit Alert
  - [x] UI for editing alerts (`EditAlert.tsx` - currently a copy of CreateAlert).
  - [ ] Placeholder: Load existing alert data into the form.
  - [ ] Placeholder: Update alert configurations in Firestore.
- [ ] Delete Alert
  - [ ] Functionality to delete alerts from Firestore.
- [ ] Alert Status Management (Active, Paused, Triggered)
  - [ ] UI to change alert status.
  - [ ] Update alert status in Firestore.

### 4. Real-time Data & Alert Triggering
- [ ] Xchange API Integration
  - [ ] Implement API calls to fetch real-time currency pair data.
  - [ ] Securely manage API keys/credentials.
- [ ] Alert Triggering Logic
  - [ ] Backend or client-side mechanism to monitor price data against active alerts.
  - [ ] Update alert status to "triggered" in Firestore.

### 5. Notifications
- [x] Firebase Cloud Messaging (FCM) Setup
  - [x] Initialize Firebase Messaging (`firebaseInit.ts`).
  - [x] Request notification permission (`requestPermission.ts`).
  - [x] Get FCM token.
- [ ] Send Notifications for Triggered Alerts
  - [ ] Backend function (e.g., Firebase Cloud Function) to send push notifications via FCM when an alert is triggered.
  - [ ] Logic to send email notifications if selected by the user.

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
- [ ] Error Handling
  - [x] Basic `ErrorPage.tsx` for routing errors.
  - [x] More specific error handling for API calls and Firestore operations.
- [ ] UI/UX Refinements
  - [x] Consistent styling and component usage.
  - [x] Accessibility improvements.
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