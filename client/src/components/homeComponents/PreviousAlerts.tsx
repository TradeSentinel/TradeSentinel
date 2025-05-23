import { useGeneralAppStore, generalAlertType } from "../../utils/generalAppStore";
import { LuDot } from "react-icons/lu";
import { formatFirestoreTimestamp } from "../../utils/formatDate";
import EmptyPreviousAlerts from "./EmptyPreviousAlerts";

export default function PreviousAlerts() {
    const previousAlerts = useGeneralAppStore(state => state.alerts.previous);
    const updateShowAlertInfo = useGeneralAppStore(state => state.updateShowAlertInfo);
    const updateCurrentInfo = useGeneralAppStore(state => state.updateCurrentInfo);

    function handleShowAlertInfo(info: generalAlertType) {
        updateCurrentInfo(info);
        updateShowAlertInfo(true);
    }

    if (previousAlerts.length === 0) {
        return <EmptyPreviousAlerts />;
    }

    return (
        <div className="mt-3 flex flex-col">
            {previousAlerts.map((alert, index) => {
                const isLastNumber = index === previousAlerts.length - 1;
                return (
                    <div
                        onClick={() => handleShowAlertInfo(alert)}
                        key={alert.id || index} // Prefer Firestore ID if available
                        className={`${isLastNumber ? '' : 'border-b-[1px] border-b-[#E3E8EF]'} flex flex-col w-full py-2 cursor-pointer hover:bg-gray-50 transition-colors`}
                    >
                        <div className="flex items-center gap-1 text-[#121926] text-sm leading-5">
                            <p>{alert.currencyPair}</p>
                            <i className="mx-[-4px]"><LuDot /></i>
                            <p>{alert.alertType}</p>
                            <p>{alert.triggerPrice}</p>
                        </div>
                        <div className="flex justify-between items-center">
                            <p className="text-xs text-[#697586]">{formatFirestoreTimestamp(alert.createdAt)}</p>
                            <span
                                className={`text-xs px-2 py-0.5 rounded-full ${alert.status === 'triggered' ? 'bg-green-100 text-green-700' :
                                    alert.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                        alert.status === 'paused' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}
                                `}
                            >
                                {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
