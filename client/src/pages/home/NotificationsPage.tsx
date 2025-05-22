import React from 'react';
import PageHeader from '../../components/homeComponents/PageHeader';
import { requestNotificationPermission } from "../../utils/requestPermission";

const NotificationsPage: React.FC = () => {
    return (
        <div className="overflow-scroll dynamicHeight flex flex-col flex-grow p-[1.25rem] pb-12 w-full">
            <PageHeader name="Notifications" />
            <div className="flex-grow mt-8">
                {/* Notification Settings Section will be moved here */}
                <div className="bg-white mt-8 p-3 flex flex-col gap-[6px] rounded-3xl">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-full bg-[#F8FAFC]">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                        </div>
                        <div className="flex flex-grow items-center justify-between py-4">
                            <p className="text-xs font-semibold text-[#121926]">Notification Settings</p>
                            {/* <Caret /> */}
                        </div>
                    </div>
                    <button
                        onClick={requestNotificationPermission}
                        className="w-full mt-2 bg-[#7F56D9] hover:bg-[#6941C6] text-white font-medium py-2 px-4 rounded-lg text-sm"
                    >
                        Enable Push Notifications
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotificationsPage; 