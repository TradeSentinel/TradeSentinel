import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'
import { auth } from '../../utils/firebaseInit';
import { sendPasswordResetEmail, ActionCodeSettings } from 'firebase/auth';
import { toast } from 'react-toastify';
import MiniLoader from '../../components/MiniLoader';

export default function ForgotPassword() {

    const navigateTo = useNavigate();
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false);

    const actionCodeSettings: ActionCodeSettings = {
        url: import.meta.env.VITE_PASSWORD_RESET_CONTINUE_URL || 'http://localhost:5173/password_changed',
        handleCodeInApp: true,
    };

    const handlePasswordReset = async () => {
        if (!email) {
            toast.error("Please enter your email address.");
            return;
        }
        setLoading(true);
        try {
            await sendPasswordResetEmail(auth, email, actionCodeSettings);
            toast.success("Password reset email sent! Please check your inbox.", {
                position: "top-right",
                autoClose: 3000,
                theme: "light",
            });
            navigateTo('/reset_email_sent'); // Path from App.tsx
        } catch (error: any) {
            console.error("Password Reset Error:", error);
            if (error.code === 'auth/user-not-found') {
                toast.error("No user found with this email address.");
            } else {
                toast.error(`Error: ${error.message}`);
            }
        }
        setLoading(false);
    };

    return (
        <form
            className='flex flex-col flex-grow p-[1.25rem] pb-12'
            onSubmit={(e) => {
                e.preventDefault()
                handlePasswordReset();
            }}
        >
            <div>
                <button
                    type='button'
                    className="p-[0.625rem] ml-[-12px] bg-white rounded-full"
                    onClick={() => navigateTo(-1)}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M11.6666 5.8335L8.33329 10.0002L11.6666 14.1668" stroke="#28303F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
                <h2 className='mt-5 text-[1.5rem] font-semibold leading-8 text-[#202939]'>Forgot Password?</h2>
                <p className="text-sm leading-5 mt-3 text-[#202939]">
                    Enter the email registered with your account.
                </p>
                <div className="flex flex-col gap-1 mt-8">
                    <label className="text-sm font-medium leading-5 text-[#364152]">Email</label>
                    <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        type='email'
                        className="bg-white text-[#121926] w-full px-[14px] py-[10px] rounded-xl outline-none border-[0.5px] border-[#E3E8EF]"
                        placeholder="Enter your email"
                    />
                </div>
            </div>
            <div className='mt-auto flex flex-col gap-8'>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full font-medium px-[18px] py-[0.625rem] text-white bg-[#7F56D9] rounded-full flex items-center justify-center"
                >
                    {loading ? <MiniLoader color="#FFFFFF" /> : "Reset password"}
                </button>
                <p className="text-[#667085] text-center text-sm leading-5 mt-7">
                    Remember password? <Link to='/login' className="text-[#9E77ED] font-medium">Log In</Link>
                </p>
            </div>
        </form>
    )
}