import React, { Suspense, lazy } from "react";
import { RouterProvider, createBrowserRouter, RouteObject } from "react-router-dom";
import PageLoader from "./components/PageLoader";
import ErrorPage from "./components/ErrorPage";
import ProtectedRoutes from "./pages/auth/ProtectedRoutes";
import Homepage from "./pages/home/Homepage";
import CreateAlert from "./pages/home/CreateAlert";
import Account from "./pages/home/Account";
import AlertAddedSuccessfully from "./pages/home/AlertAddedSuccessfully";

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

const App: React.FC = () => {
  // const containerRef = useRef<HTMLDivElement | null>(null);

  // useEffect(() => {
  //   const container = containerRef.current;
  //   if (!container) return;

  //   let startY: number;

  //   const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
  //     startY = e.touches[0].clientY;
  //   };

  //   const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
  //     const currentY = e.touches[0].clientY;
  //     const scrollTop = container.scrollTop;
  //     const scrollHeight = container.scrollHeight;
  //     const clientHeight = container.clientHeight;

  //     // Prevent scrolling up when already at the top
  //     if (scrollTop <= 0 && currentY > startY) {
  //       e.preventDefault();
  //     }

  //     // Prevent scrolling down when already at the bottom
  //     if (scrollTop + clientHeight >= scrollHeight && currentY < startY) {
  //       e.preventDefault();
  //     }
  //   };

  //   container.addEventListener('touchstart', handleTouchStart as unknown as EventListener);
  //   container.addEventListener('touchmove', handleTouchMove as unknown as EventListener, { passive: false });

  //   return () => {
  //     container.removeEventListener('touchstart', handleTouchStart as unknown as EventListener);
  //     container.removeEventListener('touchmove', handleTouchMove as unknown as EventListener);
  //   };
  // }, []);

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
    }
  ];

  const Router = createBrowserRouter(routes);

  return (
    <div className="bg-[#EEF2F6] flex items-center justify-center">
      <div 
      // ref={containerRef}
       className="max-w-[600px] w-full dynamicHeight font-ibm flex flex-col pt-8"
       >
        <RouterProvider router={Router} />
      </div>
    </div>
  );
}

export default App;
