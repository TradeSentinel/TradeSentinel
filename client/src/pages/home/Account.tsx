import { useLocation, useNavigate } from "react-router-dom";
import HomeBottomNavbar from "../../components/homeComponents/HomeBottomNavbar";
import { auth } from "../../utils/firebaseInit";
import { signOut } from "firebase/auth";
import { useGeneralAppStore } from "../../utils/generalAppStore";
import { toast } from "react-toastify";
import { Bell, Caret, Globe, Person, Security } from "../../components/Icons";

export default function Account() {

    const location = useLocation()
    const navigateTo = useNavigate();
    const updateUser = useGeneralAppStore((state) => state.updateUser);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            updateUser(null);
            toast.success("Logged out successfully!", {
                position: "top-right",
                autoClose: 2000,
                theme: "light",
            });
            navigateTo("/login");
        } catch (error: any) {
            console.error("Logout Error:", error);
            toast.error(`Logout Error: ${error.message}`, {
                position: "top-right",
                autoClose: 3000,
                theme: "light",
            });
        }
    };

    return (
        <div className={`relative overflow-scroll dynamicHeight flex flex-col flex-grow p-[1.25rem] pb-12 w-full `}>
            {/* <div className="flex mt-3 items-center justify-center">
                <div className="bg-white p-[2px] rounded-full">
                    <img
                        src="/Avatars.svg"
                        className="h-16 w-16"
                    />
                </div>
            </div> */}

            <div className="flex-grow overflow-scroll scrollbarHidden mb-16 relative">
                <div className="bg-white p-3 flex flex-col gap-[6px] rounded-3xl">
                    <div onClick={() => navigateTo("/profile")} role="button" tabIndex={0} className="flex items-center gap-2 cursor-pointer">
                        <div className="p-2 rounded-full bg-[#F8FAFC]">
                            <Person />
                        </div>
                        <div className="flex flex-grow items-center justify-between border-b-[1px] py-4">
                            <p className="text-xs font-semibold text-[#121926]">Profile</p>
                            <Caret />
                        </div>
                    </div>
                    <div onClick={() => navigateTo("/change-password")} role="button" tabIndex={0} className="flex items-center gap-2 cursor-pointer">
                        <div className="p-2 rounded-full bg-[#F8FAFC]">
                            <Security />
                        </div>
                        <div className="flex flex-grow items-center justify-between border-b-[1px] py-4">
                            <p className="text-xs font-semibold text-[#121926]">Change Password</p>
                            <Caret />
                        </div>
                    </div>
                    <div onClick={() => navigateTo("/notifications")} role="button" tabIndex={0} className="flex items-center gap-2 cursor-pointer">
                        <div className="p-2 rounded-full bg-[#F8FAFC]">
                            <Bell />
                        </div>
                        <div className="flex flex-grow items-center justify-between py-4">
                            <p className="text-xs font-semibold text-[#121926]">Notifications</p>
                            <Caret />
                        </div>
                    </div>
                </div>

                <div className="bg-white mt-6 p-3 flex flex-col gap-[6px] rounded-3xl">
                    <div onClick={() => navigateTo("/about-us")} role="button" tabIndex={0} className="flex items-center gap-2 cursor-pointer">
                        <div className="p-2 rounded-full bg-[#F8FAFC]">
                            <Person />
                        </div>
                        <div className="flex flex-grow items-center justify-between border-b-[1px] py-4">
                            <p className="text-xs font-semibold text-[#121926]">About Trade Sentinel</p>
                            <Caret />
                        </div>
                    </div>
                    <a href="https://tradesentinel.xyz" target="_blank" rel="noopener noreferrer" role="button" tabIndex={0} className="flex items-center gap-2 cursor-pointer">
                        <div className="p-2 rounded-full bg-[#F8FAFC]">
                            <Globe />
                        </div>
                        <div className="flex flex-grow items-center justify-between border-b-[1px] py-4">
                            <p className="text-xs font-semibold text-[#121926]">Website</p>
                            <Caret />
                        </div>
                    </a>
                </div>



                <div className="bg-white p-3 flex flex-col gap-[6px] rounded-3xl bottom-6 absolute w-full">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-full bg-[#F8FAFC]">
                            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="18" viewBox="0 0 15 18" fill="none">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M11.6151 16.7372C10.2085 17.675 8.36084 16.8153 8.08681 15.2363L5.34391 15.2363C4.07826 15.2363 3.05225 14.2103 3.05225 12.9447C3.05225 12.5995 3.33207 12.3197 3.67725 12.3197C4.02242 12.3197 4.30225 12.5995 4.30225 12.9447C4.30225 13.5199 4.76862 13.9863 5.34391 13.9863H8.05225L8.05225 3.56965L5.34391 3.56965C4.76862 3.56965 4.30225 4.03602 4.30225 4.61132C4.30225 4.9565 4.02242 5.23632 3.67725 5.23632C3.33207 5.23632 3.05225 4.9565 3.05225 4.61132C3.05225 3.34567 4.07826 2.31965 5.34391 2.31965L8.08681 2.31965C8.36084 0.740694 10.2085 -0.119013 11.6151 0.818733L13.2818 1.92984C13.9193 2.35487 14.3022 3.0704 14.3022 3.83663L14.3022 13.7193C14.3022 14.4856 13.9193 15.2011 13.2818 15.6261L11.6151 16.7372ZM2.45252 6.89135C2.6966 7.13543 2.6966 7.53116 2.45252 7.77524L1.8528 8.37496L6.17725 8.37496C6.52242 8.37496 6.80225 8.65478 6.80225 8.99996C6.80225 9.34514 6.52242 9.62496 6.17725 9.62496L1.85279 9.62496L2.45252 10.2247C2.6966 10.4688 2.6966 10.8645 2.45252 11.1086C2.20844 11.3526 1.81271 11.3526 1.56864 11.1086L0.491226 10.0312C-0.0782881 9.46164 -0.078289 8.53828 0.491226 7.96876L1.56864 6.89135C1.81272 6.64727 2.20844 6.64727 2.45252 6.89135Z" fill="#9D1639" />
                            </svg>
                        </div>
                        <div className="flex flex-grow items-center justify-between" onClick={handleLogout} role="button" tabIndex={0}>
                            <p className="text-xs font-semibold text-[#9D1639]">Log out</p>
                        </div>
                    </div>
                </div>

            </div>

            <div className="fixed bottom-12 flex items-center justify-center w-full inset-x-0 px-[1.25rem]">
                <HomeBottomNavbar path={location.pathname} />
            </div>
        </div>
    )
}
