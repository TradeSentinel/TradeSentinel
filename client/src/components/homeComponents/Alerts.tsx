import { useState } from "react"
import ActiveAlerts from "./ActiveAlerts"

export default function Alerts() {
    const [activeSection, setActiveSession] = useState('active')

    return (
        <>
            <div className="flex items-center">
                <button
                    onClick={() => setActiveSession('active')}
                    className={`w-full text-center text-sm text-[#121926] font-medium p-2 border-b-[1.2px] ${activeSection === 'active' ? 'border-b-[#121926]' : 'border-b-[#E3E8EF]'}`}
                >
                    ACTIVE
                </button>
                <button
                    onClick={() => setActiveSession('previous')}
                    className={`w-full text-center text-sm text-[#121926] font-medium p-2 border-b-[1.2px] ${activeSection === 'previous' ? 'border-b-[#121926]' : 'border-b-[#E3E8EF]'}`}
                >
                    PREVIOUS
                </button>
            </div>
            <div>
                {activeSection === 'active' && <ActiveAlerts />}
            </div>
        </>
    )
}
