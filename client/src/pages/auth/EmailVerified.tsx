import { Link } from "react-router-dom";

export default function EmailVerified() {
    return (
        <div className="flex flex-col items-center justify-between flex-grow p-[1.25rem] pb-12">
            <div className="flex-1"></div>
            <div className="flex-1 verified_background">
                <div className='flex items-center justify-center'>
                    <img src="/verified.svg" />
                </div>
                <h2 className='text-[1.5rem] mt-12 text-center font-semibold leading-8 text-[#202939]'>
                    Your email has <br />
                    been verified
                </h2>
                <p className="text-sm mt-4 text-[#202939] text-center mt-">You can now start monitoring your currency prices. </p>
            </div>
            <Link to='/signup' className="mt-auto w-full flex-1 flex flex-col justify-end">
                <button className="w-full py-[0.625rem] px-[1.125rem] font-medium text-white rounded-full bg-[#7F56D9]">
                    Awesome, lets go
                </button>
            </Link>
        </div>
    )
}
