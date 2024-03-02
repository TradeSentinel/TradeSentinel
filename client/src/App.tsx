import { Route, Routes } from "react-router-dom";
import Signup from "./pages/auth/Signup";
import Login from "./pages/auth/Login";
import VerifyEmail from "./pages/auth/VerifyEmail";
import EmailVerified from "./pages/auth/EmailVerified";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetEmailSent from "./pages/auth/ResetEmailSent";
import ResetPassword from "./pages/auth/ResetPassword";
import PasswordChanged from "./pages/auth/PasswordChanged";

export default function App() {
  return (
    <div className="bg-[#EEF2F6] dynamicHeight font-ibm flex flex-col p-[1.25rem]">
      <Routes>
        <Route path="/" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify_email" element={<VerifyEmail />} />
        <Route path="/verified" element={<EmailVerified />} />
        <Route path="/forgot_password" element={<ForgotPassword />} />
        <Route path="/reset_email_sent" element={<ResetEmailSent />} />
        <Route path="/reset_password" element={<ResetPassword />} />
        <Route path="/password_changed" element={<PasswordChanged />} />
      </Routes>
    </div>
  )
}