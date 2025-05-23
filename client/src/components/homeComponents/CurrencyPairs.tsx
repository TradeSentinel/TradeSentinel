import { useGeneralAppStore } from "../../utils/generalAppStore";
import { useState, useEffect } from "react";

type setShowModalsType = React.Dispatch<React.SetStateAction<{
    pairModal: boolean;
    alertTypeModal: boolean;
    keyboardModal: boolean;
}>>

export default function CurrencyPairs({ setShowModals }: {
    setShowModals: setShowModalsType
}) {
    const alertInfo = useGeneralAppStore(state => state.newAlert);
    const updateNewAlert = useGeneralAppStore(state => state.updateNewAlert);
    const [isClosing, setIsClosing] = useState(false);

    const pairs = [
        'EUR/USD',
        'USD/JPY',
        'GBP/USD',
        'USD/CHF',
        'AUD/USD',
        'USD/CAD',
        'NZD/USD',
        'EUR/GBP'
    ];

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setShowModals({
                pairModal: false,
                alertTypeModal: false,
                keyboardModal: false
            });
        }, 300);
    };

    useEffect(() => {
        setIsClosing(false);
    }, []);

    useEffect(() => {
        const backdropClickHandler = (event: MouseEvent) => {
            if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
                handleClose();
            }
        };
        document.addEventListener('click', backdropClickHandler);
        return () => {
            document.removeEventListener('click', backdropClickHandler);
        };
    }, []);

    function setPair(pair: string) {
        updateNewAlert({ ...alertInfo, currencyPair: pair });
        handleClose();
    }

    return (
        <div className="fixed inset-0 modal-backdrop bg-black bg-opacity-50 flex items-end justify-center z-40">
            <div className={`flex flex-col w-full bg-[#FCFCFD] rounded-t-[1.25rem] max-w-[600px] pb-4 ${isClosing ? 'slide-down-animation' : 'slide-up-animation'} shadow-2xl`}>
                <div className="w-full flex flex-col items-center py-8 px-5">
                    <div className="w-full flex items-center flex-col border-b-[#EEF2F6] border-b-[1px]">
                        <h5 className="text-[#121926] py-3 font-medium text-[1.125rem]">Currency Pair</h5>
                    </div>
                    {pairs.map((pair, index) => (
                        <button
                            key={index}
                            onClick={() => setPair(pair)}
                            className="w-full flex items-center flex-col border-b-[#EEF2F6] border-b-[1px] hover:bg-gray-50 transition-colors"
                        >
                            <h5 className="text-[#697586] py-3 text-base">{pair}</h5>
                        </button>
                    ))}
                </div>
                <div className="pb-8 pt-3 p-3 flex w-full border-t-[1.5px] border-[#CDD5DF]">
                    <button
                        onClick={handleClose}
                        className="text-[#697586] py-[10px] px-[18px] flex items-center justify-center w-full rounded-full hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}