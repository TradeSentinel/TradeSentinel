import { useNavigate } from "react-router-dom";
import SocialAuth from "./SocialAuth";
import { Link } from "react-router-dom";
import { useState } from "react";
import { createUserWithEmailAndPassword, sendEmailVerification, ActionCodeSettings } from "firebase/auth";
import { auth, db } from "../../utils/firebaseInit";
import { doc, setDoc } from "firebase/firestore";
import { useGeneralAppStore } from "../../utils/generalAppStore";
import { toast } from "react-toastify";
import MiniLoader from "../../components/MiniLoader";

export default function Signup() {

    const navigateTo = useNavigate();
    const updateUser = useGeneralAppStore((state) => state.updateUser)
    const [passwordShown, setPasswordShown] = useState(false);
    const [userInfo, setUserInfo] = useState({
        email: '',
        fullName: '',
        password: ''
    })
    const [loading, setLoading] = useState(false);

    function editUserInfo(infoName: string, value: string) {
        setUserInfo((prevInfo) => ({ ...prevInfo, [infoName]: value }))
    }

    const { fullName, email, password } = userInfo

    const actionCodeSettings: ActionCodeSettings = {
        url: import.meta.env.VITE_EMAIL_VERIFICATION_REDIRECT_URL || 'http://localhost:5173/email_verified',
        handleCodeInApp: true,
    };

    async function signupUser() {
        setLoading(true)
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await sendEmailVerification(user, actionCodeSettings);

            await setDoc(doc(db, "users", user.uid), {
                email: user.email,
                fullName: fullName,
                userId: user.uid,
                createdAt: new Date(),
                emailVerified: user.emailVerified
            });

            toast("Signup successful! Please check your email to verify your account.", {
                position: "top-right",
                autoClose: 5000,
                theme: "light",
                type: "success"
            });

            updateUser(user);
            navigateTo("/verify_email");

        } catch (error: any) {
            console.error(error);
            let errorMessage = "Error signing up";
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = "This email is already in use. Please log in or use a different email.";
            } else if (error.code === 'auth/weak-password') {
                errorMessage = "Password is too weak. Please choose a stronger password.";
            }
            toast(errorMessage, {
                position: "top-right",
                autoClose: 3000,
                theme: "light",
                type: "error"
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col flex-grow p-[1.25rem] pb-12 overflow-scroll">
            <div className="grid place-content-center min-h-[72px]">
                <img src="/logo.svg" />
            </div>

            {/* Main Signup form */}
            <div className="mt-8 flex-grow flex flex-col">
                <h2 className='text-[1.5rem] font-semibold leading-8 text-[#202939]'>Create your account</h2>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        signupUser()
                    }}
                    className="mt-6 flex flex-col justify-between flex-grow gap-6"
                >
                    {/* Input Fields */}
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium leading-5 text-[#364152]">First Name</label>
                            <input
                                value={fullName}
                                required
                                onChange={(e) => editUserInfo('fullName', e.target.value)}
                                className="bg-white text-[#121926] w-full px-[14px] py-[10px] rounded-xl outline-none border-[0.5px] border-[#E3E8EF]"
                                placeholder="Enter your first name"
                                type="text"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium leading-5 text-[#364152]">Email</label>
                            <input
                                value={email}
                                required
                                onChange={(e) => editUserInfo('email', e.target.value)}
                                className="bg-white text-[#121926] w-full px-[14px] py-[10px] rounded-xl outline-none border-[0.5px] border-[#E3E8EF]"
                                placeholder="Enter your email"
                                type="email"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium leading-5 text-[#364152]">Password</label>
                            <div className="bg-white w-full px-[14px] py-[10px] rounded-xl  border-[0.5px] border-[#E3E8EF] flex justify-between items-center gap-6">
                                <input
                                    value={password}
                                    required
                                    onChange={(e) => editUserInfo('password', e.target.value)}
                                    className="outline-none flex-grow text-[#121926]"
                                    placeholder="Enter your password"
                                    type={passwordShown ? 'text' : 'password'}
                                />
                                <i onClick={() => setPasswordShown(!passwordShown)}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                        <path d="M2.66683 2.6665L13.3335 13.3332M9.3335 9.49057C8.97966 9.80727 8.5124 9.99984 8.00016 9.99984C6.89559 9.99984 6.00016 9.10441 6.00016 7.99984C6.00016 7.4876 6.19273 7.02034 6.50942 6.6665M13.072 10.405C13.4529 10.0733 13.7936 9.73978 14.087 9.4311C14.8601 8.61772 14.8601 7.38195 14.087 6.56857C12.7832 5.19673 10.5438 3.33317 8.00016 3.33317C7.40591 3.33317 6.82828 3.43488 6.2753 3.60826M4.3335 4.53543C3.36112 5.15613 2.53192 5.91769 1.9133 6.56857C1.14023 7.38195 1.14023 8.61772 1.9133 9.4311C3.21716 10.8029 5.45649 12.6665 8.00016 12.6665C9.24555 12.6665 10.418 12.2198 11.4434 11.6028" stroke="#9AA4B2" strokeWidth="1.2" strokeLinecap="round" />
                                    </svg>
                                </i>
                            </div>
                        </div>
                    </div>

                    {/* Login Buttons */}
                    <div className="mt-auto">
                        <div className="flex flex-col gap-6">
                            <button
                                type="submit"
                                className="w-full font-medium px-[18px] py-[0.625rem] text-white bg-[#7F56D9] rounded-full flex items-center justify-center"
                            >
                                {loading ? <MiniLoader /> : "Create Account"}
                            </button>
                            <div className="flex flex-row items-center justify-between gap-2">
                                <div className="flex-1 border-b-[0.5px] border-[#CDD5DF]"></div>
                                <p className="text-[#697586] text-sm leading-5">Or start with</p>
                                <div className="flex-1 border-b-[0.5px] border-[#CDD5DF]"></div>
                            </div>
                            <SocialAuth />
                        </div>
                        <p className="text-[#667085] text-center text-sm leading-5 mt-7">
                            Already have an account? <Link to='/login' className="text-[#9E77ED] font-medium">Log In</Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    )
}