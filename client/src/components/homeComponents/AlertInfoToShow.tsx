import { useGeneralAppStore } from "../../utils/generalAppStore"

export default function AlertInfoToShow() {
    const updateShowAlertInfo = useGeneralAppStore(state => state.updateShowAlertInfo)
    const currentAlert = useGeneralAppStore((state) => state.currentInfo)

    const statusColor = currentAlert?.status === 'Active' ? 'text-[#008D25]' : currentAlert?.status === 'Paused' ? 'text-[#F79009]' : 'text-[#AD183F]'

    return (
        <div className="flex flex-col w-full bg-[#FCFCFD] rounded-t-[1.25rem] max-w-[600px]">
            <div className=" w-full flex flex-col items-center py-8 px-5">
                <div className="w-full flex items-center flex-col border-b-[#EEF2F6] border-b-[1px]">
                    <h5 className="text-[#121926] font-medium text-[1.125rem]">Alert Details</h5>
                    <div className="w-full flex items-center my-4">
                        <div className="bg-[#111322] p-[2px] flex items-center rounded-full w-full flex-grow">
                            <button className="bg-white p-3 w-full rounded-full flex items-center justify-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="12" viewBox="0 0 14 12" fill="none">
                                    <path fillRule="evenodd" clipRule="evenodd" d="M2.6665 0.166687C1.56193 0.166687 0.666504 1.06212 0.666504 2.16669V9.83335C0.666504 10.9379 1.56193 11.8334 2.6665 11.8334H3.6665C4.77107 11.8334 5.6665 10.9379 5.6665 9.83335V2.16669C5.6665 1.06212 4.77107 0.166687 3.6665 0.166687H2.6665ZM10.9998 0.166687C9.89527 0.166687 8.99984 1.06212 8.99984 2.16669V9.83335C8.99984 10.9379 9.89527 11.8334 10.9998 11.8334H11.9998C13.1044 11.8334 13.9998 10.9379 13.9998 9.83335V2.16669C13.9998 1.06212 13.1044 0.166687 11.9998 0.166687H10.9998Z" fill="#28303F" />
                                </svg>
                                <p className="text-sm leading-5 text-[#202939]">Pause</p>
                            </button>
                        </div>
                        <div className="bg-[#111322] p-[2px] flex items-center w-3 h-5 mx-[-2px] curvedBox overflow-hidden">

                        </div>
                        <div className="bg-[#111322] p-[2px] flex items-center rounded-full w-full flex-grow">
                            <button className="bg-white p-3 w-full rounded-full flex items-center justify-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path fillRule="evenodd" clipRule="evenodd" d="M14.8196 1.18022C13.9126 0.273259 12.4421 0.273261 11.5352 1.18022L10.4526 2.26276L13.737 5.54716L14.8196 4.46461C15.7265 3.55765 15.7265 2.08718 14.8196 1.18022ZM12.6764 6.60782L9.39197 3.32342L1.98892 10.7265C1.5218 11.1936 1.20596 11.7904 1.08242 12.4394L0.774731 14.0557C0.642775 14.7489 1.25091 15.357 1.9441 15.2251L3.56044 14.9174C4.20939 14.7938 4.8062 14.478 5.27332 14.0109L12.6764 6.60782Z" fill="#202939" />
                                </svg>
                                <p className="text-sm leading-5 text-[#202939]">Edit</p>
                            </button>
                        </div>
                        <div className="bg-[#111322] p-[2px] flex items-center w-3 h-5 mx-[-2px] curvedBox overflow-hidden">

                        </div>
                        <div className="bg-[#111322] p-[2px] flex items-center rounded-full w-full flex-grow">
                            <button className="bg-white p-3 w-full rounded-full flex items-center justify-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="18" viewBox="0 0 14 18" fill="none">
                                    <path fillRule="evenodd" clipRule="evenodd" d="M5.00534 1.40885C5.31445 0.945189 5.83484 0.666687 6.3921 0.666687H7.94148C8.49874 0.666687 9.01912 0.945189 9.32823 1.40885L10.0835 2.54169H13.2085C13.5536 2.54169 13.8335 2.82151 13.8335 3.16669C13.8335 3.51187 13.5536 3.79169 13.2085 3.79169H1.12512C0.779944 3.79169 0.500122 3.51187 0.500122 3.16669C0.500122 2.82151 0.779944 2.54169 1.12512 2.54169H4.25012L5.00534 1.40885ZM9.66679 17.3334H4.66679C2.82584 17.3334 1.33346 15.841 1.33346 14V4.83335H13.0001V14C13.0001 15.841 11.5077 17.3334 9.66679 17.3334ZM5.50012 7.54169C5.8453 7.54169 6.12512 7.82151 6.12512 8.16669V14C6.12512 14.3452 5.8453 14.625 5.50012 14.625C5.15494 14.625 4.87512 14.3452 4.87512 14V8.16669C4.87512 7.82151 5.15494 7.54169 5.50012 7.54169ZM8.83346 7.54169C9.17863 7.54169 9.45846 7.82151 9.45846 8.16669V14C9.45846 14.3452 9.17863 14.625 8.83346 14.625C8.48828 14.625 8.20846 14.3452 8.20846 14V8.16669C8.20846 7.82151 8.48828 7.54169 8.83346 7.54169Z" fill="#AD183F" />
                                </svg>
                                <p className="text-sm leading-5 text-[#AD183F]">Delete</p>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="w-full flex items-center justify-between py-3 border-b-[#EEF2F6] border-b-[1px]">
                    <p className="text-[#9AA4B2]">Status</p>
                    <p className={`${statusColor}`}>{currentAlert?.status}</p>
                </div>
                <div className="w-full flex items-center justify-between py-3 border-b-[#EEF2F6] border-b-[1px]">
                    <p className="text-[#9AA4B2]">Type</p>
                    <p className="text-[#121926]">{currentAlert?.alertType}</p>
                </div>
                <div className="w-full flex items-center justify-between py-3 border-b-[#EEF2F6] border-b-[1px]">
                    <p className="text-[#9AA4B2]">Trigger price</p>
                    <p className="text-[#121926]">{currentAlert?.triggerPrice}</p>
                </div>
                <div className="w-full flex items-center justify-between py-3 border-b-[#EEF2F6] border-b-[1px]">
                    <p className="text-[#9AA4B2]">Notification</p>
                    <p className="text-[#121926]">{currentAlert?.notification}</p>
                </div>
            </div>
            <div className="mt-8 pb-12 p-3 flex w-full border-t-[1.5px] border-[#CDD5DF]">
                <button
                    onClick={() => updateShowAlertInfo(false)}
                    className="text-[#697586] py-[10px] px-[18px] flex items-center justify-center w-full"
                >
                    Cancel
                </button>
            </div>
        </div>
    )
}