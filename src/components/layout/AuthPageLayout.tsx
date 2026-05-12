
"use client";

import React, { useEffect, useState } from 'react';
import { getLoginDesignSettings, getInstitutes } from '@/config/firebase';
import type { LoginDesign, Institute } from '@/types';
import { cn } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';
import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Info, HelpCircle } from 'lucide-react';

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

        // Actualizar Favicon si existe un logo
        if (settings?.logoUrl) {
            const link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
            if (link) {
                link.href = settings.logoUrl;
            }
        }
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

  const backgroundImageUrl = design?.imageUrl || DEFAULT_LOGIN_IMAGE;
  const overlayColor = design?.backgroundColor || '#1e3a8a';
  const textColor = design?.textColor || '#ffffff';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl min-h-[750px] grid md:grid-cols-2 shadow-2xl rounded-2xl overflow-hidden bg-white border border-gray-100">
        
        {/* Panel Izquierdo - Imagen y Mensaje Dinámico */}
        <div className="hidden md:block relative overflow-hidden" style={{ backgroundColor: overlayColor }}>
            <Image 
              src={backgroundImageUrl}
              alt="Fondo Institucional"
              fill
              className="object-cover opacity-80"
              priority
              data-ai-hint="campus university"
            />
            {/* Capa de degradado para legibilidad */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            
            <div className={cn(
                "absolute bottom-12 left-12 right-12 z-10",
                design?.textAlign === 'center' ? 'text-center' : design?.textAlign === 'right' ? 'text-right' : 'text-left'
            )} style={{ color: textColor }}>
                <h2 className={cn("font-black font-headline drop-shadow-xl leading-tight", design?.titleSize || 'text-3xl')}>
                    {design?.title || ''}
                </h2>
                <p className={cn("opacity-90 drop-shadow-lg mt-4 font-medium", design?.sloganSize || 'text-lg')}>
                    {design?.slogan || ''}
                </p>
                {design?.creationYear && (
                    <p className="mt-8 text-[10px] uppercase font-black tracking-[0.3em] opacity-40">
                        EST. {design.creationYear}
                    </p>
                )}
            </div>
        </div>

        {/* Panel Derecho - Formulario y Logo */}
        <div className="w-full h-full flex flex-col p-8 sm:p-16 relative">
            
            {/* Logo de Plataforma */}
            <div className={cn(
              'mb-10 flex',
              design?.textAlign === 'center' ? 'justify-center' : design?.textAlign === 'right' ? 'justify-end' : 'justify-start'
            )}>
              {design?.logoUrl ? (
                <div className="relative h-20 w-48 animate-in fade-in zoom-in duration-1000">
                    <Image src={design.logoUrl} alt="Platform Logo" fill className="object-contain object-left" />
                </div>
              ) : (
                <div className="bg-primary/10 p-3 rounded-xl">
                    <span className="text-2xl font-black text-primary tracking-tighter">STEM V2</span>
                </div>
              )}
            </div>

            <div className={cn(
              'mb-8',
              design?.textAlign === 'center' && 'text-center',
              design?.textAlign === 'right' && 'text-right'
            )}>
              <h1 className="font-black font-headline text-gray-900 text-3xl tracking-tighter uppercase">
                Bienvenido al Sistema
              </h1>
              <p className="text-muted-foreground mt-2 font-medium">
                Gestión Educativa Modular de Alto Rendimiento
              </p>
            </div>
            
            <div className="flex-1">
                {children}
            </div>

            {/* Información de Contacto y Créditos */}
            <footer className="mt-12 space-y-6 pt-6 border-t border-gray-100">
                {design?.contactInfo && (
                    <div className="flex items-center gap-3 bg-primary/5 p-3 rounded-lg border border-primary/10">
                        <HelpCircle className="h-4 w-4 text-primary shrink-0" />
                        <p className="text-[11px] font-bold text-primary leading-tight">
                            {design.contactInfo}
                        </p>
                    </div>
                )}
                
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        {design?.creationYear && <span>© {design.creationYear} </span>}
                        {design?.creators && <span>{design.creators.toUpperCase()}</span>}
                    </div>
                    
                    {institutes.length > 0 && (
                        <TooltipProvider>
                            <div className="flex -space-x-3 overflow-hidden p-1">
                                {institutes.slice(0, 5).map((inst, index) => (
                                    <Tooltip key={inst.id}>
                                        <TooltipTrigger asChild>
                                            <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-white shadow-sm overflow-hidden cursor-help hover:z-10 transition-transform hover:scale-110">
                                                <Image 
                                                    src={inst.logoUrl || `https://placehold.co/40x40.png?text=${inst.name[0]}`} 
                                                    alt={inst.name}
                                                    width={32}
                                                    height={32}
                                                    className="object-contain h-full w-full"
                                                />
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent><p className="text-xs font-bold">{inst.name}</p></TooltipContent>
                                    </Tooltip>
                                ))}
                                {institutes.length > 5 && (
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gray-100 text-[10px] font-black text-gray-500">
                                        +{institutes.length - 5}
                                    </div>
                                )}
                            </div>
                        </TooltipProvider>
                    )}
                </div>
            </footer>
        </div>
      </div>
    </div>
  );
};

export default AuthPageLayout;

