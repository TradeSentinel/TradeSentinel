import { useNavigate } from "react-router-dom"


export default function BackButton() {
    const goBack = useNavigate()

    return (
        <button
            onClick={() => goBack("/dashboard")}
            className="bg-white p-[0.625rem] rounded-full h-[44px] w-[44px] flex items-center justify-center"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M11.6667 5.83325L8.33341 9.99992L11.6667 14.1666" stroke="#28303F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </button>
    )
}