import { useState, useEffect } from "react";
import PageHeader from "../../components/homeComponents/PageHeader";
import MiniLoader from "../../components/MiniLoader";
import CurrencyPairs from "../../components/homeComponents/CurrencyPairs";
import AlertType from "../../components/homeComponents/AlertType";
import { toast } from 'react-toastify';
import { useNavigate, useParams } from "react-router-dom";
import { useGeneralAppStore, generalAlertType } from "../../utils/generalAppStore";
import { db } from "../../utils/firebaseInit";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import PageLoader from "../../components/PageLoader";
import { LivePrice, WsStatus } from "../../types/websocket";
import { priceSocket } from "../../utils/priceSocket";

export default function EditAlert() {
    const navigateTo = useNavigate();
    const { alertId } = useParams<{ alertId: string }>();
    const [loading, setLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);

    type modalType = "pairModal" | "alertTypeModal" | "keyboardModal";
    const [showModals, setShowModals] = useState({
        pairModal: false,
        alertTypeModal: false,
        keyboardModal: false
    });

    const newAlert = useGeneralAppStore(state => state.newAlert);
    const updateNewAlert = useGeneralAppStore(state => state.updateNewAlert);
    const currentUser = useGeneralAppStore(state => state.currentUser);
    const updateAlertInLists = useGeneralAppStore(state => state.updateAlertInLists);
    const currentInfo = useGeneralAppStore(state => state.currentInfo);

    // Live price state
    const [livePrice, setLivePrice] = useState<LivePrice>({ ask: '', bid: '', timestamp: null });
    const [wsStatus, setWsStatus] = useState<WsStatus>('disconnected');

    useEffect(() => {
        if (!alertId || !currentUser) {
            toast.error("Alert ID or user information is missing.");
            navigateTo("/dashboard");
            setIsFetching(false);
            return;
        }
        setIsFetching(true);
        const fetchAlert = async () => {
            try {
                const alertDocRef = doc(db, "users", currentUser.uid, "alerts", alertId);
                const docSnap = await getDoc(alertDocRef);

                if (docSnap.exists()) {
                    const alertData = docSnap.data() as generalAlertType;
                    updateNewAlert({
                        ...alertData,
                        id: docSnap.id
                    });
                    // Trigger WebSocket connection after alert data (including currencyPair) is loaded
                    // The WebSocket useEffect below will pick up the currencyPair from newAlert
                } else {
                    toast.error("Alert not found.");
                    navigateTo("/dashboard");
                }
            } catch (error) {
                console.error("Error fetching alert:", error);
                toast.error("Failed to fetch alert details.");
                navigateTo("/dashboard");
            }
            setIsFetching(false);
        };

        fetchAlert();

        return () => {
            // Reset newAlert when the component unmounts
            updateNewAlert({
                currencyPair: '',
                triggerPrice: '',
                alertType: '',
                status: 'active',
                notificationPreferences: { email: true, push: false }
            });
        };
    }, [alertId, currentUser, navigateTo, updateNewAlert]);

    const { currencyPair, alertType, triggerPrice, notificationPreferences } = newAlert;
    const { pairModal, alertTypeModal } = showModals;

    const updateShowModals = (name: modalType, value: boolean) => {
        setShowModals(prevModals => ({
            ...prevModals,
            [name]: value
        }));
    };

    const priceState = !currencyPair ? 'disconnected'
        : wsStatus === 'error' ? 'error'
            : wsStatus === 'disconnected' ? 'disconnected'
                : livePrice.delayed ? 'delayed'
                    : livePrice.stale ? 'stale'
                        : livePrice.marketOpen === false ? 'closed'
                            : wsStatus === 'subscribed' && livePrice.ask && livePrice.bid ? 'live'
                                : wsStatus === 'connecting' ? 'connecting'
                                    : 'connected';

    const priceStateLabel = priceState === 'live' ? 'Live'
        : priceState === 'delayed' ? 'Delayed'
            : priceState === 'stale' ? 'Stale'
                : priceState === 'closed' ? 'Market closed'
                    : priceState === 'error' ? 'Error'
                        : priceState === 'disconnected' ? 'Disconnected'
                            : priceState === 'connecting' ? 'Connecting'
                                : 'Connected';

    const priceBadgeClass = priceState === 'live' ? 'bg-green-100 text-green-700'
        : priceState === 'delayed' || priceState === 'stale' || priceState === 'closed' ? 'bg-amber-100 text-amber-700'
            : priceState === 'error' ? 'bg-red-100 text-red-700'
                : 'bg-gray-100 text-gray-700';

    // Subscribe to the shared price socket once the alert data is loaded.
    useEffect(() => {
        if (!currencyPair || isFetching) {
            setWsStatus('disconnected');
            setLivePrice({ ask: '', bid: '', timestamp: null });
            return;
        }

        setWsStatus('connecting');
        setLivePrice({ ask: '', bid: '', timestamp: null });

        const unsubscribeQuote = priceSocket.subscribe(currencyPair, (quote) => {
            setLivePrice({
                ask: quote.ask,
                bid: quote.bid,
                timestamp: quote.timestamp,
                stale: quote.stale,
                delayed: quote.delayed,
                marketOpen: quote.marketOpen,
                source: quote.source
            });
            setWsStatus('subscribed');
        });

        const unsubscribeStatus = priceSocket.onStatus((status) => {
            setWsStatus((current) => {
                if (status === 'error') return 'error';
                if (status === 'disconnected') return 'disconnected';
                if (status === 'subscribed') return current === 'subscribed' ? 'subscribed' : 'connected';
                return status;
            });
        });

        return () => {
            unsubscribeQuote();
            unsubscribeStatus();
        };
    }, [currencyPair, isFetching]);

    async function handleUpdateAlert() {
        if (!alertId || !currentUser) {
            toast.error("Cannot update: Alert ID or user information is missing.");
            return;
        }
        if (alertType === '' || currencyPair === '' || triggerPrice === '') {
            toast.error('Please fill all fields.');
            return;
        }
        if (!notificationPreferences.email && !notificationPreferences.push) {
            toast.error('Choose at least one notification type.');
            return;
        }

        setLoading(true);
        try {
            const alertDocRef = doc(db, "users", currentUser.uid, "alerts", alertId);
            const updatedData: Partial<generalAlertType> = {
                currencyPair,
                alertType,
                triggerPrice,
                notificationPreferences,
            };
            await updateDoc(alertDocRef, updatedData);
            const fullyUpdatedAlert = { ...newAlert, ...updatedData, id: alertId };
            updateAlertInLists(fullyUpdatedAlert as generalAlertType);
            if (currentInfo && currentInfo.id === alertId) {
                useGeneralAppStore.getState().updateCurrentInfo(fullyUpdatedAlert as generalAlertType);
            }
            toast.success("Alert updated successfully!");
            navigateTo("/dashboard");
        } catch (error) {
            console.error("Error updating alert: ", error);
            toast.error("Failed to update alert. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    if (isFetching) {
        return (
            <div className="dynamicHeight w-full flex items-center justify-center">
                <PageLoader />
            </div>
        );
    }

    return (
        <>
            <div className={`overflow-scroll dynamicHeight flex flex-col flex-grow p-[1.25rem] pb-12 w-full ${pairModal || alertTypeModal ? 'blur-sm' : ''}`}>
                <PageHeader name="Edit Alert" />
                <section className="flex flex-col gap-3 mt-5">
                    <h3 className="text-[1.25rem] font-semibold text-[#202939] leading-8">Customize your alert</h3>
                    <p className="text-sm text-[#202939] leading-5">
                        Modify the currency pair, trigger criteria, or notification preferences for your alert.
                    </p>
                </section>
                <section className="mt-8 flex flex-col gap-4 flex-grow overflow-scroll scrollbarHidden">
                    <div className="flex flex-col gap-[0.375rem]">
                        <p className="text-sm text-[#202939] font-medium">Currency pair</p>
                        <div
                            onClick={() => updateShowModals("pairModal", true)}
                            className="py-[0.625rem] px-[0.875rem] bg-white rounded-xl flex items-center justify-between cursor-pointer"
                        >
                            <p className={`text-base ${currencyPair === '' ? 'text-[#697586]' : 'text-[#121926]'}`}>
                                {currencyPair === '' ? 'Select pair' : currencyPair}
                            </p>
                            <i>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M4.66675 6.66675L8.00008 9.33341L11.3334 6.66675" stroke="#28303F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </i>
                        </div>
                    </div>
                    <div className="flex flex-col gap-[0.375rem]">
                        <p className="text-sm text-[#202939] font-medium">Alert type</p>
                        <div
                            onClick={() => updateShowModals("alertTypeModal", true)}
                            className="py-[0.625rem] px-[0.875rem] bg-white rounded-xl flex items-center justify-between cursor-pointer"
                        >
                            <p className={`text-base ${alertType === '' ? 'text-[#697586]' : 'text-[#121926]'}`}>
                                {alertType === '' ? 'Select type' : alertType}
                            </p>
                            <i>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M4.66675 6.66675L8.00008 9.33341L11.3334 6.66675" stroke="#28303F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </i>
                        </div>
                    </div>
                    <div className="flex flex-col gap-[0.375rem]">
                        <p className="text-sm text-[#202939] font-medium">Trigger price</p>
                        <div className="py-[0.625rem] px-[0.875rem] bg-white rounded-xl flex items-center justify-between">
                            <input
                                type="number"
                                value={triggerPrice}
                                onChange={(e) => updateNewAlert({ triggerPrice: e.target.value })}
                                className="w-full outline-none placeholder:text-[#697586] text-[#121926]"
                                placeholder="Enter a value"
                            />
                        </div>
                    </div>
                    {/* Display Live Price and WebSocket Status */}
                    {currencyPair && (
                        <div className="bg-white rounded-xl p-3 shadow-sm mt-3 flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                                <p className="text-sm font-medium text-[#202939]">
                                    Price: {currencyPair}
                                </p>
                                <span
                                    className={`px-2 py-0.5 text-xs rounded-full font-medium ${priceBadgeClass}`}
                                >
                                    {priceStateLabel}
                                </span>
                            </div>

                            {wsStatus === 'subscribed' && livePrice.ask && livePrice.bid ? (
                                <div className="text-sm">
                                    <div className="grid grid-cols-2 gap-2 items-center">
                                        <p>Ask: <span className="font-semibold text-green-600 text-base">{livePrice.ask}</span></p>
                                        <p>Bid: <span className="font-semibold text-red-600 text-base">{livePrice.bid}</span></p>
                                    </div>
                                    {livePrice.timestamp && (
                                        <p className="text-xs text-gray-500 mt-1 text-right">
                                            Updated: {new Date(livePrice.timestamp * 1000).toLocaleTimeString()}
                                        </p>
                                    )}
                                    {livePrice.delayed && (
                                        <p className="text-xs text-amber-600 mt-1 text-right">Delayed indicative feed</p>
                                    )}
                                    {livePrice.source === 'exchangerate.dev' && (
                                        <p className="text-[10px] text-gray-500 mt-1 text-right">
                                            Rates by <a href="https://exchangerate.dev" target="_blank" rel="noreferrer" className="underline">exchangerate.dev</a>
                                        </p>
                                    )}
                                    {livePrice.stale && !livePrice.delayed && (
                                        <p className="text-xs text-amber-600 mt-1 text-right">Quote is stale</p>
                                    )}
                                    {livePrice.marketOpen === false && (
                                        <p className="text-xs text-amber-600 mt-1 text-right">Market closed</p>
                                    )}
                                </div>
                            ) : wsStatus === 'connecting' || (wsStatus === 'connected' && !livePrice.ask) ? (
                                <p className="text-sm text-center text-gray-500 py-2">Fetching live price...</p>
                            ) : wsStatus === 'error' ? (
                                <p className="text-sm text-center text-red-500 py-2">Error fetching live price.</p>
                            ) : wsStatus === 'disconnected' && currencyPair ? (
                                <p className="text-sm text-center text-gray-500 py-2">Live price feed disconnected.</p>
                            ) : (
                                <p className="text-sm text-center text-gray-400 py-2">No live data available.</p> // Fallback for other states or initial load
                            )}
                        </div>
                    )}
                    <div className="flex flex-col gap-[0.375rem] mt-4">
                        <h4 className="text-[#364152] font-medium text-sm leading-5">Notification type</h4>
                        <div className="flex gap-2 items-center">
                            <button
                                onClick={() => updateNewAlert({ notificationPreferences: { ...notificationPreferences, email: !notificationPreferences?.email } })}
                                className="flex items-center mt-[2px] justify-center border-[1px] border-[#7F56D9] h-[16px] w-[16px] p-[2px] rounded-[0.25rem] cursor-pointer"
                            >
                                {
                                    notificationPreferences?.email &&
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
                                        <path d="M10 3L4.5 8.5L2 6" stroke="#7F56D9" strokeWidth="1.6666" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                }
                            </button>
                            <div>
                                <h4 className="text-[#364152] font-medium text-sm leading-5">Send email</h4>
                                <p className="text-[#667085] text-sm leading-5">Provides an email notification to the address specified on your profile.</p>
                            </div>
                        </div>
                        <div className="flex gap-2 items-center">
                            <button
                                onClick={() => updateNewAlert({ notificationPreferences: { ...notificationPreferences, push: !notificationPreferences?.push } })}
                                className="flex items-center mt-[2px] justify-center border-[1px] border-[#7F56D9] h-[16px] w-[16px] p-[2px] rounded-[0.25rem] cursor-pointer"
                            >
                                {
                                    notificationPreferences?.push &&
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
                                        <path d="M10 3L4.5 8.5L2 6" stroke="#7F56D9" strokeWidth="1.6666" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                }
                            </button>
                            <div>
                                <h4 className="text-[#364152] font-medium text-sm leading-5">Push notifications</h4>
                                <p className="text-[#667085] text-sm leading-5">Provides a push notification on your device.</p>
                            </div>
                        </div>
                    </div>
                </section>
                <div className="mt-auto py-3 w-full">
                    <button
                        disabled={loading || isFetching}
                        onClick={handleUpdateAlert}
                        className="text-white w-full flex items-center justify-center py-[10px] px-[18px] rounded-full bg-[#7F56D9] disabled:opacity-70"
                    >
                        {loading ? <MiniLoader /> : "Save Changes"}
                    </button>
                </div>
            </div>

            <div className='absolute bottom-0 w-full left-0 flex items-center justify-center'>
                {pairModal && <CurrencyPairs setShowModals={setShowModals} />}
                {alertTypeModal && <AlertType setShowModals={setShowModals} />}
            </div>
        </>
    )
}

