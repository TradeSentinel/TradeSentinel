import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/homeComponents/PageHeader';
import { useGeneralAppStore } from '../../utils/generalAppStore';
import { auth, db } from '../../utils/firebaseInit';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import MiniLoader from '../../components/MiniLoader';
import { GreenCheckMark, Pencil, User } from '../../components/Icons';
import AvatarSelectionModal from '../../components/AvatarSelectionModal';

const ProfilePage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [showAvatarModal, setShowAvatarModal] = useState(false);
    const [userData, setUserData] = useState<any>(null);

    const currentUser = useGeneralAppStore((state) => state.currentUser);
    const userProfileName = useGeneralAppStore((state) => state.userProfileName);
    const hasSetAvatar = useGeneralAppStore((state) => state.hasSetAvatar);
    const avatarId = useGeneralAppStore((state) => state.avatarId);
    const updateHasSetAvatar = useGeneralAppStore((state) => state.updateHasSetAvatar);
    const updateAvatarId = useGeneralAppStore((state) => state.updateAvatarId);

    const fullName = userProfileName || currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0] : 'User');
    const email = currentUser?.email || '';
    const isEmailVerified = currentUser?.emailVerified || false;

    // Fetch any additional user data on component mount (if needed)
    useEffect(() => {
        const fetchUserData = async () => {
            if (!currentUser) return;

            try {
                const userDocRef = doc(db, "users", currentUser.uid);
                const userSnapshot = await getDoc(userDocRef);

                if (userSnapshot.exists()) {
                    const data = userSnapshot.data();
                    setUserData(data);
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            }
        };

        fetchUserData();
    }, [currentUser]);

    // Handle avatar selection
    const handleSelectAvatar = async (newAvatarId: number) => {
        setShowAvatarModal(false);

        if (!currentUser) {
            toast.error("You must be logged in to update your avatar.");
            return;
        }

        // If the avatar is the same, don't update
        if (newAvatarId === avatarId) return;

        setLoading(true);
        try {
            const userDocRef = doc(db, "users", currentUser.uid);

            // Update the user document with the selected avatar ID
            await updateDoc(userDocRef, {
                avatarId: newAvatarId,
                avatarUrl: `/avatar${newAvatarId}.png`, // For future use when actual avatar images are available
                hasSetAvatar: true
            });

            // Update Zustand store
            updateAvatarId(newAvatarId);
            updateHasSetAvatar(true);

            toast.success("Avatar updated successfully!");
        } catch (error) {
            console.error("Error updating avatar:", error);
            toast.error("Failed to update avatar. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Toggle avatar modal
    const toggleAvatarModal = () => {
        setShowAvatarModal(prev => !prev);
    };

    // Close modal when clicking outside (backdrop)
    useEffect(() => {
        const handleBackdropClick = (e: MouseEvent) => {

            const target = e.target as HTMLElement;
            if (target.classList.contains('modal-backdrop')) {
                // Don't immediately hide the modal, let it animate first
                document.getElementById('avatarModal')?.classList.add('slide-down-animation');
                setTimeout(() => {
                    setShowAvatarModal(false);
                }, 300);
            }
        };

        if (showAvatarModal) {
            document.addEventListener('click', handleBackdropClick);
        }

        return () => {
            document.removeEventListener('click', handleBackdropClick);
        };
    }, [showAvatarModal]);

    return (
        <>
            {loading && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                    <MiniLoader />
                </div>
            )}
            <div className={`overflow-scroll dynamicHeight flex flex-col flex-grow p-[1.25rem] pb-12 w-full ${showAvatarModal ? 'blur-sm' : ''}`}>
                <PageHeader name="Profile" />

                <div className="flex-grow mt-6">
                    {/* Avatar Section */}
                    <div className="flex justify-center mb-8">
                        <div className="relative">
                            <div className="bg-white w-[80px] h-[80px] rounded-full flex items-center justify-center overflow-hidden">
                                {avatarId ? (
                                    <img
                                        src={`/avatar${avatarId}.png`}
                                        alt="User Avatar"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <User />
                                )}
                            </div>
                            <div
                                onClick={toggleAvatarModal}
                                className="absolute bottom-[0px] right-0 bg-white rounded-full p-2 shadow-md cursor-pointer"
                            >
                                <Pencil />
                            </div>
                        </div>
                    </div>

                    {/* Profile Form */}
                    <div className="flex flex-col gap-5">
                        {/* First Name Field (read-only) */}
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium leading-5 text-[#364152]">First Name</label>
                            <input
                                value={fullName}
                                readOnly
                                className="bg-white text-[#697586] w-full px-[14px] py-[10px] rounded-xl outline-none border-[0.5px] border-[#E3E8EF]"
                                type="text"
                            />
                        </div>

                        {/* Email Field (Read-only) */}
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium leading-5 text-[#364152]">Email</label>
                            <div className="bg-white w-full px-[14px] py-[10px] rounded-xl border-[0.5px] border-[#E3E8EF] flex justify-between items-center">
                                <input
                                    value={email}
                                    readOnly
                                    className="outline-none flex-grow text-[#697586] bg-transparent"
                                    type="email"
                                />
                                {isEmailVerified && (
                                    <GreenCheckMark />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Backdrop */}
            {showAvatarModal && (
                <div className="fixed inset-0 modal-backdrop z-40" onClick={() => setShowAvatarModal(false)}></div>
            )}

            {/* Avatar Selection Modal */}
            {showAvatarModal && (
                <AvatarSelectionModal
                    onClose={() => setShowAvatarModal(false)}
                    onSelectAvatar={handleSelectAvatar}
                    currentAvatarId={avatarId}
                />
            )}
        </>
    );
};

export default ProfilePage; 