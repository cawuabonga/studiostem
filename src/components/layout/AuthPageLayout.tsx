"use client";

import React, { useEffect, useState } from 'react';
import { getLoginDesignSettings } from '@/config/firebase';
import type { LoginDesign } from '@/types';
import { cn } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import { useRouter } from 'next/navigation';
import AppLogo from '../common/AppLogo';
import Image from 'next/image';

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
       <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
         <Skeleton className="h-[650px] w-full max-w-4xl" />
       </div>
    )
  }
  
  const primaryColor = design?.backgroundColor || '#1E3A8A';

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl h-[650px] flex shadow-2xl rounded-lg overflow-hidden">
        
        {/* Left Panel */}
        <div className="w-1/2 h-full hidden md:flex flex-col justify-between p-12 text-white relative" style={{ backgroundColor: primaryColor }}>
            {design?.imageUrl && (
              <Image 
                src={design.imageUrl}
                alt="Imagen de fondo del login"
                fill
                className="object-cover opacity-20"
              />
            )}
            <div className="relative z-10">
                <h1 className="text-4xl font-bold font-headline">STEM</h1>
                <p className="text-lg mt-2">Sistema Tecnológico de Educación Modular</p>
            </div>
           
             <div className="relative z-10">
                <p className="text-lg font-bold">¡Bienvenido!</p>
                <p className="text-sm text-white/80 mt-2">
                    Gestiona tu educación, accede a tus cursos y mantente conectado con tu instituto.
                </p>
            </div>
        </div>

        {/* Right Panel */}
        <div className="w-full md:w-1/2 h-full bg-white flex flex-col justify-center p-8 md:p-12">
            <AppLogo className="mb-4 text-2xl" />
            <h2 className="text-3xl font-bold font-headline text-gray-800">{formType === 'login' ? 'Bienvenido de Vuelta' : 'Crea tu Cuenta'}</h2>
            <p className="text-muted-foreground mt-2 mb-8">
                {formType === 'login' ? (
                    <>¿No tienes una cuenta? <Button variant="link" className="p-0 h-auto" onClick={() => router.push('/register')}>Crea una ahora.</Button></>
                ) : (
                    <>¿Ya tienes una cuenta? <Button variant="link" className="p-0 h-auto" onClick={() => router.push('/')}>Inicia sesión.</Button></>
                )}
            </p>
            {children}
        </div>
      </div>
    </div>
  );
};

export default AuthPageLayout;
