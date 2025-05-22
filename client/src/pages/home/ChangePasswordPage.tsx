import React, { useState } from 'react';
import PageHeader from '../../components/homeComponents/PageHeader';
import { auth } from '../../utils/firebaseInit';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { toast } from 'react-toastify';
import MiniLoader from '../../components/MiniLoader';

const ChangePasswordPage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [passwords, setPasswords] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [formModified, setFormModified] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswords(prev => ({ ...prev, [name]: value }));
        // Clear error when user types
        if (error) setError('');
        // Mark form as modified when user starts typing
        setFormModified(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { oldPassword, newPassword, confirmPassword } = passwords;

        // Validation
        if (!oldPassword || !newPassword || !confirmPassword) {
            setError('All fields are required');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('New password and confirm password do not match');
            return;
        }

        if (newPassword.length < 6) {
            setError('New password must be at least 6 characters long');
            return;
        }

        setLoading(true);
        try {
            const user = auth.currentUser;
            if (!user || !user.email) {
                throw new Error('User not authenticated');
            }

            // Re-authenticate user before changing password
            const credential = EmailAuthProvider.credential(user.email, oldPassword);
            await reauthenticateWithCredential(user, credential);

            // Update password
            await updatePassword(user, newPassword);

            toast.success('Password changed successfully', {
                position: "top-right",
                autoClose: 2000,
                theme: "light"
            });

            // Reset form
            setPasswords({
                oldPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            setFormModified(false);
        } catch (error: any) {
            console.error('Error changing password:', error);
            let errorMessage = 'Failed to change password';

            if (error.code === 'auth/wrong-password') {
                errorMessage = 'Current password is incorrect';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Too many attempts. Please try again later';
            } else if (error.code === 'auth/requires-recent-login') {
                errorMessage = 'Please log out and log back in before changing your password';
            }

            setError(errorMessage);
            toast.error(errorMessage, {
                position: "top-right",
                autoClose: 3000,
                theme: "light"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="overflow-scroll dynamicHeight flex flex-col flex-grow p-[1.25rem] pb-12 w-full">
                <PageHeader name="Change Password" />

                <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-8">
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium leading-5 text-[#364152]">Old password</label>
                        <input
                            type="text"
                            name="oldPassword"
                            value={passwords.oldPassword}
                            onChange={handleInputChange}
                            className="bg-white text-[#121926] w-full px-[14px] py-[10px] rounded-xl outline-none border-[0.5px] border-[#E3E8EF]"
                            placeholder="Enter your old password"
                            disabled={loading}
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium leading-5 text-[#364152]">New password</label>
                        <input
                            type="text"
                            name="newPassword"
                            value={passwords.newPassword}
                            onChange={handleInputChange}
                            className="bg-white text-[#121926] w-full px-[14px] py-[10px] rounded-xl outline-none border-[0.5px] border-[#E3E8EF]"
                            placeholder="Enter your new password"
                            disabled={loading}
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium leading-5 text-[#364152]">Confirm password</label>
                        <input
                            type="text"
                            name="confirmPassword"
                            value={passwords.confirmPassword}
                            onChange={handleInputChange}
                            className="bg-white text-[#121926] w-full px-[14px] py-[10px] rounded-xl outline-none border-[0.5px] border-[#E3E8EF]"
                            placeholder="Enter your new password again"
                            disabled={loading}
                        />
                    </div>

                    {error && (
                        <p className="text-[#AD183F] text-sm mt-1">{error}</p>
                    )}
                </form>
            </div>

            {/* Save Changes Button - Only visible when form is modified */}
            {formModified && (
                <div className="absolute bottom-0 mt-auto border-t-[1px] border-[#CDD5DF] p-[1.25rem] w-full pb-12">
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full py-[0.625rem] flex items-center justify-center px-[1.125rem] font-medium text-white rounded-full bg-[#7F56D9]"
                    >
                        {loading ? <MiniLoader /> : "Save Changes"}
                    </button>
                </div>
            )}
        </>
    );
};

export default ChangePasswordPage; 