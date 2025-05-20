import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SplashScreen: React.FC = () => {
    const navigateTo = useNavigate();

    useEffect(() => {
        const handleTouchMove = (e: TouchEvent) => {
            e.preventDefault();
        };

        document.addEventListener("touchmove", handleTouchMove, { passive: false });

        return () => {
            document.removeEventListener("touchmove", handleTouchMove);
        };
    }, []);

    return (
        <div className="bg-[url(/landing_splash.png)] bg-center bg-no-repeat bg-cover max-h-[100dvh] flex-1 flex flex-col justify-between p-[1.25rem] pb-12 mt-[-2rem]">
            <div></div>
            <div className="flex flex-col items-center">
                <img src="/splash_icon.svg" alt="Splash Icon" />
                <div className="max-w-[280px] mt-5 flex flex-col items-center gap-3 text-center text-white">
                    <h1 className="tracking-[-0.72px] leading-[2.25rem] text-[1.875rem] font-bold">Price alerts anywhere, anytime</h1>
                    <p className="text-white text-center">Helping traders make better trade decisions within reach</p>
                </div>
            </div>
            <button onClick={() => navigateTo("/signup")} className="w-full bg-white rounded-full font-medium py-[10px] px-[18px] text-[#42307D]">
               Trade Better
            </button>
        </div>
    );
};

export default SplashScreen;
