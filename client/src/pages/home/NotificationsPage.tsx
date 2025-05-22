import React from 'react';
import PageHeader from '../../components/homeComponents/PageHeader';
import { requestNotificationPermission } from "../../utils/requestPermission";
import { useNavigate } from 'react-router-dom';

const NotificationsPage: React.FC = () => {

    const navigateTo = useNavigate();
    const goBack = () => navigateTo(-1);

    return (
        <div className="overflow-scroll dynamicHeight flex flex-col justify-between flex-grow p-[1.25rem] pb-12 w-full">
            <PageHeader name="Notifications" />
            <div className="flex-grow mt-8 flex flex-col items-center">
                <div className="flex-1"></div>
                <div className="flex-1 verified_background">
                    <div className='flex items-center justify-center'>
                        <img src="/bell.svg" alt="Notification bell" />
                    </div>
                    <h2 className='text-[1.5rem] mt-12 text-center font-semibold leading-8 text-[#202939]'>
                        Setup Push Notifications
                    </h2>
                    <p className="text-sm mt-4 text-[#202939] text-center mt-">To get Push Notifications, you need to give permission to receive them.</p>
                </div>
                {/* Bottom action buttons area */}

                <div className="mt-auto w-full flex-1 flex flex-col justify-end items-center gap-3 max-w-xs mx-auto">
                    <button
                        onClick={goBack}
                        className="text-[#697586] font-medium leading-6 w-full py-3"
                    >
                        No, thanks
                    </button>
                    <button
                        onClick={requestNotificationPermission}
                        className="w-full py-[0.625rem] font-medium px-[1.125rem] text-white rounded-full bg-[#7F56D9] flex items-center justify-center"
                    >
                        Enable Push Notifications
                    </button>
                </div>
            </div>

        </div>
    );
};

export default NotificationsPage; 