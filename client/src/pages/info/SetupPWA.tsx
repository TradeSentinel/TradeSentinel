import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/homeComponents/PageHeader'; // Assuming PageHeader can be reused

const SetupPWA: React.FC = () => {
    const navigateTo = useNavigate();

    return (
        <div className="flex flex-col flex-grow p-[1.25rem] pb-12 overflow-scroll">
            <PageHeader name="Add to Home Screen" goBackPage="/dashboard" />
            <div className="mt-8 flex-grow flex flex-col items-center justify-center">
                <h2 className='text-[1.5rem] font-semibold leading-8 text-[#202939] text-center'>
                    Install Trade Sentinel
                </h2>
                <p className="text-sm mt-4 text-[#202939] text-center max-w-xs">
                    Placeholder for instructions on how to add the PWA to the home screen for various devices (iOS, Android, Desktop).
                </p>
                <p className="text-sm mt-4 text-[#202939] text-center max-w-xs">
                    This page will guide users through the process.
                </p>
                <button
                    onClick={() => navigateTo("/dashboard")}
                    className="mt-8 w-full max-w-xs py-[0.625rem] font-medium px-[1.125rem] text-white rounded-full bg-[#7F56D9] flex items-center justify-center"
                >
                    Back to Dashboard
                </button>
            </div>
        </div>
    );
};

export default SetupPWA; 