import React from 'react';
import AppLogo from '@/components/common/AppLogo';
import { AnnouncementsCarousel } from '@/components/common/AnnouncementsCarousel';

interface AuthPageLayoutProps {
  children: React.ReactNode;
  title: string;
}

const AuthPageLayout: React.FC<AuthPageLayoutProps> = ({ children, title }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-6xl">
        <div className="flex flex-col md:flex-row rounded-lg shadow-2xl overflow-hidden bg-card">
          {/* Form Side */}
          <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
            <AppLogo className="mb-8 text-center" />
            <h1 className="text-3xl font-headline font-bold text-primary mb-6 text-center">{title}</h1>
            {children}
          </div>

          {/* Carousel Side */}
          <div className="w-full md:w-1/2 bg-gray-100 dark:bg-gray-800 p-8 md:p-12 flex items-center justify-center">
            <AnnouncementsCarousel />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPageLayout;
