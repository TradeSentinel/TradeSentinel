import { useState } from "react"
import { useNavigate } from "react-router-dom"

export default function ResetPassword() {

    const navigateTo = useNavigate()
    const [passwordInformation, setPasswordInformation] = useState({
        password: '',
        passwordConfirmation: ''
    })
    const [passwordShown, setPasswordShown] = useState(false)
    const [passwordConfirmShown, setPasswordConfirmShown] = useState(false)
    const [error, setError] = useState('')

    function editPasswordInformation(infoName: string, value: string) {
        setPasswordInformation((prevInfo) => {
            return {
                ...prevInfo,
                [infoName]: value
            }
        })
    }


    const { password, passwordConfirmation } = passwordInformation

    function changePassword() {
        if (password !== passwordConfirmation) {
            setError('Oops, looks like the passwords you used do not match do not match.')
        } else {
            navigateTo('/password_changed')
        }

        setTimeout(() => {
            setError('')
        }, 5000)
    }


    return (
        <form
            onSubmit={(e) => {
                e.preventDefault()
                changePassword()
            }}
            className="p-[1.25rem] pb-12"
        >
            <div >
                <button
                    className="p-[0.625rem] ml-[-12px] bg-white rounded-full"
                    onClick={() => navigateTo(-1)}
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
                        />
                        <i onClick={() => setPasswordShown(!passwordShown)}>
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
                        />
                        <i onClick={() => setPasswordConfirmShown(!passwordConfirmShown)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M2.66683 2.6665L13.3335 13.3332M9.3335 9.49057C8.97966 9.80727 8.5124 9.99984 8.00016 9.99984C6.89559 9.99984 6.00016 9.10441 6.00016 7.99984C6.00016 7.4876 6.19273 7.02034 6.50942 6.6665M13.072 10.405C13.4529 10.0733 13.7936 9.73978 14.087 9.4311C14.8601 8.61772 14.8601 7.38195 14.087 6.56857C12.7832 5.19673 10.5438 3.33317 8.00016 3.33317C7.40591 3.33317 6.82828 3.43488 6.2753 3.60826M4.3335 4.53543C3.36112 5.15613 2.53192 5.91769 1.9133 6.56857C1.14023 7.38195 1.14023 8.61772 1.9133 9.4311C3.21716 10.8029 5.45649 12.6665 8.00016 12.6665C9.24555 12.6665 10.418 12.2198 11.4434 11.6028" stroke="#9AA4B2" strokeWidth="1.2" strokeLinecap="round" />
                            </svg>
                        </i>
                    </div>
                </div>
            </div>
            {error !== '' && <p className="text-[#AD183F] leading-5 text-sm">{error}</p>}
            <button
                type="submit"
                className="mt-[6rem] w-full py-[0.625rem] font-medium px-[1.125rem] text-white rounded-full bg-[#7F56D9]"
            >
                Verify
            </button>
        </form>
    )
}
