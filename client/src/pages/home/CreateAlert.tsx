import { useState } from "react";
import PageHeader from "../../components/homeComponents/PageHeader";
import MiniLoader from "../../components/MiniLoader";
import CurrencyPairs from "../../components/homeComponents/CurrencyPairs";
import AlertType from "../../components/homeComponents/AlertType";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from "react-router-dom";
import { useGeneralAppStore } from "../../utils/generalAppStore";

export default function CreateAlert() {

    const navigateTo = useNavigate()
    const [loading, setLoading] = useState(false)
    const [notificationType, setNotificationType] = useState({
        emailNotification: true,
        pushNotification: false
    })

    type modalType = "pairModal" | "alertTypeModal" | "keyboardModal"

    const [showModals, setShowModals] = useState({
        pairModal: false,
        alertTypeModal: false,
        keyboardModal: false
    })

    const alertInfo = useGeneralAppStore(state => state.newAlert)
    const updateNewAlert = useGeneralAppStore(state => state.updateNewAlert)

    const { currencyPair, alertType, triggerPrice } = alertInfo
    const { emailNotification, pushNotification } = notificationType
    const { pairModal, alertTypeModal } = showModals

    const updateShowModals = (name: modalType, value: boolean) => {
        setShowModals(prevModals => ({
            ...prevModals,
            [name]: value
        }))
    }

    async function createNewAlert() {
        if (alertType === '' || currencyPair === '' || triggerPrice === '') {
            toast('Fill all fields', {
                position: "top-right",
                autoClose: 2000,
                theme: "light",
                type: "error"
            })
        } else if (!emailNotification && !pushNotification) {
            toast('Choose a notification type', {
                position: "top-right",
                autoClose: 3000,
                theme: "light",
                type: "error"
            })
        } else {
            setLoading(true)

            setTimeout(() => {
                setLoading(false)
                updateNewAlert({ currencyPair: "", alertType: "", triggerPrice: "", status: "", notification: "" })
                navigateTo("/alert_added_successfully")
            }, 3000)
        }
    }

    return (
        <>
            <ToastContainer />
            <div className={`overflow-scroll dynamicHeight flex flex-col flex-grow p-[1.25rem] pb-12 w-full ${pairModal === true || alertTypeModal === true ? 'blur-sm' : ''}`}>
                <PageHeader name="Create Alert" />
                <section className="flex flex-col gap-3 mt-5">
                    <h3 className="text-[1.25rem] font-semibold text-[#202939] leading-8">Customize your alert</h3>
                    <p
                        className="text-sm text-[#202939] leading-5"
                    >
                        Enter the currency pair you want to watch and select alert trigger criteria.
                    </p>
                </section>
                <section className="mt-8 flex flex-col gap-4 flex-grow overflow-scroll scrollbarHidden">
                    <div className="flex flex-col gap-[0.375rem]">
                        <p className="text-sm text-[#202939] font-medium">Currency pair</p>
                        <div
                            onClick={() => updateShowModals("pairModal", !pairModal)}
                            className="py-[0.625rem] px-[0.875rem] bg-white rounded-xl flex items-center justify-between"
                        >
                            <p
                                className={`text-base ${currencyPair === '' ? 'text-[#697586]' : 'text-[#121926]'}`}
                            >
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
                            className="py-[0.625rem] px-[0.875rem] bg-white rounded-xl flex items-center justify-between"
                        >
                            <p
                                className={`text-base ${alertType === '' ? 'text-[#697586]' : 'text-[#121926]'}`}
                            >
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
                                onChange={(e) => updateNewAlert({ ...alertInfo, triggerPrice: e.target.value })}
                                // onFocus={(e) => {
                                //     e.target.blur()
                                //     updateShowModals("keyboardModal", !keyboardModal)
                                // }}
                                // onBlur={() => {
                                //     updateShowModals("keyboardModal", !keyboardModal)
                                // }}
                                className="w-full outline-none placeholder:text-[#697586] text-[#121926]"
                                placeholder="Enter a value"
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-[0.375rem]">
                        <h4 className="text-[#364152] font-medium text-sm leading-5">Notification type</h4>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setNotificationType(prevType => ({ ...prevType, emailNotification: !prevType.emailNotification }))}
                                className="flex items-center mt-[2px] justify-center border-[1px] border-[#7F56D9] h-[16px] w-[16px] p-[2px] rounded-[0.25rem]"
                            >
                                {
                                    emailNotification &&
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
                        <div className="flex gap-2">
                            <button
                                onClick={() => setNotificationType(prevType => ({ ...prevType, pushNotification: !prevType.pushNotification }))}
                                className="flex items-center mt-[2px] justify-center border-[1px] border-[#7F56D9] h-[16px] w-[16px] p-[2px] rounded-[0.25rem]"
                            >
                                {
                                    pushNotification &&
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
                        onClick={createNewAlert}
                        className="text-white w-full flex items-center justify-center py-[10px] px-[18px] rounded-full bg-[#7F56D9]"
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
