import { useNavigate } from "react-router-dom"
import { useGeneralAppStore } from "../../utils/generalAppStore"


export default function TopPairs() {

    const topPairs = [
        { name: "GBP/USD", price: '1.1103' },
        { name: "EUR/USD", price: '1.1103' },
        { name: "AUD/USD", price: '1.1103' },
        { name: "USD/CHF", price: '1.1103' }
    ]

    const alertInfo = useGeneralAppStore(state => state.newAlert)
    const updateNewAlert = useGeneralAppStore(state => state.updateNewAlert)
    const navigateTo = useNavigate()

    return (
        <div className="mt-10">
            <h4 className="font-semibold text-[#101828] leading-6">Top Currency Pairs</h4>
            <div className="mt-3 grid grid-cols-2 gap-3">
                {topPairs.map((pair, index) => {
                    return (
                        <div
                            key={index}
                            onClick={() => {
                                updateNewAlert({ ...alertInfo, currencyPair: pair.name })
                                navigateTo('/create_alert')
                            }}
                            className="bg-white p-[6px] rounded-xl flex items-center gap-[6px]"
                        >
                            <div className="p-[0.625rem] bg-[#F8FAFC] rounded-md">
                                <img src="/pairs.svg" />
                            </div>
                            <div className="flex flex-col items-start gap-[6px]">
                                <p className="text-[#121926] text-xs font-semibold">{pair.name}</p>
                                <p className="text-[#121926] text-xs">{pair.price}</p>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}