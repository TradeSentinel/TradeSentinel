import React from 'react';
import PageHeader from '../../components/homeComponents/PageHeader';

const AboutPage: React.FC = () => {
    return (
        <div className="overflow-scroll dynamicHeight flex flex-col flex-grow p-[1.25rem] pb-12 w-full">
            <PageHeader name="About Trade Sentinel" />
            <div className="flex-grow flex items-center justify-center">
                <p className="text-lg text-gray-500">About Page Content</p>
            </div>
        </div>
    );
};

export default AboutPage; 