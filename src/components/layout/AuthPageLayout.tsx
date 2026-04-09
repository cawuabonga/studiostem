
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

const DEFAULT_LOGIN_IMAGE = "https://picsum.photos/seed/education/800/1200";

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
        
        {/* Panel Izquierdo - Imagen con respaldo */}
        <div className="hidden md:block relative p-8 text-white" style={{ backgroundColor: design?.backgroundColor || '#1e3a8a' }}>
            <Image 
              src={design?.imageUrl || DEFAULT_LOGIN_IMAGE}
              alt="Imagen de fondo del login"
              fill
              className="object-cover"
              priority
              data-ai-hint="university login"
            />
            {/* Overlay sutil para mejorar legibilidad si hubiera texto sobre la imagen */}
            <div className="absolute inset-0 bg-black/20" />
        </div>

        {/* Panel Derecho - Formulario */}
        <div className="w-full h-full flex flex-col justify-center p-8 sm:p-12 overflow-y-auto">
            <div className={cn(
              'mb-8',
              design?.textAlign === 'center' && 'text-center',
              design?.textAlign === 'right' && 'text-right'
            )}>
              <h1 className={cn("font-bold font-headline text-gray-800", design?.titleSize || 'text-3xl')}>
                {design?.title || 'SISTEMA TECNOLÓGICO DE EDUCACIÓN MODULAR'}
              </h1>
              <p className={cn("text-muted-foreground mt-2", design?.sloganSize || 'text-lg')}>
                {design?.slogan || 'Plataforma Educativa'}
              </p>
            </div>
            
            {children}
            
             {institutes.length > 0 && (
              <div className="mt-12 text-center">
                <p className="text-sm font-semibold text-gray-500 mb-4">INSTITUCIONES AFILIADAS</p>
                <TooltipProvider>
                  <div className="flex justify-center items-center gap-6 flex-wrap">
                    {institutes.map((institute, index) => (
                      <Tooltip key={institute.id || `inst-${index}`}>
                        <TooltipTrigger asChild>
                           <div className="cursor-pointer">
                            <Image 
                                src={institute.logoUrl || `https://placehold.co/60x60.png?text=${institute.name.substring(0, 2).toUpperCase()}`} 
                                alt={institute.name}
                                width={48}
                                height={48}
                                className="h-12 w-12 object-contain rounded-md bg-gray-100 p-1 grayscale hover:grayscale-0 transition-all"
                              />
                           </div>
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
