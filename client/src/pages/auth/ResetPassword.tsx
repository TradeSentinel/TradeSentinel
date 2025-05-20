import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { auth } from "../../utils/firebaseInit"
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth"
import { toast } from "react-toastify"
import MiniLoader from "../../components/MiniLoader"

export default function ResetPassword() {
    const navigateTo = useNavigate()
    const [searchParams] = useSearchParams()
    const [oobCode, setOobCode] = useState<string | null>(null)
    const [passwordInformation, setPasswordInformation] = useState({
        password: '',
        passwordConfirmation: ''
    })
    const [passwordShown, setPasswordShown] = useState(false)
    const [passwordConfirmShown, setPasswordConfirmShown] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [codeVerified, setCodeVerified] = useState(false)
    const [verifyingCode, setVerifyingCode] = useState(true)

    useEffect(() => {
        const code = searchParams.get('oobCode')
        if (code) {
            setOobCode(code)
            verifyPasswordResetCode(auth, code)
                .then(() => {
                    setCodeVerified(true)
                    toast.success("Verification code is valid. Please enter your new password.")
                })
                .catch((err) => {
                    console.error("Invalid or expired password reset code:", err)
                    toast.error("Invalid or expired password reset link. Please request a new one.")
                    setError("Invalid or expired password reset link. Please request a new one.")
                    navigateTo("/forgot_password")
                })
                .finally(() => {
                    setVerifyingCode(false)
                })
        } else {
            toast.error("No password reset code found. Please request a new one.")
            navigateTo("/forgot_password")
            setVerifyingCode(false)
        }
    }, [searchParams, navigateTo])

    function editPasswordInformation(infoName: string, value: string) {
        setPasswordInformation((prevInfo) => ({
            ...prevInfo,
            [infoName]: value
        }))
    }

    const { password, passwordConfirmation } = passwordInformation

    async function changePassword() {
        if (!codeVerified || !oobCode) {
            toast.error("Cannot reset password. The reset link is invalid or has expired.")
            return
        }
        if (password !== passwordConfirmation) {
            setError('Oops, looks like the passwords you used do not match.')
            setTimeout(() => setError(''), 5000)
            return
        }
        if (password.length < 6) {
            setError('Password should be at least 6 characters long.')
            setTimeout(() => setError(''), 5000)
            return
        }
        setError('')
        setLoading(true)
        try {
            await confirmPasswordReset(auth, oobCode, password)
            toast.success("Password has been reset successfully!", {
                position: "top-right",
                autoClose: 2000,
                theme: "light",
            })
            navigateTo('/password_changed')
        } catch (err: any) {
            console.error("Error resetting password:", err)
            setError("Failed to reset password. The link may have expired, or the password might be too weak.")
            toast.error("Failed to reset password. The link may have expired, or the password might be too weak.")
        }
        setLoading(false)
    }

    if (verifyingCode) {
        return (
            <div className="flex flex-col flex-grow p-[1.25rem] pb-12 items-center justify-center dynamicHeight">
                <MiniLoader />
                <p className="mt-4 text-[#364152]">Verifying reset link...</p>
            </div>
        )
    }

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault()
                changePassword()
            }}
            className="p-[1.25rem] pb-12 flex flex-col flex-grow"
        >
            <div className="flex-grow">
                <button
                    type="button"
                    className="p-[0.625rem] ml-[-12px] bg-white rounded-full"
                    onClick={() => navigateTo('/login')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M11.6666 5.8335L8.33329 10.0002L11.6666 14.1668" stroke="#28303F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
                <h2 className='mt-5 text-[1.5rem] font-semibold leading-8 text-[#202939]'>Reset Password</h2>
                <p className="text-sm leading-5 mt-3 text-[#202939]">
                    Your new password must be different from your former passwords.
                </p>
                <div className="flex flex-col gap-1 mt-8">
                    <label className="text-sm font-medium leading-5 text-[#364152]">Password</label>
                    <div className="bg-white w-full px-[14px] py-[10px] rounded-xl  border-[0.5px] border-[#E3E8EF] flex justify-between items-center gap-6">
                        <input
                            value={password}
                            required
                            onChange={(e) => editPasswordInformation('password', e.target.value)}
                            className="outline-none flex-grow text-[#121926]"
                            placeholder="Enter your new password"
                            type={passwordShown ? 'text' : 'password'}
                            disabled={!codeVerified || loading}
                        />
                        <i onClick={() => setPasswordShown(!passwordShown)} className={!codeVerified || loading ? "cursor-not-allowed opacity-50" : "cursor-pointer"}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M2.66683 2.6665L13.3335 13.3332M9.3335 9.49057C8.97966 9.80727 8.5124 9.99984 8.00016 9.99984C6.89559 9.99984 6.00016 9.10441 6.00016 7.99984C6.00016 7.4876 6.19273 7.02034 6.50942 6.6665M13.072 10.405C13.4529 10.0733 13.7936 9.73978 14.087 9.4311C14.8601 8.61772 14.8601 7.38195 14.087 6.56857C12.7832 5.19673 10.5438 3.33317 8.00016 3.33317C7.40591 3.33317 6.82828 3.43488 6.2753 3.60826M4.3335 4.53543C3.36112 5.15613 2.53192 5.91769 1.9133 6.56857C1.14023 7.38195 1.14023 8.61772 1.9133 9.4311C3.21716 10.8029 5.45649 12.6665 8.00016 12.6665C9.24555 12.6665 10.418 12.2198 11.4434 11.6028" stroke="#9AA4B2" strokeWidth="1.2" strokeLinecap="round" />
                            </svg>
                        </i>
                    </div>
                </div>
                <div className="flex flex-col gap-1 mt-4">
                    <label className="text-sm font-medium leading-5 text-[#364152]">Re-enter password</label>
                    <div className="bg-white w-full px-[14px] py-[10px] rounded-xl  border-[0.5px] border-[#E3E8EF] flex justify-between items-center gap-6">
                        <input
                            value={passwordConfirmation}
                            required
                            onChange={(e) => editPasswordInformation('passwordConfirmation', e.target.value)}
                            className="outline-none flex-grow text-[#121926]"
                            placeholder="Re-enter your new password"
                            type={passwordConfirmShown ? 'text' : 'password'}
                            disabled={!codeVerified || loading}
                        />
                        <i onClick={() => setPasswordConfirmShown(!passwordConfirmShown)} className={!codeVerified || loading ? "cursor-not-allowed opacity-50" : "cursor-pointer"}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M2.66683 2.6665L13.3335 13.3332M9.3335 9.49057C8.97966 9.80727 8.5124 9.99984 8.00016 9.99984C6.89559 9.99984 6.00016 9.10441 6.00016 7.99984C6.00016 7.4876 6.19273 7.02034 6.50942 6.6665M13.072 10.405C13.4529 10.0733 13.7936 9.73978 14.087 9.4311C14.8601 8.61772 14.8601 7.38195 14.087 6.56857C12.7832 5.19673 10.5438 3.33317 8.00016 3.33317C7.40591 3.33317 6.82828 3.43488 6.2753 3.60826M4.3335 4.53543C3.36112 5.15613 2.53192 5.91769 1.9133 6.56857C1.14023 7.38195 1.14023 8.61772 1.9133 9.4311C3.21716 10.8029 5.45649 12.6665 8.00016 12.6665C9.24555 12.6665 10.418 12.2198 11.4434 11.6028" stroke="#9AA4B2" strokeWidth="1.2" strokeLinecap="round" />
                            </svg>
                        </i>
                    </div>
                </div>
            </div>
            {error !== '' && <p className="text-[#AD183F] leading-5 text-sm my-2 text-center">{error}</p>}
            <button
                type="submit"
                disabled={!codeVerified || loading || verifyingCode}
                className="mt-auto w-full py-[0.625rem] font-medium px-[1.125rem] text-white rounded-full bg-[#7F56D9] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? <MiniLoader color="#FFFFFF" /> : "Verify"}
            </button>
        </form>
    )
}
