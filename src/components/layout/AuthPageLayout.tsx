

"use client";

import React, { useEffect, useState } from 'react';
import { getLoginDesignSettings, getInstitutes } from '@/config/firebase';
import type { LoginDesign, Institute } from '@/types';
import { cn } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface AuthPageLayoutProps {
  children: React.ReactNode;
  formType: 'login' | 'register';
}

const AuthPageLayout: React.FC<AuthPageLayoutProps> = ({ children, formType }) => {
  const [design, setDesign] = useState<LoginDesign | null>(null);
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const [settings, instituteData] = await Promise.all([
          getLoginDesignSettings(),
          getInstitutes()
        ]);
        setDesign(settings);
        setInstitutes(instituteData);
      } catch (error) {
        console.error("Error fetching initial auth page data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);
  
  if (loading) {
    return (
       <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
         <Skeleton className="h-[750px] w-full max-w-6xl" />
       </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl min-h-[750px] grid md:grid-cols-2 shadow-2xl rounded-lg overflow-hidden bg-white">
        
        {/* Left Panel - Image */}
        <div className="hidden md:block relative">
            {design?.imageUrl && (
              <Image 
                src={design.imageUrl}
                alt="Imagen de fondo del login"
                fill
                className="object-cover"
                priority
              />
            )}
        </div>

        {/* Right Panel - Form */}
        <div className="w-full h-full flex flex-col justify-center p-8 sm:p-12 overflow-y-auto">
            <h1 className="text-3xl font-bold font-headline text-gray-800">{design?.title || 'SISTEMA TECNOLÓGICO DE EDUCACIÓN MODULAR'}</h1>
            <p className="text-muted-foreground text-lg mt-2 mb-8">{design?.slogan || 'Plataforma Educativa'}</p>
            {children}
             <div className="text-center text-sm text-muted-foreground mt-6">
                {formType === 'login' ? (
                    <>¿No tienes una cuenta? <Button variant="link" className="p-0 h-auto" onClick={() => router.push('/register')}>Crea una ahora.</Button></>
                ) : (
                    <>¿Ya tienes una cuenta? <Button variant="link" className="p-0 h-auto" onClick={() => router.push('/')}>Inicia sesión.</Button></>
                )}
            </div>
            
             {institutes.length > 0 && (
              <div className="mt-12 text-center">
                <p className="text-sm font-semibold text-gray-500 mb-4">INSTITUCIONES AFILIADAS</p>
                <TooltipProvider>
                  <div className="flex justify-center items-center gap-6 flex-wrap">
                    {institutes.map(institute => (
                      <Tooltip key={institute.id}>
                        <TooltipTrigger>
                           <Image 
                              src={institute.logoUrl || `https://placehold.co/60x60.png?text=${institute.abbreviation}`} 
                              alt={institute.name}
                              width={48}
                              height={48}
                              className="h-12 w-12 object-contain rounded-md bg-gray-100 p-1 grayscale hover:grayscale-0 transition-all"
                            />
                        </TooltipTrigger>
                         <TooltipContent>
                          <p>{institute.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </TooltipProvider>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default AuthPageLayout;
