import { FaChevronRight } from "react-icons/fa6";
// import { useState } from "react";
import HomeBottomNavbar from "../../components/homeComponents/HomeBottomNavbar";
import { useGeneralAppStore } from "../../utils/generalAppStore";
import { useEffect } from "react";
import Alerts from "../../components/homeComponents/Alerts";
import AlertInfoToShow from "../../components/homeComponents/AlertInfoToShow";
import TopPairs from "../../components/homeComponents/TopPairs";
import { useLocation } from "react-router-dom";
// Component to show design for when a user does not have any alert on active and previous
export function CreateFirstAlert() {
    return (
        <div className="bg-white rounded-xl w-full flex flex-col items-center justify-center p-[0.625rem]">
            <svg xmlns="http://www.w3.org/2000/svg" width="181" height="145" viewBox="0 0 181 145" fill="none">
                <path fillRule="evenodd" clipRule="evenodd" d="M139.251 4.20569C142.599 2.27269 146.88 3.41982 148.813 6.76787C150.746 10.1159 149.599 14.397 146.251 16.33L111.61 36.33C114.958 34.397 119.239 35.5442 121.172 38.8922C123.105 42.2403 121.958 46.5214 118.61 48.4544L137.662 37.4544C141.01 35.5214 145.292 36.6685 147.225 40.0166C149.158 43.3646 148.01 47.6458 144.662 49.5788L135.851 54.6657C131.63 57.103 129.775 61.7929 131.708 65.1409C132.997 67.373 135.895 68.3937 140.404 68.2031C143.752 66.2701 148.033 67.4172 149.966 70.7653C151.899 74.1133 150.752 78.3945 147.404 80.3275L75.5239 121.827C72.1759 123.76 67.8948 122.613 65.9618 119.265C64.0288 115.917 65.1759 111.636 68.5239 109.703L34.7489 129.203C31.4009 131.136 27.1198 129.989 25.1868 126.641C23.2538 123.293 24.4009 119.012 27.7489 117.079L62.39 97.0788C65.738 95.1458 66.8851 90.8646 64.9521 87.5166C63.0191 84.1685 58.738 83.0214 55.39 84.9544L33.7393 97.4544C30.3913 99.3874 26.1101 98.2403 24.1771 94.8922C22.2442 91.5442 23.3913 87.263 26.7393 85.33L61.3803 65.33C58.0323 67.263 53.7512 66.1159 51.8182 62.7679C49.8852 59.4198 51.0323 55.1387 54.3803 53.2057L139.251 4.20569ZM153.251 28.4544C156.599 26.5214 160.88 27.6685 162.813 31.0166C164.746 34.3646 163.599 38.6458 160.251 40.5788C156.903 42.5118 152.622 41.3646 150.689 38.0166C148.756 34.6685 149.903 30.3874 153.251 28.4544Z" fill="#FCFAFF" />
                <path fillRule="evenodd" clipRule="evenodd" d="M86.3911 46.6696V42.6696C86.3911 40.1843 88.4058 38.1696 90.8911 38.1696C93.3764 38.1696 95.3911 40.1843 95.3911 42.6696V46.6696" fill="white" />
                <path d="M86.3911 46.6696V42.6696C86.3911 40.1843 88.4058 38.1696 90.8911 38.1696C93.3764 38.1696 95.3911 40.1843 95.3911 42.6696V46.6696" stroke="#9E77ED" strokeWidth="2.5" />
                <path fillRule="evenodd" clipRule="evenodd" d="M90.8913 46.1696C103.556 46.1696 114.391 55.1386 114.391 68.6696L115.144 83.3521C115.307 86.526 116.156 89.627 117.631 92.4417L121.51 99.8383C122.245 101.921 121.152 104.206 119.069 104.942C118.641 105.092 118.191 105.17 117.738 105.17H64.0449C61.8358 105.17 60.0449 103.379 60.0449 101.17C60.0449 100.716 60.122 100.266 60.273 99.8383L64.1513 92.4417C65.6271 89.627 66.4756 86.526 66.6384 83.3521L67.3913 68.6696C67.3913 55.1386 78.2271 46.1696 90.8913 46.1696Z" fill="white" stroke="#9E77ED" strokeWidth="2.5" />
                <path fillRule="evenodd" clipRule="evenodd" d="M90.8913 50.1696C102.096 50.1696 110 59.0103 110 69.3306L110.626 83.8324C110.722 86.0667 111.158 88.2732 111.92 90.376L115.858 98.4885C116.234 99.5271 115.697 100.674 114.658 101.05C114.44 101.129 114.21 101.17 113.977 101.17H98.4638C97.569 101.17 96.7831 100.575 96.5394 99.7142L93.718 89.7459C93.2212 87.9911 92.9448 86.1822 92.8944 84.3607L92.8861 83.7531V63.9356C92.8861 59.3546 91.8352 55.0188 89.962 51.3846C89.7515 50.9761 89.912 50.4742 90.3204 50.2637C90.4341 50.2051 90.5598 50.1735 90.6877 50.1714C90.7609 50.1702 90.8288 50.1696 90.8913 50.1696Z" fill="#F9F5FF" />
                <path d="M71.6084 86.8073H89.3912M95.0729 86.8073H99.816H95.0729Z" stroke="#D6BBFB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M56.6084 58.3636C56.6084 48.2997 63.0251 40.9394 71.6084 38.3636" stroke="#D6BBFB" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M48.6084 58.3636C48.6084 44.2742 58.4473 33.9697 71.6084 30.3636" stroke="#D6BBFB" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M124.391 58.3636C124.391 48.2997 117.975 40.9394 109.391 38.3636" stroke="#D6BBFB" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M132.391 58.3636C132.391 44.2742 122.552 33.9697 109.391 30.3636" stroke="#D6BBFB" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M85.3914 109.17C85.3914 112.483 88.0776 115.17 91.3914 115.17C94.7051 115.17 97.3914 112.483 97.3914 109.17" stroke="#9E77ED" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <p className="mt-4 text-center max-w-[230px]">Click the <span className="text-[#9E77ED]">+</span> sign below to create your first alert.</p>

        </div>
    )
}

export default function Homepage() {

    const completed = false
    const location = useLocation()
    const alerts = useGeneralAppStore((state) => state.alerts.active)
    const name = useGeneralAppStore((state) => state.currentUser)
    const updateActiveAlerts = useGeneralAppStore((state) => state.updateActiveAlerts)
    const showAlertInfo = useGeneralAppStore((state) => state.showAlertInfo)
    const updateShowAlertInfo = useGeneralAppStore((state) => state.updateShowAlertInfo)

    useEffect(() => {
        const currencyPairs = [
            'EUR/USD',
            'USD/JPY',
            'GBP/USD',
            'USD/CHF',
            'AUD/USD',
            'USD/CAD',
            'NZD/USD',
            'EUR/GBP'
        ];

        const alertTypes = [
            'Price reaching',
            'Price rising above',
            'Price dropping below'
        ];
        const statusTypes = [
            'Active',
            'Paused',
            'Stopped'
        ];

        const notificationTypes = [
            'Email',
            'Push',
            'Email and Push'
        ]

        const generateDummyData = (num: number) => {
            const data = [];
            for (let i = 0; i < num; i++) {
                const randomCurrencyPair = currencyPairs[Math.floor(Math.random() * currencyPairs.length)];
                const randomAlertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
                const randomStatusType = statusTypes[Math.floor(Math.random() * statusTypes.length)];
                const randomTriggerPrice = (Math.random() * (1.5 - 0.7) + 0.7).toFixed(4);  // Random price between 0.7 and 1.5
                const randomNotificationType = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];

                data.push({
                    currencyPair: randomCurrencyPair,
                    alertType: randomAlertType,
                    triggerPrice: randomTriggerPrice,
                    status: randomStatusType,
                    notification: randomNotificationType
                });
            }
            return data;
        };

        const dummyData = generateDummyData(5);
        updateActiveAlerts(dummyData)

    }, [updateActiveAlerts])

    useEffect(() => {
        const handleTouchStart = (e: TouchEvent) => {
            e.preventDefault();
            e.stopPropagation();
            updateShowAlertInfo(false);
        };

        const handleClick = (e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            updateShowAlertInfo(false);
        };

        if (showAlertInfo) {
            document.getElementById('blurredBackground')?.addEventListener('touchstart', handleTouchStart);
            document.getElementById('blurredBackground')?.addEventListener('click', handleClick);
        }

        return () => {
            // Cleanup: Remove the event listeners when the component unmounts
            document.getElementById('blurredBackground')?.removeEventListener('touchstart', handleTouchStart);
            document.getElementById('blurredBackground')?.removeEventListener('click', handleClick);
        };
    }, [showAlertInfo, updateShowAlertInfo]);



    return (
        <>
            <div id="blurredBackground" className={`relative dynamicHeight flex flex-col flex-grow p-[1.25rem] pb-12 w-full ${showAlertInfo ? 'blur-sm blurredBackground' : ''}`}>
                <div className="bg-white border-[#EEF2F6] border-[0.5px] p-[2px] rounded-full flex w-full items-center justify-between">
                    <div className="flex gap-4 items-center">
                        <i>
                            <img src="/Avatars.svg" className="h-[40px] w-[40px]" />
                        </i>
                        <div className="flex flex-col text-xs text-[#101828]">
                            <p>Welome Back,</p>
                            <p className="font-medium">{name}</p>
                        </div>
                    </div>
                    <p className="p-[0.625rem]">👋</p>
                </div>
                {!completed &&
                    <div className="mt-6">
                        <h2 className="text-xs font-semibold text-[#475467]">My Todos</h2>
                        <div className="grid grid-cols-2 gap-3 mt-3">
                            <div className="bg-white flex flex-col gap-2 p-3 rounded-xl">
                                <p className="text-xs text-[#121926] font-semibold leading-[18px]">Setup Your <br />Avatar 🖼</p>
                                <hr />
                                <i className="text-xs h-[16px] w-[16px] flex items-center justify-center rounded-full bg-[#F4EBFF] text-[#364152]">
                                    <FaChevronRight />
                                </i>
                            </div>
                            <div className="bg-white flex flex-col gap-2 p-3 rounded-xl">
                                <p className="text-xs text-[#121926] font-semibold leading-[18px]">Add To <br />Home screen📱</p>
                                <hr />
                                <i className="text-xs h-[16px] w-[16px] flex items-center justify-center rounded-full bg-[#F4EBFF] text-[#364152]">
                                    <FaChevronRight />
                                </i>
                            </div>
                        </div>
                    </div>
                }
                <div className="mt-8 flex-grow flex overflow-scroll scrollbarHidden pb-16">
                    {alerts.length === 0 ?
                        <CreateFirstAlert /> :
                        <div className="flex flex-col overflow-y-scroll scrollbarHidden w-full">
                            <Alerts />
                            <TopPairs />
                        </div>
                    }
                </div>
                <div className="fixed bottom-12 flex items-center justify-center w-full inset-x-0 px-[1.25rem]">
                    <HomeBottomNavbar path={location.pathname} />
                </div>
            </div>
            <div className='absolute bottom-0 w-full left-0 flex items-center justify-center'>
                {showAlertInfo && <AlertInfoToShow />}
            </div>
        </>
    )
}
