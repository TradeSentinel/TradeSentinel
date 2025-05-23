import { Clock } from "../Icons"; // Assuming Clock icon is suitable

export default function EmptyPreviousAlerts() {
    return (
        <div className="bg-white rounded-xl w-full flex flex-col items-center justify-center p-6 mt-3 shadow-sm">
            <Clock /> {/* Or another relevant icon, e.g., a history/archive icon */}
            <p className="mt-4 text-center text-sm text-gray-600 max-w-[250px]">
                You have no previous alerts yet.
                Once alerts are triggered or cancelled, they will appear here.
            </p>
        </div>
    );
} 