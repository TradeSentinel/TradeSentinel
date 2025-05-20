import { useState, useEffect } from "react";
import PageHeader from "../../components/homeComponents/PageHeader";
import MiniLoader from "../../components/MiniLoader";
import CurrencyPairs from "../../components/homeComponents/CurrencyPairs";
import AlertType from "../../components/homeComponents/AlertType";
import { toast } from 'react-toastify';
import { useNavigate } from "react-router-dom";
import { useGeneralAppStore } from "../../utils/generalAppStore";
import { auth, db } from "../../utils/firebaseInit";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

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

    const updateShowModals = (name: modalType, value: boolean) => {
        setShowModals(prevModals => ({
            ...prevModals,
            [name]: value
        }));
    };

    useEffect(() => {
        return () => {
            updateNewAlert({
                currencyPair: '',
                triggerPrice: '',
                alertType: '',
                status: 'active',
                notificationPreferences: { email: true, push: false }
            });
        };
    }, [updateNewAlert, currentUser]);

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
                    <div className="flex flex-col gap-[0.375rem]">
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
