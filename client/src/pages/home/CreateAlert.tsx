import { useState, useEffect, useRef } from "react";
import PageHeader from "../../components/homeComponents/PageHeader";
import MiniLoader from "../../components/MiniLoader";
import CurrencyPairs from "../../components/homeComponents/CurrencyPairs";
import AlertType from "../../components/homeComponents/AlertType";
import { toast } from 'react-toastify';
import { useNavigate } from "react-router-dom";
import { useGeneralAppStore } from "../../utils/generalAppStore";
import { auth, db } from "../../utils/firebaseInit";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { LivePrice, WsParams, WsStatus } from "../../types/websocket"; // Import types

export default function CreateAlert() {
    const navigateTo = useNavigate();
    const [loading, setLoading] = useState(false);

    type modalType = "pairModal" | "alertTypeModal" | "keyboardModal";

    const [showModals, setShowModals] = useState({
        pairModal: false,
        alertTypeModal: false,
        keyboardModal: false
    });

    const newAlert = useGeneralAppStore(state => state.newAlert);
    const updateNewAlert = useGeneralAppStore(state => state.updateNewAlert);
    const currentUser = useGeneralAppStore(state => state.currentUser);

    const { currencyPair, alertType, triggerPrice, notificationPreferences } = newAlert;
    const { pairModal, alertTypeModal } = showModals;

    // WebSocket related state
    const [wsInstance, setWsInstance] = useState<WebSocket | null>(null);
    const [livePrice, setLivePrice] = useState<LivePrice>({ ask: '', bid: '', timestamp: null });
    const wsParamsRef = useRef<WsParams>({ mapping: null, order: null, startTime: null, timeMult: null, sessionUID: null });
    const [wsStatus, setWsStatus] = useState<WsStatus>('disconnected');

    const updateShowModals = (name: modalType, value: boolean) => {
        setShowModals(prevModals => ({
            ...prevModals,
            [name]: value
        }));
    };

    useEffect(() => {
        // Cleanup function to close WebSocket when component unmounts or currencyPair changes
        return () => {
            if (wsInstance) {
                wsInstance.close();
                setWsInstance(null);
                setWsStatus('disconnected');
                setLivePrice({ ask: '', bid: '', timestamp: null });
            }
        };
    }, [wsInstance]);


    useEffect(() => {
        if (!currencyPair || !import.meta.env.VITE_XCHANGE_API) {
            if (wsInstance) {
                console.log('[currencyPair useEffect] No currencyPair/API key, closing existing wsInstance:', wsInstance.url);
                wsInstance.close();
                setWsInstance(null);
            }
            setWsStatus('disconnected'); // Explicitly set to disconnected if no pair/key
            setLivePrice({ ask: '', bid: '', timestamp: null });
            wsParamsRef.current = { mapping: null, order: null, startTime: null, timeMult: null, sessionUID: null };
            return;
        }

        // If a new currencyPair is selected, we always intend to start a new connection sequence.
        // First, ensure any existing wsInstance is commanded to close.
        if (wsInstance) {
            console.log('[currencyPair useEffect] New pair. Closing old wsInstance:', wsInstance.url);
            wsInstance.close();
            setWsInstance(null); // This will trigger its dedicated cleanup effect.
        }

        console.log(`[currencyPair useEffect] Initiating new WebSocket for ${currencyPair}`);
        setWsStatus('connecting');
        setLivePrice({ ask: '', bid: '', timestamp: null });
        wsParamsRef.current = { mapping: null, order: null, startTime: null, timeMult: null, sessionUID: null };

        const newSocket = new WebSocket(`wss://api.xchangeapi.com/websocket/live?api-key=${import.meta.env.VITE_XCHANGE_API}`);
        let isCurrentSocket = true; // Flag to track if this newSocket is still the intended one

        newSocket.onopen = () => {
            if (!isCurrentSocket) return; // Stale socket, do nothing
            console.log(`[newSocket.onopen] WebSocket connected for ${currencyPair}`);
            setWsInstance(newSocket);
            setWsStatus('connected');
            const formattedPair = currencyPair.replace('/', '');
            newSocket.send(JSON.stringify({ "pairs": [formattedPair] }));
        };

        newSocket.onmessage = (event) => {
            if (!isCurrentSocket) return; // Stale socket
            const message = event.data as string;
            const messageCode = message.substring(0, 1);
            const messageBody = message.substring(1);
            try {
                if (messageCode === '0') {
                    const initialData = JSON.parse(messageBody);
                    wsParamsRef.current = {
                        mapping: initialData.mapping, order: initialData.order,
                        startTime: initialData.start_time, timeMult: initialData.time_mult,
                        sessionUID: initialData.session_uid
                    };
                    setWsStatus('subscribed');
                    console.log('WebSocket subscribed, params set (ref):', wsParamsRef.current);
                } else if (messageCode === '1') {
                    const currentWsParams = wsParamsRef.current;
                    if (currentWsParams.order && currentWsParams.mapping && currentWsParams.startTime && currentWsParams.timeMult) {
                        console.log('[WebSocket TYPE 1] Raw body:', messageBody);
                        const parts = messageBody.split('|');
                        const update: Record<string, string | number> = {};
                        currentWsParams.order.forEach((key, index) => { update[key] = parts[index]; });
                        const pairId = update.name as string;
                        const pairName = currentWsParams.mapping[pairId];
                        const formattedAppCurrencyPair = currencyPair.replace('/', '');
                        console.log(`[WebSocket TYPE 1] Comparing: API pairName (${pairId} -> ${pairName}) vs App formatted pair (${formattedAppCurrencyPair})`);

                        if (pairName === formattedAppCurrencyPair) {
                            console.log('[WebSocket TYPE 1] Match! Processing price for:', pairName);
                            const ask = update.ask as string;
                            const bid = update.bid as string;
                            const relativeTime = parseFloat(update.time as string);
                            const fullTimestamp = currentWsParams.startTime + (relativeTime / currentWsParams.timeMult);
                            console.log(`[WebSocket TYPE 1] Setting live price - Ask: ${ask}, Bid: ${bid}, Timestamp: ${fullTimestamp}`);
                            setLivePrice({ ask, bid, timestamp: fullTimestamp });
                        } else {
                            console.log('[WebSocket TYPE 1] No match for currency pair.');
                        }
                    }
                } else if (messageCode === '2') {
                    // console.log('WebSocket Ping received');
                    // Optionally send a pong if required by the server, though xchange.md says PING/PONG is disabled
                } else if (messageCode === '7' || messageCode === '9') {
                    const errorData = JSON.parse(messageBody);
                    console.error('WebSocket Error Message:', errorData);
                    toast(`WebSocket Error: ${errorData.error}`, { type: "error" });
                    setWsStatus('error');
                }
            } catch (e) {
                console.error('Error processing WebSocket message:', e);
            }
        };

        newSocket.onerror = (error) => {
            if (!isCurrentSocket) return; // Stale socket
            console.error(`[newSocket.onerror] WebSocket error for ${currencyPair}:`, error);
            toast('WebSocket connection error.', { type: "error" });
            setWsStatus('error');
            // No need to setWsInstance(null) here, onclose will handle if it was the active one.
        };

        newSocket.onclose = (event) => {
            if (!isCurrentSocket) return; // Stale socket
            console.log(`[newSocket.onclose] WebSocket disconnected for ${currencyPair}:`, event.reason);
            // Only set to disconnected if this socket was indeed the active one being managed
            // or if no other valid instance has taken over.
            // The wsInstance cleanup effect is the primary place for nullifying wsInstance.
            setWsStatus('disconnected');
            // if (wsInstance === newSocket) { // This check might be tricky due to timing
            //    setWsInstance(null); // Let the other effect handle it after this status update
            // }
        };

        return () => {
            console.log(`[currencyPair useEffect Cleanup] for ${currencyPair}. Setting isCurrentSocket=false.`);
            isCurrentSocket = false; // Mark this newSocket instance as stale for its callbacks
            // If newSocket was created but never made it to wsInstance (e.g., user changed pair again quickly)
            // and it's not yet closed, close it now.
            if (newSocket.readyState < WebSocket.CLOSING) {
                console.log(`[currencyPair useEffect Cleanup] Actively closing non-current newSocket for ${currencyPair}`);
                newSocket.close();
            }
        };

    }, [currencyPair]);

    // Effect for cleaning up the wsInstance when it changes or component unmounts
    useEffect(() => {
        const currentWs = wsInstance; // Capture instance for this specific cleanup
        return () => {
            if (currentWs) {
                console.log('[wsInstance useEffect Cleanup] Closing WebSocket identified as currentWs:', currentWs.url);
                currentWs.close();
                // Reset states associated with an active connection
                // wsStatus will be handled by onclose of the socket, or by the next pair's connecting status
                setLivePrice({ ask: '', bid: '', timestamp: null });
                wsParamsRef.current = { mapping: null, order: null, startTime: null, timeMult: null, sessionUID: null };
            }
        };
    }, [wsInstance]); // This effect runs when wsInstance is explicitly set or set to null


    useEffect(() => {
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
    }, [updateNewAlert]);

    async function createNewAlertInFirestore() {
        if (!currentUser) {
            toast('Please log in to create alerts.', { type: "error" });
            setLoading(false);
            return;
        }

        if (alertType === '' || currencyPair === '' || triggerPrice === '') {
            toast('Fill all fields', { type: "error" });
            setLoading(false);
            return;
        }
        if (!notificationPreferences.email && !notificationPreferences.push) {
            toast('Choose at least one notification type', { type: "error" });
            setLoading(false);
            return;
        }

        setLoading(true);

        try {
            const alertDataToSave = {
                ...newAlert,
                userId: currentUser.uid,
                createdAt: serverTimestamp()
            };

            const userAlertsCollection = collection(db, "users", currentUser.uid, "alerts");
            await addDoc(userAlertsCollection, alertDataToSave);

            toast('Alert created successfully!', { type: "success" });
            updateNewAlert({
                currencyPair: '',
                triggerPrice: '',
                alertType: '',
                status: 'active',
                notificationPreferences: { email: true, push: false }
            });
            navigateTo("/alert_added_successfully");

        } catch (error) {
            console.error("Error creating alert: ", error);
            toast('Error creating alert. Please try again.', { type: "error" });
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <div className={`overflow-scroll dynamicHeight flex flex-col flex-grow p-[1.25rem] pb-12 w-full ${pairModal === true || alertTypeModal === true ? 'blur-sm' : ''}`}>
                <PageHeader name="Create Alert" />
                <section className="flex flex-col gap-3 mt-5">
                    <h3 className="text-[1.25rem] font-semibold text-[#202939] leading-8">Customize your alert</h3>
                    <p className="text-sm text-[#202939] leading-5">
                        Enter the currency pair you want to watch and select alert trigger criteria.
                    </p>
                </section>
                <section className="mt-8 flex flex-col gap-4 flex-grow overflow-scroll scrollbarHidden">
                    <div className="flex flex-col gap-[0.375rem]">
                        <p className="text-sm text-[#202939] font-medium">Currency pair</p>
                        <div
                            onClick={() => updateShowModals("pairModal", !pairModal)}
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
                            onClick={() => updateShowModals("alertTypeModal", !alertTypeModal)}
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
                                    Live: {currencyPair}
                                </p>
                                <span
                                    className={`px-2 py-0.5 text-xs rounded-full font-medium 
                                        ${wsStatus === 'subscribed' ? 'bg-green-100 text-green-700' :
                                            wsStatus === 'connecting' || wsStatus === 'connected' ? 'bg-blue-100 text-blue-700' :
                                                wsStatus === 'error' ? 'bg-red-100 text-red-700' :
                                                    'bg-gray-100 text-gray-700'
                                        }`}
                                >
                                    {wsStatus.charAt(0).toUpperCase() + wsStatus.slice(1)}
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
                                onClick={() => updateNewAlert({ notificationPreferences: { ...notificationPreferences, email: !notificationPreferences.email } })}
                                className="flex items-center mt-[2px] justify-center border-[1px] border-[#7F56D9] h-[16px] w-[16px] p-[2px] rounded-[0.25rem] cursor-pointer"
                            >
                                {
                                    notificationPreferences.email &&
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
                                onClick={() => updateNewAlert({ notificationPreferences: { ...notificationPreferences, push: !notificationPreferences.push } })}
                                className="flex items-center mt-[2px] justify-center border-[1px] border-[#7F56D9] h-[16px] w-[16px] p-[2px] rounded-[0.25rem] cursor-pointer"
                            >
                                {
                                    notificationPreferences.push &&
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
                        disabled={loading}
                        onClick={createNewAlertInFirestore}
                        className="text-white w-full flex items-center justify-center py-[10px] px-[18px] rounded-full bg-[#7F56D9] disabled:opacity-70"
                    >
                        {loading ? <MiniLoader /> : "Create New Alert"}
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
