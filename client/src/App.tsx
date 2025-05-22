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
const ProfilePage = lazy(() => import('./pages/home/ProfilePage'));
const ChangePasswordPage = lazy(() => import('./pages/home/ChangePasswordPage'));
const NotificationsPage = lazy(() => import('./pages/home/NotificationsPage'));
const AboutPage = lazy(() => import('./pages/home/AboutPage'));

// Function to preload avatar images
const preloadAvatarImages = () => {
  // Preload all avatar images (1-6)
  const totalAvatars = 6;
  for (let i = 1; i <= totalAvatars; i++) {
    const img = new Image();
    img.src = `/avatar${i}.png`;
  }
};

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
    },
    {
      path: '/profile',
      element: (
        <Suspense fallback={<div className={loaderStyle}><PageLoader /></div>}>
          <ProtectedRoutes>
            <ProfilePage />
          </ProtectedRoutes>
        </Suspense>
      ),
      errorElement: <ErrorPage />
    },
    {
      path: '/change-password',
      element: (
        <Suspense fallback={<div className={loaderStyle}><PageLoader /></div>}>
          <ProtectedRoutes>
            <ChangePasswordPage />
          </ProtectedRoutes>
        </Suspense>
      ),
      errorElement: <ErrorPage />
    },
    {
      path: '/notifications',
      element: (
        <Suspense fallback={<div className={loaderStyle}><PageLoader /></div>}>
          <ProtectedRoutes>
            <NotificationsPage />
          </ProtectedRoutes>
        </Suspense>
      ),
      errorElement: <ErrorPage />
    },
    {
      path: '/about-us',
      element: (
        <Suspense fallback={<div className={loaderStyle}><PageLoader /></div>}>
          <ProtectedRoutes>
            <AboutPage />
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
  const updateAvatarId = useGeneralAppStore((state) => state.updateAvatarId);
  const updatePwaPromptDismissed = useGeneralAppStore((state) => state.updatePwaPromptDismissed);
  const setAuthLoading = useGeneralAppStore((state) => state.setAuthLoading);

  // Preload all avatar images on app init
  useEffect(() => {
    preloadAvatarImages();
  }, []);

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
            updateHasSetAvatar(!!userData.avatarUrl || !!userData.avatarId || !!userData.hasSetAvatar);

            // Update avatar ID and preload the specific avatar image
            const avatarId = userData.avatarId || null;
            updateAvatarId(avatarId);

            updatePwaPromptDismissed(!!userData.pwaPromptDismissed);

            if (userData.notificationsEnabled !== false) {
              initializeFcmAndRegisterToken()
                .catch(error => console.error('Error initializing FCM:', error));
            }
          } else {
            updateUserProfileName(null);
            updateHasSetAvatar(false);
            updateAvatarId(null);
            updatePwaPromptDismissed(false);
          }
        } catch (error) {
          console.error("Error fetching user document from Firestore:", error);
          updateUserProfileName(null);
          updateHasSetAvatar(false);
          updateAvatarId(null);
          updatePwaPromptDismissed(false);
        }
      } else {
        updateUserProfileName(null);
        updateHasSetAvatar(false);
        updateAvatarId(null);
        updatePwaPromptDismissed(false);
      }
      setAuthLoading(false);
    });

    return () => {
      unsubscribe();
      setAuthLoading(true);
    }
  }, [updateUser, updateUserProfileName, updateHasSetAvatar, updateAvatarId, updatePwaPromptDismissed, setAuthLoading]);

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
