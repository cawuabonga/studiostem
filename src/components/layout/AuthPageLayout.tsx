
"use client";

import React, { useEffect, useState } from 'react';
import AppLogo from '@/components/common/AppLogo';
import { LoginPageImageDisplay } from '@/components/common/LoginPageImageDisplay';
import { getLoginDesignSettings } from '@/config/firebase';
import type { LoginDesign } from '@/types';
import { cn } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';

interface AuthPageLayoutProps {
  children: React.ReactNode;
  title: string;
}

const AuthPageLayout: React.FC<AuthPageLayoutProps> = ({ children, title }) => {
  const [design, setDesign] = useState<LoginDesign | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDesign = async () => {
      setLoading(true);
      const settings = await getLoginDesignSettings();
      setDesign(settings);
      setLoading(false);
    };
    fetchDesign();
  }, []);

  const layoutClasses = {
    side: "flex-col md:flex-row",
    center: "flex-col",
  };

  const formContainerClasses = {
    side: "w-full md:w-1/2 p-8 md:p-12",
    center: "w-full max-w-lg mx-auto p-8 md:p-12",
  };

  const imageContainerClasses = {
    side: "w-full md:w-1/2 p-8 md:p-12",
    center: "w-full max-w-lg mx-auto p-8 md:p-12 hidden", // Ocultar en modo centrado
  };
  
  const currentLayout = design?.layout || 'side';

  if (loading) {
    return (
       <div className="min-h-screen flex items-center justify-center bg-background">
         <div className="w-full max-w-md space-y-4 p-8">
            <Skeleton className="h-10 w-3/4 mx-auto" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-10 w-full" />
         </div>
       </div>
    )
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{
        backgroundColor: design?.backgroundColor || 'hsl(var(--background))',
        color: design?.textColor || 'hsl(var(--card-foreground))',
      }}
    >
      <div className={cn("w-full", currentLayout === 'side' ? 'max-w-6xl' : 'max-w-lg')}>
        <div 
          className={cn(
            "flex rounded-lg shadow-2xl overflow-hidden bg-card",
            layoutClasses[currentLayout],
             currentLayout === 'center' && 'items-center'
            )}
        >
          {/* Form Side */}
          <div className={cn(formContainerClasses[currentLayout], "flex flex-col justify-center")}>
            <AppLogo className="mb-4 text-center text-xl" useAcronym={false} />
            <h2 className="text-xl font-headline text-primary mb-6 text-center">Bienvenido a STEM</h2>
            <h1 className="text-2xl font-headline font-bold text-card-foreground mb-6 text-center">{title}</h1>
            {children}
          </div>

          {/* Image Side */}
          <div className={cn(
              imageContainerClasses[currentLayout],
              "flex flex-col justify-center items-center"
            )}>
            <LoginPageImageDisplay imageUrl={design?.imageUrl} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPageLayout;
