import { useGeneralAppStore } from "../../utils/generalAppStore"
import { generalAlertType } from "../../utils/generalAppStore"
import { LuDot } from "react-icons/lu";
import { formatFirestoreTimestamp } from "../../utils/formatDate";

export default function ActiveAlerts() {
    const alerts = useGeneralAppStore(state => state.alerts.active)
    const updateShowAlertInfo = useGeneralAppStore(state => state.updateShowAlertInfo)
    const updateCurrentInfo = useGeneralAppStore(state => state.updateCurrentInfo)

    function showAlertInfo(info: generalAlertType) {
        updateCurrentInfo(info)
        updateShowAlertInfo(true)
    }

    if (alerts.length === 0) {
        return (
            <div className="mt-6 text-center text-sm text-gray-500">
                No active alerts found.
            </div>
        );
    }

    return (
        <div className="mt-3 flex flex-col">
            {alerts.map((alert, index) => {
                const isLastNumber = index === alerts.length - 1;

                return (
                    <div
                        onClick={() => showAlertInfo(alert)}
                        key={alert.id || index}
                        className={`${isLastNumber ? '' : 'border-b-[1px] border-b-[#E3E8EF]'} flex flex-col w-full py-2 cursor-pointer hover:bg-gray-50 transition-colors`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-[#121926] text-sm leading-5">
                                <p>{alert.currencyPair}</p>
                                <i className="mx-[-4px]"><LuDot /></i>
                                <p>{alert.alertType}</p>
                                <p>{alert.triggerPrice}</p>
                            </div>
                            {alert.status === 'paused' && (
                                <span
                                    className={`text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700`}
                                >
                                    Paused
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-[#697586]">{formatFirestoreTimestamp(alert.createdAt)}</p>
                    </div>
                )
            })}
        </div>
    )
}
