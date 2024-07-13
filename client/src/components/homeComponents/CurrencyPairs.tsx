import { useGeneralAppStore } from "../../utils/generalAppStore";

type setShowModalsType = React.Dispatch<React.SetStateAction<{
    pairModal: boolean;
    alertTypeModal: boolean;
    keyboardModal: boolean;
}>>


export default function CurrencyPairs({ setShowModals }: {
    setShowModals: setShowModalsType
}) {

    const alertInfo = useGeneralAppStore(state => state.newAlert)
    const updateNewAlert = useGeneralAppStore(state => state.updateNewAlert)
    const pairs = [
        'EUR/USD',
        'USD/JPY',
        'GBP/USD',
        'USD/CHF',
        'AUD/USD',
        'USD/CAD',
        'NZD/USD',
        'EUR/GBP'
    ]

    function closeAllModals() {
        setShowModals({
            pairModal: false,
            alertTypeModal: false,
            keyboardModal: false
        })
    }

    function setPair(pair: string) {
        updateNewAlert({ ...alertInfo, currencyPair: pair })
        closeAllModals()
    }

    return (
        <div className="flex flex-col w-full bg-[#FCFCFD] rounded-t-[1.25rem] max-w-[600px]">
            <div className=" w-full flex flex-col items-center py-8 px-5">
                <div className="w-full flex items-center flex-col border-b-[#EEF2F6] border-b-[1px]">
                    <h5 className="text-[#121926] py-3 font-medium text-[1.125rem]">Currency Pair</h5>
                </div>
                {pairs.map((pair, index) => {
                    return (
                        <button
                            key={index}
                            onClick={() => setPair(pair)}
                            className="w-full flex items-center flex-col border-b-[#EEF2F6] border-b-[1px]"
                        >
                            <h5 className="text-[#697586] py-3 text-base">{pair}</h5>

                        </button>
                    )
                })}
            </div>
            <div className="mt-8 pb-12 p-3 flex w-full border-t-[1.5px] border-[#CDD5DF]">
                <button
                    onClick={closeAllModals}
                    className="text-[#697586] py-[10px] px-[18px] flex items-center justify-center w-full"
                >
                    Cancel
                </button>
            </div>
        </div>
    )
}