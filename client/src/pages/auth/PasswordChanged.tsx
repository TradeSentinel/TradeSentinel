import { Link } from "react-router-dom";

export default function PasswordChanged() {
    return (
        <div className="flex flex-col items-center justify-between flex-grow">
            <div className="flex-1"></div>
            <div className="flex-1 verified_background">
                <div className='flex items-center justify-center'>
                    <img src="/verified.svg" />
                </div>
                <h2 className='text-[1.5rem] mt-12 text-center font-semibold leading-8 text-[#202939]'>
                    Password Changed!
                </h2>
                <p className="text-sm mt-4 text-[#202939] text-center mt-">Your password reset is complete. </p>
            </div>
            <Link to='/login' className="mt-auto w-full flex-1 flex flex-col justify-end">
                <button className="w-full py-[0.625rem] px-[1.125rem] font-medium text-white rounded-full bg-[#7F56D9]">
                    Login with new password
                </button>
            </Link>
        </div>
    )
}
