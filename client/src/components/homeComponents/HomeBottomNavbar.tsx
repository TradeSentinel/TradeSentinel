import { useNavigate } from "react-router-dom"

export default function HomeBottomNavbar({ path }: { path: string }) {

    const navigateTo = useNavigate();

    return (
        <div className="flex items-center max-w-[600px] w-full">
            <div className="bg-[#121926] p-[4px] flex items-center rounded-full w-full">
                <button
                    onClick={() => navigateTo('/dashboard')}
                    className="rounded-full p-[4px] bg-[#121926] w-full flex items-center justify-start gap-3"
                >
                    <div className={`p-3 rounded-full ${path === '/dashboard' ? 'bg-[#9E77ED]' : 'bg-white'}`}>
                        <i className="h-5 w-5">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 14 16" fill="none">
                                <path fillRule="evenodd" clipRule="evenodd" d="M6.99992 0.205688C4.30904 0.205688 2.04477 2.2814 1.73295 5.03405L1.44555 7.5711C1.37414 8.20151 1.11864 8.79475 0.712829 9.2724C-0.148343 10.286 0.550596 11.8724 1.85836 11.8724H12.1415C13.4492 11.8724 14.1482 10.286 13.287 9.2724C12.8812 8.79475 12.6257 8.20151 12.5543 7.5711L12.2669 5.03405C11.9551 2.2814 9.6908 0.205688 6.99992 0.205688ZM9.47668 13.5986C9.09554 14.5383 8.13036 15.2057 6.99992 15.2057C5.86947 15.2057 4.9043 14.5383 4.52316 13.5986C4.50727 13.5594 4.49992 13.5174 4.49992 13.4751C4.49992 13.2803 4.65785 13.1224 4.85266 13.1224H9.14718C9.34199 13.1224 9.49992 13.2803 9.49992 13.4751C9.49992 13.5174 9.49256 13.5594 9.47668 13.5986Z" fill={path === '/dashboard' ? '#ffffff' : '#121926'} />
                            </svg>
                        </i>
                    </div>
                    <p className="text-white text-xs">Alerts</p>
                </button>
            </div>
            <div className="bg-[#121926] p-[4px] flex items-center w-3 h-5 mx-[-2px] curvedBox overflow-hidden">

            </div>
            <div className="bg-[#121926] p-[4px] flex items-center rounded-full ">
                <button
                    onClick={() => navigateTo('/create_alert')}
                    className="p-3 rounded-full bg-white"
                >
                    <i className="h-5 w-5">
                        <svg xmlns="http://www.w3.org/2000/svg" width="17" height="18" viewBox="0 0 17 18" fill="none">
                            <path fillRule="evenodd" clipRule="evenodd" d="M16.8334 8.70565C16.8334 13.308 13.1025 17.039 8.50008 17.039C3.89771 17.039 0.166748 13.308 0.166748 8.70565C0.166748 4.10328 3.89771 0.372314 8.50008 0.372314C13.1025 0.372314 16.8334 4.10328 16.8334 8.70565ZM4.41675 8.70565C4.41675 8.29143 4.75253 7.95565 5.16675 7.95565H7.75008V5.37231C7.75008 4.9581 8.08587 4.62231 8.50008 4.62231C8.91429 4.62231 9.25008 4.9581 9.25008 5.37231V7.95565H11.8334C12.2476 7.95565 12.5834 8.29143 12.5834 8.70565C12.5834 9.11986 12.2476 9.45565 11.8334 9.45565H9.25008V12.039C9.25008 12.4532 8.91429 12.789 8.50008 12.789C8.08587 12.789 7.75008 12.4532 7.75008 12.039V9.45565H5.16675C4.75253 9.45565 4.41675 9.11986 4.41675 8.70565Z" fill="#121926" />
                        </svg>
                    </i>
                </button>
            </div>
            <div className="bg-[#121926] p-[4px] flex items-center w-3 h-5 mx-[-2px] curvedBox overflow-hidden">

            </div>
            <div className="bg-[#121926] p-[4px] flex items-center rounded-full w-full">
                <button
                    onClick={() => navigateTo("/account")}
                    className="rounded-full p-[4px] bg-[#121926] w-full flex items-center flex-row-reverse gap-3">
                    <div className={`p-3 rounded-full ${path === '/account' ? 'bg-[#9E77ED]' : 'bg-white'}`}>
                        <i className="h-5 w-5">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 12 16" fill="none">
                                <path fillRule="evenodd" clipRule="evenodd" d="M6.00008 6.87236C7.84103 6.87236 9.33341 5.37997 9.33341 3.53902C9.33341 1.69807 7.84103 0.205688 6.00008 0.205688C4.15913 0.205688 2.66675 1.69807 2.66675 3.53902C2.66675 5.37997 4.15913 6.87236 6.00008 6.87236ZM6.00008 15.2057C9.22174 15.2057 11.8334 13.7133 11.8334 11.8724C11.8334 10.0314 9.22174 8.53902 6.00008 8.53902C2.77842 8.53902 0.166748 10.0314 0.166748 11.8724C0.166748 13.7133 2.77842 15.2057 6.00008 15.2057Z" fill={path === '/account' ? '#ffffff' : '#121926'} />
                            </svg>
                        </i>
                    </div>
                    <p className="text-white text-xs">Account</p>
                </button>
            </div>
        </div>
    )
}