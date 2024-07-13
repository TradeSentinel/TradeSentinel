import { useGeneralAppStore } from "../../utils/generalAppStore";

type setShowModalsType = React.Dispatch<React.SetStateAction<{
    pairModal: boolean;
    alertTypeModal: boolean;
    keyboardModal: boolean;
}>>


export default function AlertType({ setShowModals }: {
    setShowModals: setShowModalsType
}) {

    const alertInfo = useGeneralAppStore(state => state.newAlert)
    const updateNewAlert = useGeneralAppStore(state => state.updateNewAlert)
    
    const variousTypes = [
        'Price reaching',
        'Price rising above',
        'Price dropping below',
    ]

    function closeAllModals() {
        setShowModals({
            pairModal: false,
            alertTypeModal: false,
            keyboardModal: false
        })
    }

    function setType(type: string) {
        updateNewAlert({ ...alertInfo, alertType: type })
        closeAllModals()
    }

    return (
        <div className="flex flex-col w-full bg-[#FCFCFD] rounded-t-[1.25rem] max-w-[600px]">
            <div className=" w-full flex flex-col items-center py-8 px-5">
                <div className="w-full flex items-center flex-col border-b-[#EEF2F6] border-b-[1px]">
                    <h5 className="text-[#121926] py-3 font-medium text-[1.125rem]">Alert type</h5>
                </div>
                {variousTypes.map((type, index) => {
                    return (
                        <button
                            key={index}
                            onClick={() => setType(type)}
                            className="w-full flex items-center flex-col border-b-[#EEF2F6] border-b-[1px]"
                        >
                            <h5 className="text-[#697586] py-3 text-base">{type}</h5>

                        </button>
                    )
                })}
            </div>
            <div className="mt-8 pb-12 p-3 flex w-full border-t-[1.5px] border-[#CDD5DF]">
                <button
                    onClick={closeAllModals}
                    className="text-[#697586] py-[10px] px-[18px] flex items-center justify-center w-full"
                >
                    Cancel
                </button>
            </div>
        </div>
    )
}