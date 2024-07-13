import { useGeneralAppStore } from "../../utils/generalAppStore"
import { generalAlertType } from "../../utils/generalAppStore"
import { LuDot } from "react-icons/lu";

export default function ActiveAlerts() {
    const alerts = useGeneralAppStore(state => state.alerts.active)
    const updateShowAlertInfo = useGeneralAppStore(state => state.updateShowAlertInfo)
    const updateCurrentInfo = useGeneralAppStore(state => state.updateCurrentInfo)

    function showAlertInfo(info: generalAlertType) {
        updateCurrentInfo(info)
        updateShowAlertInfo(true)
    }

    return (
        <div className="mt-3 flex flex-col">
            {alerts.map((alert, index) => {
                const alertNumber = index + 1
                const isLastNumber = alertNumber === alerts.length ? true : false

                return (
                    <div
                        onClick={() => showAlertInfo(alert)}
                        key={index}
                        className={`${isLastNumber ? '' : 'border-b-[1px] border-b-[#E3E8EF]'} flex flex-col w-full py-2`}
                    >
                        <div className="flex items-center gap-1 text-[#121926] text-sm leading-5">
                            <p>{alert.currencyPair}</p>
                            <i className="mx-[-4px]"><LuDot /></i>
                            <p>{alert.alertType}</p>
                            <p>{alert.triggerPrice}</p>
                        </div>
                        <p className="text-xs text-[#697586]">Jan 29 at 14:57</p>
                    </div>
                )
            })}
        </div>
    )
}
