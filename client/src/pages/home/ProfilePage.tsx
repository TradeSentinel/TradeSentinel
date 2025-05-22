import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/homeComponents/PageHeader';
import { useGeneralAppStore } from '../../utils/generalAppStore';
import { db } from '../../utils/firebaseInit';
import { doc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import MiniLoader from '../../components/MiniLoader';
import { GreenCheckMark, Pencil, User } from '../../components/Icons';
import AvatarSelectionModal from '../../components/AvatarSelectionModal';

const ProfilePage: React.FC = () => {
    const [formLoading, setFormLoading] = useState(false);
    const [showAvatarModal, setShowAvatarModal] = useState(false);
    // const [userData, setUserData] = useState<any>(null);
    const [formData, setFormData] = useState({
        fullName: ''
    });
    const [selectedAvatarId, setSelectedAvatarId] = useState<number | null>(null);
    const [formModified, setFormModified] = useState(false);

    const currentUser = useGeneralAppStore((state) => state.currentUser);
    const userProfileName = useGeneralAppStore((state) => state.userProfileName);
    const avatarId = useGeneralAppStore((state) => state.avatarId);
    const updateHasSetAvatar = useGeneralAppStore((state) => state.updateHasSetAvatar);
    const updateAvatarId = useGeneralAppStore((state) => state.updateAvatarId);
    const updateUserProfileName = useGeneralAppStore((state) => state.updateUserProfileName);

    const email = currentUser?.email || '';
    const isEmailVerified = currentUser?.emailVerified || false;

    // Initialize form data and selected avatar when user profile data changes
    useEffect(() => {
        setFormData({
            fullName: userProfileName || currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0] : 'User')
        });
        setSelectedAvatarId(avatarId);
    }, [userProfileName, currentUser, avatarId]);

    // // Fetch any additional user data on component mount (if needed)
    // useEffect(() => {
    //     const fetchUserData = async () => {
    //         if (!currentUser) return;

    //         try {
    //             // const userDocRef = doc(db, "users", currentUser.uid);
    //             // const userSnapshot = await getDoc(userDocRef);

    //             // if (userSnapshot.exists()) {
    //             //     const data = userSnapshot.data();
    //             //     // setUserData(data);
    //             // }
    //         } catch (error) {
    //             console.error("Error fetching user data:", error);
    //         }
    //     };

    //     fetchUserData();
    // }, [currentUser]);

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        setFormModified(true);
    };

    // Handle avatar selection (just update local state, don't save to DB yet)
    const handleSelectAvatar = (newAvatarId: number) => {
        setShowAvatarModal(false);
        if (newAvatarId !== avatarId) {
            setSelectedAvatarId(newAvatarId);
            setFormModified(true);
        }
    };

    // Handle form submission - now includes avatar update
    const handleSaveChanges = async () => {
        // Validate full name
        if (!formData.fullName.trim()) {
            toast.error("Full name cannot be empty");
            return;
        }

        if (!currentUser) {
            toast.error("You must be logged in to update your profile");
            return;
        }

        setFormLoading(true);
        try {
            const userDocRef = doc(db, "users", currentUser.uid);
            const updates: any = {
                fullName: formData.fullName
            };

            // Only include avatar updates if the avatar was changed
            if (selectedAvatarId !== null && selectedAvatarId !== avatarId) {
                updates.avatarId = selectedAvatarId;
                updates.avatarUrl = `/avatar${selectedAvatarId}.png`;
                updates.hasSetAvatar = true;
            }

            // Update Firestore
            await updateDoc(userDocRef, updates);

            // Update Zustand store
            updateUserProfileName(formData.fullName);

            // Only update avatar in store if it was changed
            if (selectedAvatarId !== null && selectedAvatarId !== avatarId) {
                updateAvatarId(selectedAvatarId);
                updateHasSetAvatar(true);
            }

            toast.success("Profile updated successfully!");
            setFormModified(false);
        } catch (error) {
            console.error("Error updating profile:", error);
            toast.error("Failed to update profile. Please try again.");
        } finally {
            setFormLoading(false);
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

    // Show the currently selected avatar (from local state) or fall back to the one from store
    const displayAvatarId = selectedAvatarId !== null ? selectedAvatarId : avatarId;

    return (
        <>
            <div className={`overflow-scroll dynamicHeight flex flex-col flex-grow p-[1.25rem] pb-12 w-full ${showAvatarModal ? 'blur-sm' : ''}`}>
                <PageHeader name="Profile" />

                <div className="flex-grow mt-6 flex flex-col">
                    {/* Avatar Section */}
                    <div className="flex justify-center mb-8">
                        <div className="relative">
                            <div className="bg-white w-[80px] h-[80px] rounded-full flex items-center justify-center overflow-hidden">
                                {displayAvatarId ? (
                                    <img
                                        src={`/avatar${displayAvatarId}.png`}
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
                        {/* First Name Field (editable) */}
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium leading-5 text-[#364152]">Full Name</label>
                            <input
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleInputChange}
                                className="bg-white text-[#121926] w-full px-[14px] py-[10px] rounded-xl outline-none border-[0.5px] border-[#E3E8EF]"
                                type="text"
                                placeholder="Enter your full name"
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
            {/* Save Changes Button */}
            {formModified && (
                <div className="absolute bottom-0 mt-auto border-t-[1px] border-[#CDD5DF] p-[1.25rem] w-full pb-12">
                    <button
                        onClick={handleSaveChanges}
                        disabled={formLoading}
                        className="w-full py-[0.625rem] flex items-center justify-center px-[1.125rem] font-medium text-white rounded-full bg-[#7F56D9]"
                    >
                        {formLoading ? <MiniLoader /> : "Save Changes"}
                    </button>
                </div>
            )}
            {/* Modal Backdrop */}
            {showAvatarModal && (
                <div className="fixed inset-0 modal-backdrop z-40" onClick={() => setShowAvatarModal(false)}></div>
            )}

            {/* Avatar Selection Modal */}
            {showAvatarModal && (
                <AvatarSelectionModal
                    onClose={() => setShowAvatarModal(false)}
                    onSelectAvatar={handleSelectAvatar}
                    currentAvatarId={displayAvatarId}
                />
            )}
        </>
    );
};

export default ProfilePage; 