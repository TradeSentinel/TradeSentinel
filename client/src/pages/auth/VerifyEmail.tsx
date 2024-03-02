import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function VerifyEmail() {

    const navigateTo = useNavigate();
    const [otp, setOtp] = useState(['', '', '', '']);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null]);

    const handleOtpChange = (index: number, value: string) => {
        const newPin = [...otp];
        newPin[index] = value;
        setOtp(newPin);

        // Move focus to the next or previous input box based on user input
        if (value !== '' && index < otp.length - 1) {
            inputRefs.current[index + 1]?.focus();
        } else if (value === '' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    return (
        <div>
            <button
                className="p-[0.625rem] ml-[-12px] bg-white rounded-full"
                onClick={() => navigateTo(-1)}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M11.6666 5.8335L8.33329 10.0002L11.6666 14.1668" stroke="#28303F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>
            <h2 className='mt-5 text-[1.5rem] font-semibold leading-8 text-[#202939]'>Verify your email</h2>
            <p className="text-sm leading-5 mt-3 text-[#202939]">
                Check your inbox for your verification code. If you can&apos;t find it, check your spam/junk folder.
            </p>
            <div className="mt-8 flex space-x-2 items-center justify-center px-8">
                {otp.map((digit, index) => (
                    <input
                        key={index}
                        ref={(el) => (inputRefs.current[index] = el)}
                        className="bg-[#ffffff] text-[#364152] placeholder:text-[#CDD5DF] w-full rounded-[3rem] border-[0.5px] border-[#CDD5DF] py-4 px-2 text-center text-[2.25rem] outline-[1px] outline-[#D6BBFB]"
                        type="tel"
                        maxLength={1}
                        value={digit}
                        placeholder={`${index + 1}`}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                    />
                ))}
            </div>
            <p className="text-sm leading-5 text-[#667085] text-center mt-6">Didn't receive code? <button className="text-[#9E77ED] font-medium">Resend</button></p>
            <Link to='/verified'>
                <button className="mt-[6rem] w-full py-[0.625rem] font-medium px-[1.125rem] text-white rounded-full bg-[#7F56D9]">
                    Verify
                </button>
            </Link>
        </div>
    )
}
