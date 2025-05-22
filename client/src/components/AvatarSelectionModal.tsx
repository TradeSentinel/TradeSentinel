import React, { useState, useEffect } from 'react';
import { CheckIcon } from './Icons';

interface AvatarSelectionModalProps {
    onClose: () => void;
    onSelectAvatar: (avatarId: number) => void;
    currentAvatarId?: number | null;
}

const AvatarSelectionModal: React.FC<AvatarSelectionModalProps> = ({ onClose, onSelectAvatar, currentAvatarId }) => {
    const [isClosing, setIsClosing] = useState(false);
    const [selectedAvatar, setSelectedAvatar] = useState<number | null>(currentAvatarId || null);

    // Avatar data
    const avatars = [
        { id: 1, src: "/avatar1.png", bgColor: '#EBE9FF' },
        { id: 2, src: "/avatar2.png", bgColor: '#DCFCE7' },
        { id: 3, src: "/avatar3.png", bgColor: '#FFEBD5' },
        { id: 4, src: "/avatar4.png", bgColor: '#EBE9FF' },
        { id: 5, src: "/avatar5.png", bgColor: '#DCFCE7' },
        { id: 6, src: "/avatar6.png", bgColor: '#FFEBD5' },
    ];

    // Preload all avatar images when modal opens
    useEffect(() => {
        // Preload all avatar images to avoid flashing
        avatars.forEach(avatar => {
            const img = new Image();
            img.src = avatar.src;
        });
    }, []);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
        }, 300); // Match this timeout with the animation duration
    };

    const handleSelectAvatar = (id: number) => {
        setSelectedAvatar(id);
        setIsClosing(true);
        setTimeout(() => {
            onSelectAvatar(id);
        }, 300);
    };

    return (
        <div
            id="avatarModal"
            className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl pb-12 shadow-lg z-50 ${isClosing ? 'slide-down-animation' : 'slide-up-animation'}`}
        >
            <div className="flex flex-col">
                <div className='py-8 px-5 flex flex-col items-center'>
                    <h2 className="text-xl font-semibold mb-6 text-[#202939]">Select an avatar</h2>

                    <div className="grid grid-cols-3 gap-4 w-full place-items-center px-12">
                        {avatars.map((avatar) => (
                            <div
                                key={avatar.id}
                                onClick={() => handleSelectAvatar(avatar.id)}
                                className={`relative cursor-pointer overflow-hidden rounded-xl ${selectedAvatar === avatar.id ? 'border-[1.5px] border-[#735FFF] bg-[#E0E0E0]' : ''}`}
                            >
                                <img
                                    src={avatar.src}
                                    alt={`Avatar ${avatar.id}`}
                                    className="w-full h-auto"
                                />
                                {selectedAvatar === avatar.id && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="bg-transparent rounded-md p-[3px] border border-white">
                                            <CheckIcon />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
                <div className='flex justify-center items-center w-full'>
                    <hr className='w-full border-[#D0D5DD]' />
                </div>
                <button
                    onClick={handleClose}
                    className="text-[#667085] text-center font-medium my-3 py-[10px] leading-6"
                >
                    Cancel
                </button>
            </div>

            {/* Bottom indicator bar */}
            <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                <div className="w-16 h-1 bg-[#D0D5DD] rounded-full"></div>
            </div>
        </div>
    );
};

export default AvatarSelectionModal; 