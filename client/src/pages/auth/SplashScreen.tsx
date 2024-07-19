import { useNavigate } from "react-router-dom"

export default function SplashScreen() {

    const navigateTo = useNavigate()

    return (
        <div className="bg-[url(/landing_splash.png)] bg-center bg-no-repeat bg-cover h-[100dvh] flex-1 flex flex-col justify-between p-[1.25rem] pb-12 mt-[-2rem]">
            <div></div>
            <div className="flex flex-col items-center">
                <img src="/splash_icon.svg" />
                <div className="mt-5 flex flex-col items-center gap-3 text-center text-white">
                    <h1 className="max-w-[250px] tracking-[-0.72px] leading-[110%] text-[2.25rem] font-bold">Price alerts made simple</h1>
                    <p className="text-white max-w-[280px] text-center">Helping traders make informed trade decisions</p>
                </div>
            </div>
            <button onClick={() => navigateTo("/signup")} className="w-full bg-white rounded-full font-medium py-[10px] px-[18px] text-[#42307D]">
                Get started now
            </button>
        </div>
    )
}
