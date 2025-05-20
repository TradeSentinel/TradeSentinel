import { useLocation, useNavigate } from "react-router-dom";
import HomeBottomNavbar from "../../components/homeComponents/HomeBottomNavbar";
import { auth } from "../../utils/firebaseInit";
import { signOut } from "firebase/auth";
import { useGeneralAppStore } from "../../utils/generalAppStore";
import { toast } from "react-toastify";

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
            <div className="flex mt-3 items-center justify-center">
                <div className="bg-white p-[2px] rounded-full">
                    <img
                        src="/Avatars.svg"
                        className="h-16 w-16"
                    />
                </div>
            </div>

            <div className="mt-14 flex-grow overflow-scroll scrollbarHidden mb-16">
                <div className="bg-white p-3 flex flex-col gap-[6px] rounded-3xl">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-full bg-[#F8FAFC]">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M17.3439 8.99984C17.3439 11.511 16.2332 13.7627 14.4763 15.2905C13.0131 16.5629 11.1018 17.3332 9.01058 17.3332C6.91935 17.3332 5.00803 16.5629 3.54488 15.2905C1.78795 13.7627 0.677246 11.511 0.677246 8.99984C0.677246 4.39746 4.40821 0.666504 9.01058 0.666504C13.613 0.666504 17.3439 4.39746 17.3439 8.99984ZM11.5106 6.49984C11.5106 5.11913 10.3913 3.99984 9.01058 3.99984C7.62987 3.99984 6.51058 5.11913 6.51058 6.49984C6.51058 7.88055 7.62987 8.99984 9.01058 8.99984C10.3913 8.99984 11.5106 7.88055 11.5106 6.49984ZM9.01058 10.6665C10.4378 10.6665 11.3764 11.4304 12.0382 12.2794C12.532 12.9129 12.3621 13.8421 11.6458 14.2054C10.8542 14.6069 9.95883 14.8332 9.01058 14.8332C8.06233 14.8332 7.16692 14.6069 6.3754 14.2054C5.65909 13.8421 5.48914 12.9129 5.98291 12.2794C6.64471 11.4304 7.5833 10.6665 9.01058 10.6665Z" fill="#28303F" />
                            </svg>
                        </div>
                        <div className="flex flex-grow items-center justify-between border-b-[1px] py-4">
                            <p className="text-xs font-semibold text-[#121926]">Personal Info</p>
                            <i>
                                <svg xmlns="http://www.w3.org/2000/svg" width="21" height="20" viewBox="0 0 21 20" fill="none">
                                    <path d="M8.34375 14.1665L11.6771 9.99984L8.34375 5.83317" stroke="#9AA4B2" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                                </svg>
                            </i>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-full bg-[#F8FAFC]">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="17" viewBox="0 0 16 17" fill="none">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M2.49184 3.11881L6.65669 1.26776C7.51857 0.884704 8.50239 0.884704 9.36428 1.26776L13.5126 3.11147C14.7257 3.65062 15.522 4.86238 15.437 6.18716C15.1109 11.2687 13.6582 13.5658 9.73101 16.2308C8.69462 16.9341 7.32748 16.9324 6.29032 16.2302C2.37521 13.5796 0.868511 11.3145 0.568817 6.16934C0.492159 4.85326 1.28715 3.65422 2.49184 3.11881ZM10.9808 7.74431C11.2081 7.48454 11.1818 7.08968 10.922 6.86238C10.6623 6.63508 10.2674 6.66141 10.0401 6.92118L7.64853 9.65442C7.57512 9.73833 7.44866 9.74956 7.3616 9.67991L5.90092 8.51137C5.63138 8.29574 5.23807 8.33944 5.02244 8.60898C4.80681 8.87851 4.85051 9.27182 5.12005 9.48745L6.58073 10.656C7.19014 11.1435 8.07535 11.0649 8.58925 10.4776L10.9808 7.74431Z" fill="#28303F" />
                            </svg>
                        </div>
                        <div className="flex flex-grow items-center justify-between border-b-[1px] py-4">
                            <p className="text-xs font-semibold text-[#121926]">Change Password</p>
                            <i>
                                <svg xmlns="http://www.w3.org/2000/svg" width="21" height="20" viewBox="0 0 21 20" fill="none">
                                    <path d="M8.34375 14.1665L11.6771 9.99984L8.34375 5.83317" stroke="#9AA4B2" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                                </svg>
                            </i>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-full bg-[#F8FAFC]">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M17.3439 8.99984C17.3439 11.511 16.2332 13.7627 14.4763 15.2905C13.0131 16.5629 11.1018 17.3332 9.01058 17.3332C6.91935 17.3332 5.00803 16.5629 3.54488 15.2905C1.78795 13.7627 0.677246 11.511 0.677246 8.99984C0.677246 4.39746 4.40821 0.666504 9.01058 0.666504C13.613 0.666504 17.3439 4.39746 17.3439 8.99984ZM11.5106 6.49984C11.5106 5.11913 10.3913 3.99984 9.01058 3.99984C7.62987 3.99984 6.51058 5.11913 6.51058 6.49984C6.51058 7.88055 7.62987 8.99984 9.01058 8.99984C10.3913 8.99984 11.5106 7.88055 11.5106 6.49984ZM9.01058 10.6665C10.4378 10.6665 11.3764 11.4304 12.0382 12.2794C12.532 12.9129 12.3621 13.8421 11.6458 14.2054C10.8542 14.6069 9.95883 14.8332 9.01058 14.8332C8.06233 14.8332 7.16692 14.6069 6.3754 14.2054C5.65909 13.8421 5.48914 12.9129 5.98291 12.2794C6.64471 11.4304 7.5833 10.6665 9.01058 10.6665Z" fill="#28303F" />
                            </svg>
                        </div>
                        <div className="flex flex-grow items-center justify-between py-4">
                            <p className="text-xs font-semibold text-[#121926]">Notifications</p>
                            <i>
                                <svg xmlns="http://www.w3.org/2000/svg" width="21" height="20" viewBox="0 0 21 20" fill="none">
                                    <path d="M8.34375 14.1665L11.6771 9.99984L8.34375 5.83317" stroke="#9AA4B2" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                                </svg>
                            </i>
                        </div>
                    </div>
                </div>

                <div className="bg-white mt-12 p-3 flex flex-col gap-[6px] rounded-3xl">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-full bg-[#F8FAFC]">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M17.3439 8.99984C17.3439 11.511 16.2332 13.7627 14.4763 15.2905C13.0131 16.5629 11.1018 17.3332 9.01058 17.3332C6.91935 17.3332 5.00803 16.5629 3.54488 15.2905C1.78795 13.7627 0.677246 11.511 0.677246 8.99984C0.677246 4.39746 4.40821 0.666504 9.01058 0.666504C13.613 0.666504 17.3439 4.39746 17.3439 8.99984ZM11.5106 6.49984C11.5106 5.11913 10.3913 3.99984 9.01058 3.99984C7.62987 3.99984 6.51058 5.11913 6.51058 6.49984C6.51058 7.88055 7.62987 8.99984 9.01058 8.99984C10.3913 8.99984 11.5106 7.88055 11.5106 6.49984ZM9.01058 10.6665C10.4378 10.6665 11.3764 11.4304 12.0382 12.2794C12.532 12.9129 12.3621 13.8421 11.6458 14.2054C10.8542 14.6069 9.95883 14.8332 9.01058 14.8332C8.06233 14.8332 7.16692 14.6069 6.3754 14.2054C5.65909 13.8421 5.48914 12.9129 5.98291 12.2794C6.64471 11.4304 7.5833 10.6665 9.01058 10.6665Z" fill="#28303F" />
                            </svg>
                        </div>
                        <div className="flex flex-grow items-center justify-between border-b-[1px] py-4">
                            <p className="text-xs font-semibold text-[#121926]">Personal Info</p>
                            <i>
                                <svg xmlns="http://www.w3.org/2000/svg" width="21" height="20" viewBox="0 0 21 20" fill="none">
                                    <path d="M8.34375 14.1665L11.6771 9.99984L8.34375 5.83317" stroke="#9AA4B2" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                                </svg>
                            </i>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-full bg-[#F8FAFC]">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="17" viewBox="0 0 16 17" fill="none">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M2.49184 3.11881L6.65669 1.26776C7.51857 0.884704 8.50239 0.884704 9.36428 1.26776L13.5126 3.11147C14.7257 3.65062 15.522 4.86238 15.437 6.18716C15.1109 11.2687 13.6582 13.5658 9.73101 16.2308C8.69462 16.9341 7.32748 16.9324 6.29032 16.2302C2.37521 13.5796 0.868511 11.3145 0.568817 6.16934C0.492159 4.85326 1.28715 3.65422 2.49184 3.11881ZM10.9808 7.74431C11.2081 7.48454 11.1818 7.08968 10.922 6.86238C10.6623 6.63508 10.2674 6.66141 10.0401 6.92118L7.64853 9.65442C7.57512 9.73833 7.44866 9.74956 7.3616 9.67991L5.90092 8.51137C5.63138 8.29574 5.23807 8.33944 5.02244 8.60898C4.80681 8.87851 4.85051 9.27182 5.12005 9.48745L6.58073 10.656C7.19014 11.1435 8.07535 11.0649 8.58925 10.4776L10.9808 7.74431Z" fill="#28303F" />
                            </svg>
                        </div>
                        <div className="flex flex-grow items-center justify-between border-b-[1px] py-4">
                            <p className="text-xs font-semibold text-[#121926]">Security</p>
                            <i>
                                <svg xmlns="http://www.w3.org/2000/svg" width="21" height="20" viewBox="0 0 21 20" fill="none">
                                    <path d="M8.34375 14.1665L11.6771 9.99984L8.34375 5.83317" stroke="#9AA4B2" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                                </svg>
                            </i>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-full bg-[#F8FAFC]">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M17.3439 8.99984C17.3439 11.511 16.2332 13.7627 14.4763 15.2905C13.0131 16.5629 11.1018 17.3332 9.01058 17.3332C6.91935 17.3332 5.00803 16.5629 3.54488 15.2905C1.78795 13.7627 0.677246 11.511 0.677246 8.99984C0.677246 4.39746 4.40821 0.666504 9.01058 0.666504C13.613 0.666504 17.3439 4.39746 17.3439 8.99984ZM11.5106 6.49984C11.5106 5.11913 10.3913 3.99984 9.01058 3.99984C7.62987 3.99984 6.51058 5.11913 6.51058 6.49984C6.51058 7.88055 7.62987 8.99984 9.01058 8.99984C10.3913 8.99984 11.5106 7.88055 11.5106 6.49984ZM9.01058 10.6665C10.4378 10.6665 11.3764 11.4304 12.0382 12.2794C12.532 12.9129 12.3621 13.8421 11.6458 14.2054C10.8542 14.6069 9.95883 14.8332 9.01058 14.8332C8.06233 14.8332 7.16692 14.6069 6.3754 14.2054C5.65909 13.8421 5.48914 12.9129 5.98291 12.2794C6.64471 11.4304 7.5833 10.6665 9.01058 10.6665Z" fill="#28303F" />
                            </svg>
                        </div>
                        <div className="flex flex-grow items-center justify-between py-4">
                            <p className="text-xs font-semibold text-[#121926]">About Trade Sentinel</p>
                            <i>
                                <svg xmlns="http://www.w3.org/2000/svg" width="21" height="20" viewBox="0 0 21 20" fill="none">
                                    <path d="M8.34375 14.1665L11.6771 9.99984L8.34375 5.83317" stroke="#9AA4B2" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                                </svg>
                            </i>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-3 flex flex-col gap-[6px] rounded-3xl mt-12">
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
