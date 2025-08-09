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
    const [searchTerm, setSearchTerm] = useState("");

    const pairs = [
        // Fiat majors
        'EUR/USD',
        'USD/JPY',
        'GBP/USD',
        'USD/CHF',
        'AUD/USD',
        'USD/CAD',
        'NZD/USD',
        'EUR/GBP',
        // Crypto
        'BTC/USD',
        'ETH/USD',
        'LTC/USD'
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
            <div className={`flex flex-col w-full bg-[#FCFCFD] rounded-t-[1.25rem] max-w-[600px] max-h-[min(720px,calc(100vh-64px))] ${isClosing ? 'slide-down-animation' : 'slide-up-animation'} shadow-2xl`}>
                <div className="w-full px-5 pt-8">
                    <div className="w-full flex items-center flex-col border-b-[#EEF2F6]">
                        <h5 className="text-[#121926] py-3 font-medium text-[1.125rem]">Currency Pair</h5>
                    </div>
                    <div className="mt-3 mb-4">
                        <div className="relative">
                            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[#9AA4B2]">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M2.29175 9.58342C2.29175 13.6105 5.55634 16.8751 9.58342 16.8751C13.6105 16.8751 16.8751 13.6105 16.8751 9.58342C16.8751 5.55634 13.6105 2.29175 9.58342 2.29175C5.55634 2.29175 2.29175 5.55634 2.29175 9.58342ZM9.58342 18.1251C4.86598 18.1251 1.04175 14.3008 1.04175 9.58342C1.04175 4.86598 4.86598 1.04175 9.58342 1.04175C14.3008 1.04175 18.1251 4.86598 18.1251 9.58342C18.1251 11.7172 17.3427 13.6682 16.0491 15.1653L18.7754 17.8915C19.0194 18.1356 19.0194 18.5313 18.7754 18.7754C18.5313 19.0194 18.1356 19.0194 17.8915 18.7754L15.1653 16.0491C13.6682 17.3427 11.7172 18.1251 9.58342 18.1251Z" fill="#697586" />
                                </svg>
                            </span>
                            <input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search for a pair"
                                className="w-full bg-[#F8FAFC] text-[#121926] pl-10 pr-10 py-[10px] rounded-xl outline-none border-[0.5px] border-[#E3E8EF] focus:ring-2 focus:ring-[#7F56D9] focus:border-transparent"
                                type="text"
                                autoFocus
                                aria-label="Search currency pairs"
                            />
                            {searchTerm !== "" && (
                                <button
                                    type="button"
                                    onClick={() => setSearchTerm("")}
                                    className="absolute inset-y-0 right-3 flex items-center text-[#9AA4B2] hover:text-[#364152]"
                                    aria-label="Clear search"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                        <path d="M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        <path d="M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                <div className="w-full flex-1 overflow-y-auto px-5">
                    {(pairs.filter(p => p.toLowerCase().includes(searchTerm.toLowerCase()))).map((pair, index) => (
                        <button
                            key={index}
                            onClick={() => setPair(pair)}
                            className="w-full flex items-center flex-col border-b-[#EEF2F6] border-b-[1px] hover:bg-gray-50 transition-colors"
                        >
                            <h5 className="text-[#697586] py-3 text-base">{pair}</h5>
                        </button>
                    ))}
                    {pairs.filter(p => p.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                        <p className="text-center text-sm text-[#697586] py-6">No matching pairs</p>
                    )}
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