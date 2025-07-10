
import React from 'react';
import AppLogo from '@/components/common/AppLogo';
import { LoginPageImageDisplay } from '@/components/common/LoginPageImageDisplay'; // Updated import

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
            <AppLogo className="mb-4 text-center text-xl" useAcronym={false} />
            <h2 className="text-xl font-headline text-primary mb-6 text-center">Bienvenido a MADI</h2>
            <h1 className="text-2xl font-headline font-bold text-card-foreground mb-6 text-center">{title}</h1>
            {children}
          </div>

          {/* Image Side */}
          <div className="w-full md:w-1/2 bg-gray-100 dark:bg-gray-800 p-8 md:p-12 flex flex-col justify-center items-center">
            <LoginPageImageDisplay /> {/* Updated component */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPageLayout;
