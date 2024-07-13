import { Link } from "react-router-dom";

export default function AlertAddedSuccessfully() {
    return (
        <div className="flex flex-col items-center justify-between flex-grow p-[1.25rem] pb-12">
            <div className=""></div>
            <div className="verified_background">
                <div className='flex items-center justify-center'>
                    <img src="/successful_alert.svg" />
                </div>
                <h2 className='text-[1.5rem] mt-12 text-center font-semibold leading-8 text-[#202939]'>
                    Alert added successfully
                </h2>
                <p className="text-sm mt-4 text-[#202939] text-center mt-">Your trigger criteria will now be monitored to inform you as soon as it is met.</p>
            </div>
            <div className="flex flex-col gap-1 w-full">
                <Link to='/create_alert'>
                    <button className="text-[#697586] font-medium leading-6 w-full py-3">Add new alert</button>
                </Link>
                <Link to='/dashboard' className="w-full flex-1 flex flex-col justify-end">
                    <button className="w-full py-[0.625rem] px-[1.125rem] font-medium text-white rounded-full bg-[#7F56D9]">
                        Continue
                    </button>
                </Link>
            </div>
        </div>
    )
}

