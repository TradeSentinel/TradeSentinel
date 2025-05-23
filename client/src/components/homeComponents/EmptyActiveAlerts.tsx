import { Clock } from "../Icons"; // Assuming Clock icon is in Icons.tsx

export default function EmptyActiveAlerts() {
    return (
        <div className="bg-white rounded-xl w-full flex flex-col items-center justify-center p-6 mt-3 shadow-sm">
            <Clock /> {/* Or another relevant icon */}
            <p className="mt-4 text-center text-sm text-gray-600 max-w-[250px]">
                You have no active alerts right now.
                Tap the <span className="text-[#9E77ED] font-semibold">+</span> sign to create one and start monitoring!
            </p>
        </div>
    );
} 