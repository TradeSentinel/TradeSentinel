import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/homeComponents/PageHeader';
import { auth, db } from '../../utils/firebaseInit';
import { doc, updateDoc } from 'firebase/firestore';
import { useGeneralAppStore } from '../../utils/generalAppStore';

const SetupPWA: React.FC = () => {
    const navigateTo = useNavigate();
    const [activeTab, setActiveTab] = useState<'ios' | 'android'>('ios');

    const currentUser = useGeneralAppStore((state) => state.currentUser);
    const pwaPromptDismissed = useGeneralAppStore((state) => state.pwaPromptDismissed);
    const updatePwaPromptDismissed = useGeneralAppStore((state) => state.updatePwaPromptDismissed);

    const handleDoneClick = async () => {
        if (currentUser) {
            try {
                const userDocRef = doc(db, "users", currentUser.uid);
                await updateDoc(userDocRef, { pwaPromptDismissed: true });
                updatePwaPromptDismissed(true);
                navigateTo("/dashboard");
            } catch (error) {
                console.error("Error updating pwaPromptDismissed status:", error);
            }
        } else {
            navigateTo("/dashboard");
        }
    };

    return (
        <div className={`flex flex-col h-full p-[1.25rem]  ${pwaPromptDismissed ? 'pb-12' : 'pb-32'}`}>
            <PageHeader name="Setup PWA" />

            <div className="flex flex-col flex-grow overflow-auto scrollbarHidden mt-3">
                <p className="text-sm text-[#364152]">
                    Select your device type and follow the detailed steps to add Trade Sentinel to your home screen.
                </p>

                {/* Tabs */}
                <div className="flex mt-6 border-b border-[#CDD5DF]">
                    <button
                        className={`flex-1 text-sm py-2 font-medium ${activeTab === 'ios' ? 'text-[#7F56D9] border-b-2 border-[#7F56D9]' : 'text-[#697586]'}`}
                        onClick={() => setActiveTab('ios')}
                    >
                        iOS
                    </button>
                    <button
                        className={`flex-1 text-sm py-2 font-medium ${activeTab === 'android' ? 'text-[#7F56D9] border-b-2 border-[#7F56D9]' : 'text-[#697586]'}`}
                        onClick={() => setActiveTab('android')}
                    >
                        Android
                    </button>
                </div>

                {/* iOS Instructions */}
                {activeTab === 'ios' && (
                    <div className="mt-6 space-y-4">
                        <div className="bg-white rounded-xl p-4">
                            <h3 className="text-sm font-medium text-[#121926] mb-2">Step 1: Open in Safari</h3>
                            <p className="text-xs text-[#475467]">Make sure you're using Safari browser. Copy this website's URL and open it in Safari if you're using a different browser.</p>
                        </div>

                        <div className="bg-white rounded-xl p-4">
                            <h3 className="text-sm font-medium text-[#121926] mb-2">Step 2: Tap the Share icon</h3>
                            <p className="text-xs text-[#475467]">Find the Share icon at the bottom of the screen (or top, depending on your iOS version).</p>
                            <div className="mt-3 flex justify-center">
                                <div className="bg-[#F9FAFB] p-3 rounded-md">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                                        <polyline points="16 6 12 2 8 6"></polyline>
                                        <line x1="12" y1="2" x2="12" y2="15"></line>
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-4">
                            <h3 className="text-sm font-medium text-[#121926] mb-2">Step 3: Add to Home Screen</h3>
                            <p className="text-xs text-[#475467]">Scroll down in the share menu and tap "Add to Home Screen".</p>
                            <div className="mt-3 flex justify-center">
                                <div className="bg-[#F9FAFB] px-4 py-2 rounded-md">
                                    <div className="flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                            <line x1="12" y1="8" x2="12" y2="16"></line>
                                            <line x1="8" y1="12" x2="16" y2="12"></line>
                                        </svg>
                                        <span className="text-xs font-medium">Add to Home Screen</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-4">
                            <h3 className="text-sm font-medium text-[#121926] mb-2">Step 4: Confirm</h3>
                            <p className="text-xs text-[#475467]">Tap "Add" in the top-right corner to add Trade Sentinel to your home screen.</p>
                            <div className="mt-3 flex justify-end">
                                <div className="bg-[#F9FAFB] px-3 py-1 rounded-md">
                                    <span className="text-xs font-medium text-[#7F56D9]">Add</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Android Instructions */}
                {activeTab === 'android' && (
                    <div className="mt-6 space-y-4">
                        <div className="bg-white rounded-xl p-4">
                            <h3 className="text-sm font-medium text-[#121926] mb-2">Step 1: Open in a Chromium Browser</h3>
                            <p className="text-xs text-[#475467]">Use Chrome, Samsung Internet, Edge, Opera, or another Chromium-based browser. The steps may vary slightly between browsers.</p>
                        </div>

                        <div className="bg-white rounded-xl p-4">
                            <h3 className="text-sm font-medium text-[#121926] mb-2">Step 2: Tap the Menu icon</h3>
                            <p className="text-xs text-[#475467]">Look for the menu icon (typically three dots) in the top-right corner and tap it.</p>
                            <div className="mt-3 flex justify-center">
                                <div className="bg-[#F9FAFB] p-2 rounded-md">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="1"></circle>
                                        <circle cx="12" cy="5" r="1"></circle>
                                        <circle cx="12" cy="19" r="1"></circle>
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-4">
                            <h3 className="text-sm font-medium text-[#121926] mb-2">Step 3: Find the Installation Option</h3>
                            <p className="text-xs text-[#475467]">Look for "Install app," "Add to Home screen," or a similar option in the menu. The exact wording depends on your browser.</p>
                            <div className="mt-3 flex justify-center">
                                <div className="bg-[#F9FAFB] px-4 py-2 rounded-md">
                                    <div className="flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                                            <polyline points="7.5 4.21 12 6.81 16.5 4.21"></polyline>
                                            <polyline points="7.5 19.79 7.5 14.6 3 12"></polyline>
                                            <polyline points="21 12 16.5 14.6 16.5 19.79"></polyline>
                                            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                                            <line x1="12" y1="22.08" x2="12" y2="12"></line>
                                        </svg>
                                        <span className="text-xs font-medium">Install app</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-4">
                            <h3 className="text-sm font-medium text-[#121926] mb-2">Step 4: Confirm Installation</h3>
                            <p className="text-xs text-[#475467]">Tap "Install" or "Add" when prompted to confirm adding Trade Sentinel to your home screen.</p>
                            <div className="mt-3 flex justify-end">
                                <div className="bg-[#F9FAFB] px-3 py-1 rounded-md">
                                    <span className="text-xs font-medium text-[#7F56D9]">Install</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Done Button - Only show if not already completed */}
            {!pwaPromptDismissed && (
                <div className="fixed bottom-0 left-0 right-0 p-[1.25rem] pb-12 bg-[#EEF2F6] border-t border-[#CDD5DF]">
                    <button
                        onClick={handleDoneClick}
                        className="w-full py-[0.625rem] px-[1.125rem] font-medium text-white rounded-full bg-[#7F56D9]"
                    >
                        Done
                    </button>
                </div>
            )}
        </div>
    );
};

export default SetupPWA; 