import React from 'react';
import PageHeader from '../../components/homeComponents/PageHeader';
import { EmailIcon, TwitterLogo } from '../../components/Icons';

const AboutPage: React.FC = () => {
    return (
        <div className="flex flex-col flex-grow h-full  p-[1.25rem] pb-12">
            <PageHeader name="About" />

            <div className="flex-grow overflow-auto scrollbarHidden">
                <div className="flex flex-col items-center">
                    {/* App Logo */}
                    <div className="flex items-center justify-center">
                        <img src="/about_logo.svg" alt="Trade Sentinel Logo" />
                    </div>

                    {/* App Name */}
                    <h1 className="text-[#121926] text-xl font-semibold mt-4">Trade Sentinel</h1>
                </div>

                {/* Contact Us Section */}
                <div className="mt-10">
                    <h2 className="text-xs font-medium text-[#697586] uppercase tracking-wide mb-2">CONTACT US</h2>
                    <div className="bg-white rounded-xl overflow-hidden">
                        <a
                            href="https://twitter.com/usesentinel"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between py-3 px-4 border-b border-[#F1F5F9]"
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-[#364152] h-4 w-4 p-1 rounded-full flex items-center justify-center">
                                    <TwitterLogo />
                                </div>
                                <span className="text-sm text-[#121926] font-bold">X (Twitter)</span>
                            </div>
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8.33366 5.8335L11.667 10.0002L8.33366 14.1668" stroke="#28303F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </a>

                        <a
                            href="mailto:contact@tradesentinel.xyz"
                            className="flex items-center justify-between py-3 px-4"
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-[#364152] h-4 w-4 p-1 rounded-full flex items-center justify-center">
                                    <EmailIcon />
                                </div>
                                <span className="text-sm text-[#121926] font-bold">Email Feedback</span>
                            </div>
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8.33366 5.8335L11.667 10.0002L8.33366 14.1668" stroke="#28303F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </a>
                    </div>
                </div>

                {/* Follow The Team Section */}
                <div className="mt-8">
                    <h2 className="text-xs font-medium text-[#697586] uppercase tracking-wide mb-2">FOLLOW THE TEAM</h2>
                    <div className="bg-white rounded-xl overflow-hidden">
                        <a
                            href="https://twitter.com/its_thepoe"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between py-3 px-4 border-b border-[#F1F5F9]"
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-[#364152] h-4 w-4 p-1 rounded-full flex items-center justify-center">
                                    <TwitterLogo />
                                </div>
                                <div>
                                    <span className="text-sm text-[#121926] font-bold">Dipo</span>
                                    <span className="text-sm text-[#121926]"> (Product Designer)</span>
                                </div>
                            </div>
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8.33366 5.8335L11.667 10.0002L8.33366 14.1668" stroke="#28303F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </a>

                        <a
                            href="https://twitter.com/TeyeAyo"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between py-3 px-4 border-b border-[#F1F5F9]"
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-[#364152] h-4 w-4 p-1 rounded-full flex items-center justify-center">
                                    <TwitterLogo />
                                </div>
                                <div>
                                    <span className="text-sm text-[#121926] font-bold">Ayo</span>
                                    <span className="text-sm text-[#121926]"> (Software Engineer)</span>
                                </div>
                            </div>
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8.33366 5.8335L11.667 10.0002L8.33366 14.1668" stroke="#28303F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </a>

                        <a
                            href="https://twitter.com/guylikenimi"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between py-3 px-4"
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-[#364152] h-4 w-4 p-1 rounded-full flex items-center justify-center">
                                    <TwitterLogo />
                                </div>
                                <div>
                                    <span className="text-sm text-[#121926] font-bold">Nims</span>
                                    <span className="text-sm text-[#121926]"> (UX Writer)</span>
                                </div>
                            </div>
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8.33366 5.8335L11.667 10.0002L8.33366 14.1668" stroke="#28303F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </a>
                    </div>
                </div>

                {/* Legal Links */}
                <div className="mt-8">
                    <div className="bg-white rounded-xl overflow-hidden">
                        <a
                            href="https://tradesentinel.xyz/privacy-policy"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between py-3 px-4 border-b border-[#F1F5F9]"
                        >
                            <span className="text-sm text-[#121926] font-bold">Privacy Policy</span>
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8.33366 5.8335L11.667 10.0002L8.33366 14.1668" stroke="#28303F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </a>

                        <a
                            href="https://tradesentinel.xyz/terms-of-use"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between py-3 px-4"
                        >
                            <span className="text-sm text-[#121926] font-bold">Terms of Use</span>
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8.33366 5.8335L11.667 10.0002L8.33366 14.1668" stroke="#28303F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutPage; 