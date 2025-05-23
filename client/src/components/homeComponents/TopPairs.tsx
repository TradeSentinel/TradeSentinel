import { useNavigate } from "react-router-dom";
import { useGeneralAppStore } from "../../utils/generalAppStore";

// initialTopPairs is now primarily for mapping display names if needed, actual data comes from store
const initialTopPairs = [
    { name: 'EUR/USD', defaultPrice: '-' },
    { name: 'GBP/USD', defaultPrice: '-' },
    { name: 'AUD/USD', defaultPrice: '-' },
    { name: 'USD/CHF', defaultPrice: '-' },
];

export default function TopPairs() {
    const navigateTo = useNavigate();
    const alertInfo = useGeneralAppStore(state => state.newAlert);
    const updateNewAlert = useGeneralAppStore(state => state.updateNewAlert);
    const topPairsLivePrices = useGeneralAppStore(state => state.topPairsLivePrices);
    // Removed initTopPairsWebSocket call from here, will be in App.tsx

    // No local WebSocket logic needed here anymore

    return (
        <div className="mt-10">
            {/* Removed WebSocket status badge from here */}
            <h4 className="font-semibold text-[#101828] leading-6">Top Currency Pairs</h4>
            <div className="mt-3 grid grid-cols-2 gap-3">
                {initialTopPairs.map((pair, index) => {
                    const liveData = topPairsLivePrices[pair.name];
                    // Use live ask price if available and valid, else the default/placeholder
                    const displayPrice = liveData?.ask && liveData.ask !== 'Loading...' && liveData.ask !== 'N/A' && liveData.ask !== 'Error' && liveData.ask !== 'Offline'
                        ? liveData.ask
                        : (liveData?.ask || pair.defaultPrice); // Show loading/error states if present in liveData

                    // Original price color logic (no dynamic green color)
                    const priceColor = 'text-[#121926]';

                    return (
                        <div
                            key={index}
                            onClick={() => {
                                // Use live ask price for trigger price if available and valid
                                const triggerPrice = liveData?.ask && liveData.ask !== 'Loading...' && liveData.ask !== 'N/A' && liveData.ask !== 'Error' && liveData.ask !== 'Offline'
                                    ? liveData.ask
                                    : '';
                                updateNewAlert({ ...alertInfo, currencyPair: pair.name, triggerPrice });
                                navigateTo('/create_alert');
                            }}
                            className="bg-white p-[6px] rounded-xl flex items-center gap-[6px] cursor-pointer hover:shadow-md transition-shadow"
                        >
                            <div className="p-[0.625rem] bg-[#F8FAFC] rounded-md">
                                <img
                                    src={`/${pair.name.toLowerCase().replace('/', '-')}.svg`}
                                    alt={`${pair.name} icon`}
                                    onError={(e) => {
                                        // Fallback to a generic icon or hide if specific icon not found
                                        (e.target as HTMLImageElement).onerror = null;
                                        (e.target as HTMLImageElement).src = '/pairs.svg'; // Default/fallback icon
                                    }}
                                    className="h-6 w-6" // Added a default size, adjust as needed
                                />
                            </div>
                            <div className="flex flex-col items-start gap-[6px]">
                                <p className="text-[#121926] text-xs font-semibold">{pair.name}</p>
                                <p className={`text-xs ${priceColor}`}>
                                    {displayPrice}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}