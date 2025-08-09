import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../utils/firebaseInit";
import { sendEmailVerification, ActionCodeSettings } from "firebase/auth";
import { toast } from "react-toastify";
import MiniLoader from "../../components/MiniLoader";

export default function VerifyEmail() {
    const navigateTo = useNavigate();
    const [loading, setLoading] = useState(false);

    const actionCodeSettings: ActionCodeSettings = {
        url: import.meta.env.VITE_EMAIL_VERIFICATION_REDIRECT_URL || 'http://localhost:5173/email_verified',
        handleCodeInApp: true,
    };

    const handleResendVerificationEmail = async () => {
        setLoading(true);
        const user = auth.currentUser;
        if (user) {
            try {
                await sendEmailVerification(user, actionCodeSettings);
                toast.success("Verification email sent! Please check your inbox (and spam folder).", {
                    position: "top-right",
                    autoClose: 3000,
                    theme: "light",
                });
            } catch (error: any) {
                console.error("Error resending verification email:", error);
                toast.error(`Error: ${error.message}`, {
                    position: "top-right",
                    autoClose: 3000,
                    theme: "light",
                });
            }
        } else {
            toast.info("Please log in again to resend the verification email.", {
                position: "top-right",
                autoClose: 3000,
                theme: "light",
            });
            navigateTo("/login");
        }
        setLoading(false);
    };

    return (
        <div className="flex flex-col items-center justify-between flex-grow p-[1.25rem] pb-12">
            <div className="flex-1"></div>
            <div className="flex-1 verified_background">
                <div className='flex items-center justify-center'>
                    <img src="/mailsent.svg" alt="Email Sent" />
                </div>
                <h2 className='text-[1.5rem] mt-12 text-center font-semibold leading-8 text-[#202939]'>
                    Verify Your Email Address
                </h2>
                <p className="text-sm mt-4 text-[#202939] text-center max-w-xs">
                    Please check your email and click on the link provided to verify your email address.
                </p>
            </div>

            {/* Bottom action buttons area */}
            <div className="mt-auto w-full flex-1 flex flex-col justify-end items-center gap-3 max-w-xs mx-auto">
                <button
                    onClick={handleResendVerificationEmail}
                    disabled={loading}
                    className="text-[#697586] font-medium leading-6 w-full py-3"
                >
                    {loading ? <MiniLoader color="#FFFFFF" /> : "Resend Verification Email"}
                </button>
                <button
                    onClick={() => navigateTo("/login")}
                    className="w-full py-[0.625rem] font-medium px-[1.125rem] text-white rounded-full bg-[#7F56D9] flex items-center justify-center"
                >
                    Continue
                </button>
            </div>
        </div>
    )
}
