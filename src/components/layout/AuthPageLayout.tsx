
"use client";

import React, { useEffect, useState } from 'react';
import { getLoginDesignSettings, getInstitutes } from '@/config/firebase';
import type { LoginDesign, Institute } from '@/types';
import { cn } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';
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
         <Skeleton className="h-[750px] w-full max-w-6xl rounded-lg" />
       </div>
    )
  }

  // Prioridad total a la imagen administrada. Solo usa fallback si está vacío.
  const backgroundImageUrl = design?.imageUrl || DEFAULT_LOGIN_IMAGE;
  const overlayColor = design?.backgroundColor || '#1e3a8a';

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl min-h-[750px] grid md:grid-cols-2 shadow-2xl rounded-lg overflow-hidden bg-white">
        
        {/* Panel Izquierdo - Imagen Dinámica Administrada */}
        <div className="hidden md:block relative overflow-hidden" style={{ backgroundColor: overlayColor }}>
            <Image 
              src={backgroundImageUrl}
              alt="Fondo Institucional Personalizado"
              fill
              className="object-cover"
              priority
              data-ai-hint="campus university"
            />
            {/* Capa de superposición para mejorar contraste si hay texto */}
            <div className="absolute inset-0 bg-black/30" />
            
            <div className="absolute bottom-10 left-10 right-10 z-10 text-white">
                <h2 className="text-2xl font-bold font-headline drop-shadow-md">{design?.title || ''}</h2>
                <p className="text-sm opacity-90 drop-shadow-sm">{design?.slogan || ''}</p>
            </div>
        </div>

        {/* Panel Derecho - Formulario y Contenido */}
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
                {design?.slogan || 'Plataforma de Gestión Educativa'}
              </p>
            </div>
            
            {children}
            
             {institutes.length > 0 && (
              <div className="mt-12 text-center">
                <p className="text-[10px] font-bold tracking-widest text-gray-400 mb-6 uppercase">INSTITUCIONES AFILIADAS</p>
                <TooltipProvider>
                  <div className="flex justify-center items-center gap-6 flex-wrap">
                    {institutes.map((inst, index) => (
                      <Tooltip key={inst.id || `inst-${index}`}>
                        <TooltipTrigger asChild>
                           <div className="cursor-pointer">
                            <Image 
                                src={inst.logoUrl || `https://placehold.co/60x60.png?text=${inst.name.substring(0, 2).toUpperCase()}`} 
                                alt={inst.name}
                                width={48}
                                height={48}
                                className="h-10 w-10 object-contain rounded-md grayscale hover:grayscale-0 transition-all opacity-60 hover:opacity-100"
                              />
                           </div>
                        </TooltipTrigger>
                         <TooltipContent>
                          <p>{inst.name}</p>
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
