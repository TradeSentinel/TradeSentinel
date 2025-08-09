import { useGeneralAppStore, generalAlertType } from "../../utils/generalAppStore"
import { Pause, Pencil, Trash, Play } from "../Icons"
import { useNavigate } from "react-router-dom"
import { db } from "../../utils/firebaseInit"
import { doc, deleteDoc, updateDoc } from "firebase/firestore"
import { toast } from "react-toastify"
import { useState } from "react"
import MiniLoader from "../MiniLoader"

// Figma-styled confirmation dialog for alert deletion (pixel-perfect)
const ConfirmationDialog: React.FC<{
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
}> = ({ message, onConfirm, onCancel, confirmText = "Yes, delete", cancelText = "Cancel" }) => {
    const labelId = "confirm-delete-title";
    const descId = "confirm-delete-desc";
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(18,25,38,0.10)] backdrop-blur-[4px]"
            onClick={onCancel}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={labelId}
                aria-describedby={descId}
                className="bg-[#FCFCFD] rounded-3xl w-full max-w-md flex flex-col gap-6 px-5 py-6"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex flex-col gap-3 items-center text-center text-[#202939]">
                    <h3
                        id={labelId}
                        className="font-['IBM_Plex_Sans:SemiBold',_sans-serif] text-[20px] leading-[30px]"
                    >
                        Confirm alert deletion
                    </h3>
                    <p
                        id={descId}
                        className="font-['IBM_Plex_Sans:Regular',_sans-serif] text-[14px] leading-[20px]"
                    >
                        {message}
                    </p>
                </div>
                <div className="flex flex-col gap-2 w-full">
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="px-[18px] py-2.5 rounded-[1000px] text-[16px] leading-[24px] font-['IBM_Plex_Sans:Medium',_sans-serif] text-[#AD183F]"
                        autoFocus
                    >
                        {confirmText}
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="relative rounded-[1000px] bg-[#7F56D9] text-white px-[18px] py-2.5 font-['IBM_Plex_Sans:Medium',_sans-serif] text-[16px] leading-[24px]"
                    >
                        {cancelText}
                        <span
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0 rounded-[1000px] border border-[#7F56D9] shadow-[0px_1px_2px_0px_rgba(105,117,134,0.05)]"
                        />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function AlertInfoToShow() {
    const navigateTo = useNavigate();
    const {
        updateShowAlertInfo,
        currentInfo: currentAlert,
        removeAlertFromLists,
        updateAlertInLists,
        currentUser
    } = useGeneralAppStore((state) => ({
        updateShowAlertInfo: state.updateShowAlertInfo,
        currentInfo: state.currentInfo,
        removeAlertFromLists: state.removeAlertFromLists,
        updateAlertInLists: state.updateAlertInLists,
        currentUser: state.currentUser
    }));

    const [isLoading, setIsLoading] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    const statusColor = currentAlert?.status === 'active' ? 'text-[#008D25]' : currentAlert?.status === 'paused' ? 'text-[#F79009]' : 'text-[#AD183F]';
    const isTerminalStatus = currentAlert?.status === "triggered" || currentAlert?.status === "cancelled";

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            updateShowAlertInfo(false);
        }, 300); // Match this timeout with the animation duration
    };

    const handleDelete = async () => {
        if (!currentAlert || !currentAlert.id || !currentUser) {
            toast.error("Alert information is missing.");
            return;
        }
        setShowConfirmDelete(false); // Close confirmation dialog
        setIsLoading(true);
        try {
            const alertDocRef = doc(db, "users", currentUser.uid, "alerts", currentAlert.id);
            await deleteDoc(alertDocRef);
            removeAlertFromLists(currentAlert.id);
            toast.success("Alert deleted successfully!");
            handleClose(); // Use handleClose instead of updateShowAlertInfo directly
        } catch (error) {
            console.error("Error deleting alert:", error);
            toast.error("Failed to delete alert. Please try again.");
        }
        setIsLoading(false);
    };

    const handleTogglePausePlay = async () => {
        if (!currentAlert || !currentAlert.id || !currentUser) {
            toast.error("Alert information is missing.");
            return;
        }
        setIsLoading(true);
        const newStatus = currentAlert.status === "active" ? "paused" : "active";
        try {
            const alertDocRef = doc(db, "users", currentUser.uid, "alerts", currentAlert.id);
            await updateDoc(alertDocRef, { status: newStatus });

            const updatedAlert = { ...currentAlert, status: newStatus };
            updateAlertInLists(updatedAlert as generalAlertType); // Ensure it's cast to generalAlertType

            toast.success(`Alert ${newStatus === "active" ? "resumed" : "paused"} successfully!`);
        } catch (error) {
            console.error("Error updating alert status:", error);
            toast.error("Failed to update alert status. Please try again.");
        }
        setIsLoading(false);
    };

    const handleEdit = () => {
        if (!currentAlert || !currentAlert.id) {
            toast.error("Alert information is missing for editing.");
            return;
        }
        // Set closing animation first, then navigate
        setIsClosing(true);
        setTimeout(() => {
            navigateTo(`/edit_alert/${currentAlert.id}`);
            updateShowAlertInfo(false);
        }, 300);
    };

    return (
        <>
            {isLoading && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                    <MiniLoader />
                </div>
            )}
            {showConfirmDelete && (
                <ConfirmationDialog
                    message="Are you sure you want to delete this alert?"
                    onConfirm={handleDelete}
                    onCancel={() => setShowConfirmDelete(false)}
                    confirmText="Yes, Delete"
                />
            )}
            <div className={`flex flex-col w-full bg-[#FCFCFD] rounded-t-[1.25rem] max-w-[600px] ${isClosing ? 'slide-down-animation' : 'slide-up-animation'}`}>
                <div className=" w-full flex flex-col items-center py-8 px-5">
                    <div className="w-full flex items-center flex-col border-b-[#EEF2F6] border-b-[1px]">
                        <h5 className="text-[#121926] font-medium text-[1.125rem]">Alert Details</h5>
                        <div className="w-full flex items-center my-4">
                            <div className="bg-[#111322] p-[2px] flex items-center rounded-full w-full flex-grow">
                                <button
                                    onClick={handleTogglePausePlay}
                                    disabled={isLoading || isTerminalStatus}
                                    className="bg-white p-3 w-full rounded-full flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {currentAlert?.status === "active" ? <Pause /> : <Play />}
                                    <p className="text-sm leading-5 text-[#202939]">
                                        {currentAlert?.status === "active" ? "Pause" :
                                            currentAlert?.status === "paused" ? "Play" :
                                                (currentAlert?.status ? currentAlert.status.charAt(0).toUpperCase() + currentAlert.status.slice(1) : "N/A")}
                                    </p>
                                </button>
                            </div>
                            <div className="bg-[#111322] p-[2px] flex items-center w-3 h-5 mx-[-2px] curvedBox overflow-hidden">

                            </div>
                            <div className="bg-[#111322] p-[2px] flex items-center rounded-full w-full flex-grow">
                                <button
                                    onClick={handleEdit}
                                    disabled={isLoading}
                                    className="bg-white p-3 w-full rounded-full flex items-center justify-center gap-1 disabled:opacity-50"
                                >
                                    <Pencil />
                                    <p className="text-sm leading-5 text-[#202939]">Edit</p>
                                </button>
                            </div>
                            <div className="bg-[#111322] p-[2px] flex items-center w-3 h-5 mx-[-2px] curvedBox overflow-hidden">

                            </div>
                            <div className="bg-[#111322] p-[2px] flex items-center rounded-full w-full flex-grow">
                                <button
                                    onClick={() => setShowConfirmDelete(true)}
                                    disabled={isLoading}
                                    className="bg-white p-3 w-full rounded-full flex items-center justify-center gap-1 disabled:opacity-50"
                                >
                                    <Trash />
                                    <p className="text-sm leading-5 text-[#AD183F]">Delete</p>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="w-full flex items-center justify-between py-3 border-b-[#EEF2F6] border-b-[1px]">
                        <p className="text-[#9AA4B2]">Status</p>
                        <p className={`${statusColor} capitalize`}>{currentAlert?.status}</p>
                    </div>
                    <div className="w-full flex items-center justify-between py-3 border-b-[#EEF2F6] border-b-[1px]">
                        <p className="text-[#9AA4B2]">Pair</p>
                        <p className="text-[#121926]">{currentAlert?.currencyPair}</p>
                    </div>
                    <div className="w-full flex items-center justify-between py-3 border-b-[#EEF2F6] border-b-[1px]">
                        <p className="text-[#9AA4B2]">Type</p>
                        <p className="text-[#121926]">{currentAlert?.alertType}</p>
                    </div>
                    <div className="w-full flex items-center justify-between py-3 border-b-[#EEF2F6] border-b-[1px]">
                        <p className="text-[#9AA4B2]">Trigger price</p>
                        <p className="text-[#121926]">{currentAlert?.triggerPrice}</p>
                    </div>
                    {currentAlert?.createdAt && (
                        <div className="w-full flex items-center justify-between py-3 border-b-[#EEF2F6] border-b-[1px]">
                            <p className="text-[#9AA4B2]">Created At</p>
                            <p className="text-[#121926]">
                                {new Date(currentAlert.createdAt.seconds * 1000).toLocaleDateString()} {new Date(currentAlert.createdAt.seconds * 1000).toLocaleTimeString()}
                            </p>
                        </div>
                    )}
                    <div className="w-full flex items-center justify-between py-3 border-b-[#EEF2F6] border-b-[1px]">
                        <p className="text-[#9AA4B2]">Notification</p>
                        <div className="text-[#121926] flex flex-col items-end">
                            {currentAlert?.notificationPreferences?.email && <p>Email</p>}
                            {currentAlert?.notificationPreferences?.push && <p>Push</p>}
                            {!currentAlert?.notificationPreferences?.email && !currentAlert?.notificationPreferences?.push && <p>None</p>}
                        </div>
                    </div>
                </div>
                <div className="mt-8 pb-12 p-3 flex w-full border-t-[1.5px] border-[#CDD5DF]">
                    <button
                        onClick={handleClose}
                        className="text-[#697586] py-[10px] px-[18px] flex items-center justify-center w-full"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </>
    )
}