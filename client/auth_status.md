# Authentication Pages Implementation Status

This document tracks the implementation status of various authentication pages in the application.

## Fully/Mostly Implemented
*(These pages have most of their UI and core logic, including Firebase/backend calls where expected, in place.)*

- `src/pages/auth/Login.tsx`: Handles email/password login and checks for `emailVerified` status, redirecting appropriately.
- `src/pages/auth/Signup.tsx`: Handles email/password signup, sends a verification email using `actionCodeSettings` (with `VITE_EMAIL_VERIFICATION_REDIRECT_URL`), and navigates to `/verify_email`. Stores initial `emailVerified` status.
- `src/pages/auth/SocialAuth.tsx`: Google Sign-In implemented. Stores `emailVerified` status from the provider and navigates directly to dashboard if verified. Facebook Sign-In is currently skipped.
- `src/pages/auth/ProtectedRoutes.tsx`: Protects routes based on `currentUser` state.
- `src/pages/auth/SplashScreen.tsx`: Implemented as an initial landing/splash screen.
- `src/pages/auth/VerifyEmail.tsx`: Reworked for link-based email verification. Includes "Resend Verification Email" functionality using `actionCodeSettings` (with `VITE_EMAIL_VERIFICATION_REDIRECT_URL`). UI updated for consistency.
- `src/pages/auth/ForgotPassword.tsx`: Sends a password reset email using `actionCodeSettings`. The `url` in `actionCodeSettings` currently points to `/password_changed` (via `VITE_PASSWORD_RESET_CONTINUE_URL`) as a workaround due to difficulties setting the Firebase Console Action URL. This means Firebase's default UI handles the password entry.

## Static/Display Pages (or pages acting mainly as informational steps in the current flow)
*(These pages are primarily for display purposes or simple navigation.)*

- `src/pages/auth/EmailVerified.tsx`: Landing page after a user clicks the verification link in their email (target of `VITE_EMAIL_VERIFICATION_REDIRECT_URL`).
- `src/pages/auth/ResetEmailSent.tsx`: Informational page shown after a password reset email is requested. The "Send mail again" button now navigates to `/forgot_password`.
- `src/pages/auth/PasswordChanged.tsx`: Static page shown after a password has been successfully changed (target of `VITE_PASSWORD_RESET_CONTINUE_URL` in the current workaround).

## Partially Implemented / Needs Re-evaluation
*(These pages have UI/logic but might not be fully utilized as originally intended due to current workarounds or pending configurations.)*

- **`src/pages/auth/ResetPassword.tsx`**: This page contains the UI and logic to verify an `oobCode` and allow users to enter a new password within the app.
    *   **Current Status**: Due to difficulties in configuring the Firebase Console's "Action URL" for password reset emails to point directly to this page, the current workaround involves Firebase's default UI handling the password entry. The `continueUrl` in the password reset email (set via `actionCodeSettings` in `ForgotPassword.tsx`) then directs the user to `/password_changed`.
    *   **Impact**: This means the custom UI in `ResetPassword.tsx` for entering a new password is currently bypassed. The page would error or redirect if navigated to directly without a valid `oobCode` in the URL.
    *   **To fully utilize this page as intended, the Firebase Console's "Password reset" email template "Action URL" needs to be successfully set to point to this app's `/reset_password` route.**

## Notes
- The email verification and password reset flows rely on `actionCodeSettings` passed from the client, using environment variables (`VITE_EMAIL_VERIFICATION_REDIRECT_URL`, `VITE_PASSWORD_RESET_CONTINUE_URL`) for `localhost` redirect URLs.
- The ideal password reset flow (using the custom UI in `ResetPassword.tsx`) is currently hindered by the inability to modify the Firebase Console's default Action URL for the password reset email template. The current workaround bypasses the custom new password form.

## Next Steps
We can now go through the "Partially Implemented" list and start adding the missing functionalities. 