import { Link } from "react-router-dom";

export default function ResetEmailSent() {
    return (
        <div className="flex flex-col items-center justify-between flex-grow p-[1.25rem] pb-12">
            <div className="flex-1"></div>
            <div className="flex-1 verified_background">
                <div className='flex items-center justify-center'>
                    <img src="/mailsent.svg" />
                </div>
                <h2 className='text-[1.5rem] mt-12 text-center font-semibold leading-8 text-[#202939]'>
                    Please check your email
                </h2>
                <p className="text-sm mt-4 text-[#202939] text-center mt-">
                    We have sent an email to olad*****@g***. To reset your password, click on the link contained in that email.
                </p>
            </div>
            <div className="mt-auto flex flex-col gap-1 w-full">
                <button className="text-[#697586] font-medium leading-6 w-full py-3">Send mail again</button>
                <Link to='/reset_password' className="w-full flex-1 flex flex-col justify-end">
                    <button className="w-full py-[0.625rem] px-[1.125rem] font-medium text-white rounded-full bg-[#7F56D9]">
                        Continue
                    </button>
                </Link>
            </div>
        </div>
    )
}
