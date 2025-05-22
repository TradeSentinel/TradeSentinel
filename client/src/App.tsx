import React, { Suspense, lazy, useEffect } from "react";
import { RouterProvider, createBrowserRouter, RouteObject } from "react-router-dom";
import PageLoader from "./components/PageLoader";
import ErrorPage from "./components/ErrorPage";
import ProtectedRoutes from "./pages/auth/ProtectedRoutes";
import Homepage from "./pages/home/Homepage";
import CreateAlert from "./pages/home/CreateAlert";
import Account from "./pages/home/Account";
import AlertAddedSuccessfully from "./pages/home/AlertAddedSuccessfully";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./utils/firebaseInit";
import { doc, getDoc } from "firebase/firestore";
import { useGeneralAppStore } from "./utils/generalAppStore";
import { initializeFcmAndRegisterToken } from "./utils/fcmTokenRegistration";

// Lazy-loaded components
const Login = lazy(() => import('./pages/auth/Login'));
const Signup = lazy(() => import('./pages/auth/Signup'));
const VerifyEmail = lazy(() => import('./pages/auth/VerifyEmail'));
const EmailVerified = lazy(() => import('./pages/auth/EmailVerified'));
const ResetEmailSent = lazy(() => import('./pages/auth/ResetEmailSent'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const PasswordChanged = lazy(() => import('./pages/auth/PasswordChanged'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const SplashScreen = lazy(() => import('./pages/auth/SplashScreen'));
const SetupPWA = lazy(() => import('./pages/info/SetupPWA'));
const EditAlert = lazy(() => import('./pages/home/EditAlert'));

const App: React.FC = () => {

  const loaderStyle = "dynamicHeight w-full flex items-center justify-center";

  const routes: RouteObject[] = [
    {
      path: "/",
      element: (
        <Suspense fallback={<div className={loaderStyle}><PageLoader /></div>}>
          <SplashScreen />
        </Suspense>
      ),
      errorElement: <ErrorPage />
    },
    {
      path: "/signup",
      element: (
        <Suspense fallback={<div className={loaderStyle}><PageLoader /></div>}>
          <Signup />
        </Suspense>
      ),
      errorElement: <ErrorPage />
    },
    {
      path: "/login",
      element: (
        <Suspense fallback={<div className={loaderStyle}><PageLoader /></div>}>
          <Login />
        </Suspense>
      ),
      errorElement: <ErrorPage />
    },
    {
      path: "/verify_email",
      element: (
        <Suspense fallback={<div className={loaderStyle}><PageLoader /></div>}>
          <VerifyEmail />
        </Suspense>
      ),
      errorElement: <ErrorPage />
    },
    {
      path: "/email_verified",
      element: (
        <Suspense fallback={<div className={loaderStyle}><PageLoader /></div>}>
          <EmailVerified />
        </Suspense>
      ),
      errorElement: <ErrorPage />
    },
    {
      path: "/reset_email_sent",
      element: (
        <Suspense fallback={<div className={loaderStyle}><PageLoader /></div>}>
          <ResetEmailSent />
        </Suspense>
      ),
      errorElement: <ErrorPage />
    },
    {
      path: "/reset_password",
      element: (
        <Suspense fallback={<div className={loaderStyle}><PageLoader /></div>}>
          <ResetPassword />
        </Suspense>
      ),
      errorElement: <ErrorPage />
    },
    {
      path: "/password_changed",
      element: (
        <Suspense fallback={<div className={loaderStyle}><PageLoader /></div>}>
          <PasswordChanged />
        </Suspense>
      ),
      errorElement: <ErrorPage />
    },
    {
      path: "/forgot_password",
      element: (
        <Suspense fallback={<div className={loaderStyle}><PageLoader /></div>}>
          <ForgotPassword />
        </Suspense>
      ),
      errorElement: <ErrorPage />
    },
    {
      path: '/dashboard',
      element: (
        <Suspense fallback={<div className={loaderStyle}><PageLoader /></div>}>
          <ProtectedRoutes>
            <Homepage />
          </ProtectedRoutes>
        </Suspense>
      ),
      errorElement: <ErrorPage />
    },
    {
      path: '/create_alert',
      element: (
        <Suspense fallback={<div className={loaderStyle}><PageLoader /></div>}>
          <ProtectedRoutes>
            <CreateAlert />
          </ProtectedRoutes>
        </Suspense>
      ),
      errorElement: <ErrorPage />
    },
    {
      path: '/account',
      element: (
        <Suspense fallback={<div className={loaderStyle}><PageLoader /></div>}>
          <ProtectedRoutes>
            <Account />
          </ProtectedRoutes>
        </Suspense>
      ),
      errorElement: <ErrorPage />
    },
    {
      path: '/alert_added_successfully',
      element: (
        <Suspense fallback={<div className={loaderStyle}><PageLoader /></div>}>
          <ProtectedRoutes>
            <AlertAddedSuccessfully />
          </ProtectedRoutes>
        </Suspense>
      ),
      errorElement: <ErrorPage />
    },
    {
      path: '/setup_pwa',
      element: (
        <Suspense fallback={<div className={loaderStyle}><PageLoader /></div>}>
          <ProtectedRoutes>
            <SetupPWA />
          </ProtectedRoutes>
        </Suspense>
      ),
      errorElement: <ErrorPage />
    },
    {
      path: '/edit_alert/:alertId',
      element: (
        <Suspense fallback={<div className={loaderStyle}><PageLoader /></div>}>
          <ProtectedRoutes>
            <EditAlert />
          </ProtectedRoutes>
        </Suspense>
      ),
      errorElement: <ErrorPage />
    }
  ];

  const Router = createBrowserRouter(routes);

  const updateUser = useGeneralAppStore((state) => state.updateUser)
  const updateUserProfileName = useGeneralAppStore((state) => state.updateUserProfileName);
  const updateHasSetAvatar = useGeneralAppStore((state) => state.updateHasSetAvatar);
  const updatePwaPromptDismissed = useGeneralAppStore((state) => state.updatePwaPromptDismissed);
  const setAuthLoading = useGeneralAppStore((state) => state.setAuthLoading);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      updateUser(currentUser);
      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);
        try {
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            updateUserProfileName(userData.fullName || null);
            updateHasSetAvatar(!!userData.avatarUrl);
            updatePwaPromptDismissed(!!userData.pwaPromptDismissed);

            if (userData.notificationsEnabled !== false) {
              initializeFcmAndRegisterToken()
                .catch(error => console.error('Error initializing FCM:', error));
            }
          } else {
            updateUserProfileName(null);
            updateHasSetAvatar(false);
            updatePwaPromptDismissed(false);
          }
        } catch (error) {
          console.error("Error fetching user document from Firestore:", error);
          updateUserProfileName(null);
          updateHasSetAvatar(false);
          updatePwaPromptDismissed(false);
        }
      } else {
        updateUserProfileName(null);
        updateHasSetAvatar(false);
        updatePwaPromptDismissed(false);
      }
      setAuthLoading(false);
    });

    return () => {
      unsubscribe();
      setAuthLoading(true);
    }
  }, [updateUser, updateUserProfileName, updateHasSetAvatar, updatePwaPromptDismissed, setAuthLoading]);

  return (
    <div className="bg-[#EEF2F6] flex items-center justify-center">
      <div
        // ref={containerRef}
        className="max-w-[600px] w-full dynamicHeight font-ibm flex flex-col pt-8"
      >
        <ToastContainer />
        <RouterProvider router={Router} />
      </div>
    </div>
  );
}

export default App;
