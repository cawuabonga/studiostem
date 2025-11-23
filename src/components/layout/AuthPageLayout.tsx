"use client";

import React, { useEffect, useState } from 'react';
import { getLoginDesignSettings } from '@/config/firebase';
import type { LoginDesign } from '@/types';
import { cn } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';
import { LoginPageImageDisplay } from '../common/LoginPageImageDisplay';
import { Button } from '../ui/button';
import { useRouter } from 'next/navigation';
import AppLogo from '../common/AppLogo';
import { Lock, Mail } from 'lucide-react';

interface AuthPageLayoutProps {
  children: React.ReactNode;
  formType: 'login' | 'register';
}

const AuthPageLayout: React.FC<AuthPageLayoutProps> = ({ children, formType }) => {
  const [design, setDesign] = useState<LoginDesign | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchDesign = async () => {
      setLoading(true);
      const settings = await getLoginDesignSettings();
      setDesign(settings);
      setLoading(false);
    };
    fetchDesign();
  }, []);
  
  if (loading) {
    return (
       <div className="min-h-screen flex items-center justify-center bg-background">
         <Skeleton className="h-[600px] w-full max-w-4xl" />
       </div>
    )
  }
  
  const primaryColor = design?.backgroundColor || '#4f46e5'; // Un morado por defecto

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl h-[650px] flex shadow-2xl rounded-2xl overflow-hidden">
        
        {/* Left Panel */}
        <div className="w-1/2 h-full hidden md:flex flex-col justify-between p-12 text-white" style={{ backgroundColor: primaryColor }}>
            <div>
              <AppLogo className="text-white text-lg" />
            </div>
            <div className="relative w-full h-64">
                 <LoginPageImageDisplay imageUrl={design?.imageUrl} />
            </div>
             <div className="flex gap-4">
                <Button 
                    variant="ghost" 
                    className={cn(
                        "text-lg font-bold rounded-full px-8 py-6 transition-all duration-300", 
                        formType === 'login' ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
                    )}
                    onClick={() => router.push('/')}
                >
                    INICIAR SESIÓN
                </Button>
                <Button 
                    variant="ghost" 
                     className={cn(
                        "text-lg font-bold rounded-full px-8 py-6 transition-all duration-300", 
                        formType === 'register' ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
                    )}
                    onClick={() => router.push('/register')}
                >
                    REGISTRARSE
                </Button>
            </div>
        </div>

        {/* Right Panel */}
        <div className="w-full md:w-1/2 h-full bg-white flex flex-col justify-center p-8 md:p-12">
            {/* Curved border effect */}
            <div className="absolute hidden md:block top-0 left-1/2 w-32 h-full bg-white transform -translate-x-1/2">
                <div className="h-full w-full bg-gray-100 rounded-tr-[100px]"></div>
            </div>
             <div className="absolute hidden md:block top-0 left-1/2 w-32 h-full transform -translate-x-full">
                <div className="h-full w-full bg-white rounded-tl-[100px]" style={{ backgroundColor: primaryColor }}></div>
            </div>

            <div className="relative z-10">
                <AppLogo className="mb-4 text-center text-3xl" useAcronym={true} />
                <h2 className="text-2xl font-bold text-center mb-2">{formType === 'login' ? 'Bienvenido de Vuelta' : 'Crea tu Cuenta'}</h2>
                <p className="text-muted-foreground text-center mb-8">{formType === 'login' ? 'Inicia sesión para continuar' : 'Únete a nuestra plataforma'}</p>
                {children}
            </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPageLayout;
