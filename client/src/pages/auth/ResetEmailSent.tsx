import { Link, useNavigate } from "react-router-dom";
// We might not need sendPasswordResetEmail here if we redirect to ForgotPassword
// import { auth } from "../../utils/firebaseInit";
// import { sendPasswordResetEmail, ActionCodeSettings } from "firebase/auth";
// import { toast } from "react-toastify";
// import { useState } from "react";
// import MiniLoader from "../../components/MiniLoader";

export default function ResetEmailSent() {
    const navigateTo = useNavigate();
    // const [loading, setLoading] = useState(false);
    // const [email, setEmail] = useState(''); // Need a way to get the email if resending from here

    // const actionCodeSettings: ActionCodeSettings = {
    //     url: import.meta.env.VITE_PASSWORD_RESET_REDIRECT_URL || 'http://localhost:5173/reset_password',
    //     handleCodeInApp: true,
    // };

    // const handleResendPasswordReset = async () => {
    //     // This would require knowing the email. For now, redirecting to forgot_password is safer.
    //     // If email was stored (e.g. in sessionStorage or passed via route state from ForgotPassword):
    //     // setLoading(true);
    //     // try {
    //     //     await sendPasswordResetEmail(auth, email, actionCodeSettings);
    //     //     toast.success("Password reset email sent again! Please check your inbox.");
    //     // } catch (error: any) {
    //     //     toast.error(`Error: ${error.message}`);
    //     // }
    //     // setLoading(false);
    //     navigateTo("/forgot_password"); 
    // };

    return (
        <div className="flex flex-col items-center justify-between flex-grow p-[1.25rem] pb-12">
            <div className="flex-1"></div>
            <div className="flex-1 verified_background">
                <div className='flex items-center justify-center'>
                    <img src="/mailsent.svg" alt="Mail Sent" />
                </div>
                <h2 className='text-[1.5rem] mt-12 text-center font-semibold leading-8 text-[#202939]'>
                    Please check your email
                </h2>
                <p className="text-sm mt-4 text-[#202939] text-center">
                    We have sent an email with a password reset link. To reset your password, click on the link provided in that email.
                </p>
                {/* The user email was previously hardcoded here, which is not ideal. 
                    It's better to make this page generic or get email via props/state if needed for display,
                    but for resending, navigating to forgot password is safer. */}
            </div>
            <div className="mt-auto flex flex-col gap-3 w-full max-w-xs mx-auto flex-1 justify-end">
                <button
                    onClick={() => navigateTo("/forgot_password")}
                    // disabled={loading} // if we had a direct resend here
                    className="text-[#697586] font-medium leading-6 w-full py-3 hover:bg-gray-100 rounded-full"
                >
                    {/* {loading ? <MiniLoader /> : "Send mail again"} */}
                    Send mail again
                </button>
                <Link to='/login' className="w-full">
                    <button className="w-full py-[0.625rem] px-[1.125rem] font-medium text-white rounded-full bg-[#7F56D9]">
                        Back to Login
                    </button>
                </Link>
            </div>
        </div>
    )
}
