import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, db } from "../../utils/firebaseInit"; // Assuming firebaseInit.ts exports db
import { useNavigate } from "react-router-dom";
import { useGeneralAppStore } from "../../utils/generalAppStore";
import { toast } from "react-toastify";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useState } from "react";
import MiniLoader from "../../components/MiniLoader"; // Assuming you have a MiniLoader component

export default function SocialAuth() {
    const navigateTo = useNavigate();
    const updateUser = useGeneralAppStore((state) => state.updateUser);
    const [googleLoading, setGoogleLoading] = useState(false);

    const handleGoogleSignIn = async () => {
        setGoogleLoading(true);
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Check if user already exists in Firestore
            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                // If user doesn't exist, create a new document
                await setDoc(userDocRef, {
                    email: user.email,
                    fullName: user.displayName || user.email?.split('@')[0] || "User", // Fallback for fullName
                    userId: user.uid,
                    createdAt: new Date(),
                    authProvider: "google",
                    emailVerified: user.emailVerified // Store the email verification status from Google
                });
            } else {
                // Optional: If user exists, update their emailVerified status if Google says it's verified
                // and it wasn't verified before. Also, you might want to update other fields like authProvider if they switch.
                // For simplicity, we'll just ensure it's set if they sign in via Google.
                // Consider more robust account linking logic if users can sign up with email and then link Google.
                if (user.emailVerified && !userDoc.data()?.emailVerified) {
                    await setDoc(userDocRef, { emailVerified: true }, { merge: true });
                }
            }

            updateUser(user);
            // No need to navigate to /verify-email for social auth if email is already verified
            if (user.emailVerified) {
                toast("Signed in with Google successfully!", {
                    position: "top-right",
                    autoClose: 2000,
                    theme: "light",
                    type: "success",
                });
                navigateTo("/dashboard");
            } else {
                // This case is rare for Google Sign-In but handled just in case
                toast.warn("Your Google account email is not verified. Please verify it through Google.", {
                    position: "top-right",
                    autoClose: 5000,
                    theme: "light",
                });
                // Decide if you want to sign them out or let them proceed to a limited state
                // For now, we'll let them be in the app but they might be restricted by other logic
                // that checks for emailVerified on the user object directly.
                navigateTo("/verify-email"); // Or a specific page for unverified social accounts
            }
        } catch (error: any) {
            console.error("Google Sign-In Error:", error);
            toast(`Google Sign-In Error: ${error.message}`, {
                position: "top-right",
                autoClose: 3000,
                theme: "light",
                type: "error",
            });
        } finally {
            setGoogleLoading(false);
        }
    };

    return (
        <div className="w-full flex items-center">
            {/* Facebook Button - Temporarily disabled */}
            <div className="bg-[#111322] p-[2px] flex items-center rounded-full w-full flex-grow opacity-50 cursor-not-allowed">
                <button className="rounded-full p-3 bg-white w-full flex items-center justify-center" disabled>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <g clipPath="url(#clip0_128_1368)">
                            <path d="M20 10C20 4.47715 15.5229 0 10 0C4.47715 0 0 4.47715 0 10C0 14.9912 3.65684 19.1283 8.4375 19.8785V12.8906H5.89844V10H8.4375V7.79688C8.4375 5.29063 9.93047 3.90625 12.2146 3.90625C13.3084 3.90625 14.4531 4.10156 14.4531 4.10156V6.5625H13.1922C11.95 6.5625 11.5625 7.3334 11.5625 8.125V10H14.3359L13.8926 12.8906H11.5625V19.8785C16.3432 19.1283 20 14.9912 20 10Z" fill="#1877F2" />
                            <path d="M13.8926 12.8906L14.3359 10H11.5625V8.125C11.5625 7.33418 11.95 6.5625 13.1922 6.5625H14.4531V4.10156C14.4531 4.10156 13.3088 3.90625 12.2146 3.90625C9.93047 3.90625 8.4375 5.29063 8.4375 7.79688V10H5.89844V12.8906H8.4375V19.8785C9.47287 20.0405 10.5271 20.0405 11.5625 19.8785V12.8906H13.8926Z" fill="white" />
                        </g>
                        <defs>
                            <clipPath id="clip0_128_1368">
                                <rect width="20" height="20" fill="white" />
                            </clipPath>
                        </defs>
                    </svg>
                </button>
            </div>
            <div className="bg-[#111322] p-[2px] flex items-center w-3 h-5 mx-[-2px] curvedBox overflow-hidden">

            </div>
            {/* Google Button */}
            <div className="bg-[#111322] p-[2px] flex items-center rounded-full w-full flex-grow">
                <button
                    onClick={handleGoogleSignIn}
                    disabled={googleLoading}
                    className="rounded-full p-3 bg-white w-full flex items-center justify-center"
                >
                    {googleLoading ? <MiniLoader color="#4285F4" /> : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <g clipPath="url(#clip0_128_1371)">
                                <path d="M19.8052 10.2305C19.8052 9.55068 19.7501 8.86724 19.6325 8.19849H10.2002V12.0493H15.6016C15.3775 13.2913 14.6573 14.3899 13.6027 15.0881V17.5867H16.8252C18.7176 15.845 19.8052 13.2729 19.8052 10.2305Z" fill="#4285F4" />
                                <path d="M10.2002 20.0008C12.8972 20.0008 15.1717 19.1152 16.8289 17.5867L13.6064 15.088C12.7098 15.698 11.5524 16.0434 10.2038 16.0434C7.59499 16.0434 5.38297 14.2833 4.58929 11.917H1.26392V14.4928C2.96151 17.8696 6.41916 20.0008 10.2002 20.0008Z" fill="#34A853" />
                                <path d="M4.58564 11.9168C4.16676 10.6748 4.16676 9.32995 4.58564 8.08799V5.51221H1.26395C-0.154389 8.33785 -0.154389 11.6669 1.26395 14.4925L4.58564 11.9168Z" fill="#FBBC04" />
                                <path d="M10.2002 3.95805C11.6258 3.936 13.0038 4.47247 14.0363 5.45722L16.8913 2.60218C15.0835 0.904587 12.6841 -0.0287217 10.2002 0.000673888C6.41916 0.000673888 2.96151 2.13185 1.26392 5.51234L4.58561 8.08813C5.37562 5.71811 7.59131 3.95805 10.2002 3.95805Z" fill="#EA4335" />
                            </g>
                            <defs>
                                <clipPath id="clip0_128_1371">
                                    <rect width="20" height="20" fill="white" />
                                </clipPath>
                            </defs>
                        </svg>
                    )}
                </button>
            </div>
        </div>
    )
}
