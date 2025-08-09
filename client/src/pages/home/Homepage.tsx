import { FaChevronRight, FaCheck } from "react-icons/fa6";
import { useEffect } from "react";
import HomeBottomNavbar from "../../components/homeComponents/HomeBottomNavbar";
import { useGeneralAppStore } from "../../utils/generalAppStore";
import Alerts from "../../components/homeComponents/Alerts";
import AlertInfoToShow from "../../components/homeComponents/AlertInfoToShow";
import TopPairs from "../../components/homeComponents/TopPairs";
import { useLocation, useNavigate } from "react-router-dom";
import { db } from "../../utils/firebaseInit";
import { collection, query, where, orderBy, limit, onSnapshot, Unsubscribe } from "firebase/firestore";
import { Clock, Person } from "../../components/Icons";
import { toast } from 'react-toastify';

// Component to show design for when a user does not have any alert on active and previous
export function CreateFirstAlert() {
    return (
        <div className="bg-white rounded-xl w-full flex flex-col items-center justify-center p-[0.625rem]">
            <Clock />
            <p className="mt-4 text-center max-w-[230px]">Tap the <span className="text-[#9E77ED]">+</span> sign below to create your first alert.</p>
        </div>
    )
}

export default function Homepage() {
    const navigateTo = useNavigate();
    const location = useLocation();

    // Get states and actions from Zustand store
    const {
        currentUser,
        userProfileName,
        hasSetAvatar,
        avatarId,
        pwaPromptDismissed,
        alerts, // This is alerts: { active: [], previous: [] }
        showAlertInfo
    } = useGeneralAppStore((state) => ({
        currentUser: state.currentUser,
        userProfileName: state.userProfileName,
        hasSetAvatar: state.hasSetAvatar,
        avatarId: state.avatarId,
        pwaPromptDismissed: state.pwaPromptDismissed,
        alerts: state.alerts, // Get the whole alerts object
        showAlertInfo: state.showAlertInfo
    }));

    const {
        updateActiveAlerts,
        updatePreviousAlerts,
        updateShowAlertInfo
    } = useGeneralAppStore((state) => state); // Get all actions

    const userName = userProfileName || currentUser?.displayName || currentUser?.email?.split('@')[0] || "User";
    const allTodosCompleted = hasSetAvatar && pwaPromptDismissed;

    const handlePwaTodoClick = () => {
        navigateTo("/setup_pwa");
    };

    // Fetch alerts from Firestore using onSnapshot for real-time updates
    useEffect(() => {
        if (!currentUser) {
            updateActiveAlerts([]);
            updatePreviousAlerts([]);
            return () => { }; // Return an empty unsubscribe function if no user
        }

        const alertsCollectionRef = collection(db, "users", currentUser.uid, "alerts");
        let unsubscribeActive: Unsubscribe = () => { };
        let unsubscribePrevious: Unsubscribe = () => { };

        // Listener for Active Alerts
        const qActive = query(
            alertsCollectionRef,
            where("status", "in", ["active", "paused"]),
            orderBy("createdAt", "desc"),
            limit(10)
        );
        unsubscribeActive = onSnapshot(qActive, (querySnapshot) => {
            const activeAlertsData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as any));
            updateActiveAlerts(activeAlertsData);
        }, (error) => {
            console.error("Error fetching active alerts with onSnapshot: ", error);
            toast("Could not fetch active alerts in real-time.", { type: "error" });
        });

        // Listener for Previous Alerts
        const qPrevious = query(
            alertsCollectionRef,
            where("status", "in", ["triggered", "cancelled"]),
            orderBy("createdAt", "desc"),
            limit(5)
        );
        unsubscribePrevious = onSnapshot(qPrevious, (querySnapshot) => {
            const previousAlertsData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as any));
            updatePreviousAlerts(previousAlertsData);
        }, (error) => {
            console.error("Error fetching previous alerts with onSnapshot: ", error);
            toast("Could not fetch previous alerts in real-time.", { type: "error" });
        });

        // Cleanup function to unsubscribe from listeners when component unmounts or currentUser changes
        return () => {
            console.log("Unsubscribing from Firestore alert listeners");
            unsubscribeActive();
            unsubscribePrevious();
        };

    }, [currentUser, updateActiveAlerts, updatePreviousAlerts]);

    useEffect(() => {
        const handleTouchStart = (e: TouchEvent) => {
            e.preventDefault();
            e.stopPropagation();
            updateShowAlertInfo(false);
        };

        const handleClick = (e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            updateShowAlertInfo(false);
        };

        if (showAlertInfo) {
            document.getElementById('blurredBackground')?.addEventListener('touchstart', handleTouchStart);
            document.getElementById('blurredBackground')?.addEventListener('click', handleClick);
        }

        return () => {
            document.getElementById('blurredBackground')?.removeEventListener('touchstart', handleTouchStart);
            document.getElementById('blurredBackground')?.removeEventListener('click', handleClick);
        };
    }, [showAlertInfo, updateShowAlertInfo]);

    return (
        <>
            <div id="blurredBackground" className={`overflow-scroll relative dynamicHeight flex flex-col flex-grow p-[1.25rem] pb-12 w-full ${showAlertInfo ? 'blur-sm blurredBackground' : ''}`}>
                <div className="bg-white border-[#EEF2F6] border-[0.5px] p-[2px] rounded-full flex w-full items-center justify-between">
                    <div className="flex gap-4 items-center">
                        <i className="overflow-hidden rounded-full">
                            {avatarId && hasSetAvatar ? (
                                <img
                                    src={`/avatar${avatarId}.svg`}
                                    alt="User Avatar"
                                    className="h-[40px] w-[40px] rounded-full object-cover"
                                />
                            ) : (
                                <div className="h-[40px] w-[40px] rounded-full bg-[#EEF2F6] flex items-center justify-center">
                                    <Person />
                                </div>
                            )}
                        </i>
                        <div className="flex flex-col text-xs text-[#101828]">
                            <p>Welcome Back,</p>
                            <p className="font-medium">{userName}</p>
                        </div>
                    </div>
                    <p className="p-[0.625rem]">👋</p>
                </div>
                {!allTodosCompleted && (
                    <div className="mt-6">
                        <h2 className="text-xs font-semibold text-[#475467]">My Todos</h2>
                        <div className="grid grid-cols-2 gap-3 mt-3">
                            {!hasSetAvatar && (
                                <div
                                    onClick={() => navigateTo("/profile")}
                                    role="button"
                                    tabIndex={0}
                                    className="bg-white flex flex-col gap-2 p-3 rounded-xl cursor-pointer hover:shadow-md transition-shadow"
                                >
                                    <p className="text-xs text-[#121926] font-semibold leading-[18px]">Setup Your <br />Avatar 🖼</p>
                                    <hr />
                                    <i className="text-xs h-[16px] w-[16px] flex items-center justify-center rounded-full bg-[#F4EBFF] text-[#364152]">
                                        <FaChevronRight />
                                    </i>
                                </div>
                            )}
                            {hasSetAvatar && (
                                <div className="bg-white flex flex-col gap-2 p-3 rounded-xl opacity-70">
                                    <p className="text-xs text-[#121926] font-semibold leading-[18px] line-through">Setup Your <br />Avatar 🖼</p>
                                    <hr />
                                    <i className="text-xs h-[16px] w-[16px] flex items-center justify-center rounded-full bg-green-100 text-green-600">
                                        <FaCheck />
                                    </i>
                                </div>
                            )}
                            {!pwaPromptDismissed && (
                                <div
                                    onClick={handlePwaTodoClick}
                                    role="button"
                                    tabIndex={0}
                                    className="bg-white flex flex-col gap-2 p-3 rounded-xl cursor-pointer hover:shadow-md transition-shadow"
                                >
                                    <p className="text-xs text-[#121926] font-semibold leading-[18px]">Add To <br />Home screen📱</p>
                                    <hr />
                                    <i className="text-xs h-[16px] w-[16px] flex items-center justify-center rounded-full bg-[#F4EBFF] text-[#364152]">
                                        <FaChevronRight />
                                    </i>
                                </div>
                            )}
                            {pwaPromptDismissed && (
                                <div className="bg-white flex flex-col gap-2 p-3 rounded-xl opacity-70">
                                    <p className="text-xs text-[#121926] font-semibold leading-[18px] line-through">Add To <br />Home screen📱</p>
                                    <hr />
                                    <i className="text-xs h-[16px] w-[16px] flex items-center justify-center rounded-full bg-green-100 text-green-600">
                                        <FaCheck />
                                    </i>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                <div className="mt-8 flex-grow flex flex-col overflow-scroll scrollbarHidden pb-16">
                    {alerts.active.length === 0 && alerts.previous.length === 0 ?
                        <CreateFirstAlert /> :
                        <div className="flex flex-col overflow-y-scroll scrollbarHidden w-full">
                            <Alerts />
                        </div>
                    }
                    <TopPairs />
                </div>
                <div className="fixed bottom-12 flex items-center justify-center w-full inset-x-0 px-[1.25rem]">
                    <HomeBottomNavbar path={location.pathname} />
                </div>
            </div>
            <div className='fixed bottom-0 w-full left-0 flex items-center justify-center'>
                {showAlertInfo && <AlertInfoToShow />}
            </div>
        </>
    )
}
