import { Route, Routes } from "react-router-dom";
import Signup from "./pages/auth/Signup";
import Login from "./pages/auth/Login";
import VerifyEmail from "./pages/auth/VerifyEmail";
import EmailVerified from "./pages/auth/EmailVerified";

export default function App() {
  return (
    <div className="bg-[#EEF2F6] dynamicHeight font-ibm flex flex-col p-[1.25rem]">
      <Routes>
        <Route path="/" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify_email" element={<VerifyEmail />} />
        <Route path="/verified" element={<EmailVerified />} />
      </Routes>
    </div>
  )
}