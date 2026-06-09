"use client";

import React, { useEffect, useState } from 'react';
import { getLoginDesignSettings, getInstitutes, getInstitute } from '@/config/firebase';
import type { LoginDesign, Institute } from '@/types';
import { cn, hslToHex } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';
import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { HelpCircle } from 'lucide-react';

const DEFAULT_LOGIN_IMAGE = "https://picsum.photos/seed/education/800/1200";

interface AuthPageLayoutProps {
  children: React.ReactNode;
  formType: 'login' | 'register';
  instituteId?: string; // Prop opcional para branding institucional
}

const AuthPageLayout: React.FC<AuthPageLayoutProps> = ({ children, formType, instituteId }) => {
  const [design, setDesign] = useState<LoginDesign | null>(null);
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetInstitute, setTargetInstitute] = useState<Institute | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const [settings, allInstitutes] = await Promise.all([
          getLoginDesignSettings(),
          getInstitutes()
        ]);
        setDesign(settings);
        setInstitutes(allInstitutes);

        // Si hay un instituteId, buscamos sus datos específicos para el branding
        if (instituteId) {
            const inst = await getInstitute(instituteId);
            if (inst) {
                setTargetInstitute(inst);
            }
        }

        // Actualizar Favicon si existe un logo (Prioridad al del instituto si estamos en su login)
        const logoToUse = (instituteId && targetInstitute?.logoUrl) ? targetInstitute.logoUrl : settings?.logoUrl;
        if (logoToUse) {
            const link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
            if (link) {
                link.href = logoToUse;
            }
        }
      } catch (error) {
        console.error("Error fetching initial auth page data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [instituteId]);
  
  if (loading) {
    return (
       <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
         <Skeleton className="h-[750px] w-full max-w-6xl rounded-2xl" />
       </div>
    )
  }

  // Lógica de BRANDING DINÁMICO
  const isInstitutional = !!targetInstitute;
  
  const backgroundImageUrl = design?.imageUrl || DEFAULT_LOGIN_IMAGE;
  
  // Si es institucional, usamos su color primario; si no, el de la configuración global
  const overlayColor = isInstitutional && targetInstitute?.primaryColor 
    ? hslToHex(targetInstitute.primaryColor) 
    : (design?.backgroundColor || '#1e3a8a');

  const textColor = design?.textColor || '#ffffff';

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl min-h-[750px] grid md:grid-cols-2 shadow-2xl rounded-3xl overflow-hidden bg-white border border-gray-200">
        
        {/* Panel Izquierdo - Imagen y Marca */}
        <div className="hidden md:block relative overflow-hidden" style={{ backgroundColor: overlayColor }}>
            <Image 
              src={backgroundImageUrl}
              alt="Fondo Institucional"
              fill
              className="object-cover opacity-40 mix-blend-overlay"
              priority
              data-ai-hint="university campus"
            />
            {/* Capa de gradiente para legibilidad */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
            
            {/* Información del Instituto (Solo si es login institucional) */}
            {isInstitutional && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center text-white z-10">
                    <div className="bg-white/10 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/20 shadow-2xl animate-in zoom-in-95 duration-700">
                        {targetInstitute.logoUrl && (
                            <div className="relative h-32 w-32 mx-auto mb-6">
                                <Image src={targetInstitute.logoUrl} alt="Logo Inst" fill className="object-contain" />
                            </div>
                        )}
                        <h2 className="text-2xl font-black uppercase tracking-tight leading-tight">
                            Portal de Acceso
                        </h2>
                        <p className="mt-2 text-white/80 font-bold uppercase tracking-widest text-sm">
                            {targetInstitute.name}
                        </p>
                    </div>
                </div>
            )}

            {/* Overlay de información global (Solo año si existe) */}
            {design?.creationYear && (
                <div className={cn(
                    "absolute bottom-12 left-12 right-12 z-10",
                    design?.textAlign === 'center' ? 'text-center' : design?.textAlign === 'right' ? 'text-right' : 'text-left'
                )} style={{ color: textColor }}>
                    <p className="text-[10px] uppercase font-black tracking-[0.3em] opacity-40">
                        EST. {design.creationYear}
                    </p>
                </div>
            )}
        </div>

        {/* Panel Derecho - Formulario */}
        <div className="w-full h-full flex flex-col p-8 sm:p-16 relative">
            
            {/* Logo Dinámico en el formulario */}
            <div className="mb-6 flex justify-center w-full">
              {isInstitutional && targetInstitute.logoUrl ? (
                  <div className="relative h-24 w-64 animate-in fade-in zoom-in duration-1000">
                      <Image src={targetInstitute.logoUrl} alt="Institute Logo" fill className="object-contain object-center" />
                  </div>
              ) : design?.logoUrl ? (
                <div className="relative h-24 w-64 animate-in fade-in zoom-in duration-1000">
                    <Image src={design.logoUrl} alt="Platform Logo" fill className="object-contain object-center" />
                </div>
              ) : (
                <div className="bg-primary/10 p-4 rounded-2xl">
                    <span className="text-3xl font-black text-primary tracking-tighter">STEM V2</span>
                </div>
              )}
            </div>

            {/* Título Dinámico */}
            <div className="text-center mb-10 space-y-2 animate-in fade-in slide-in-from-top-4 duration-1000">
                <h1 className={cn(
                    "font-black font-headline tracking-tighter text-primary uppercase",
                    design?.titleSize || "text-3xl"
                )}>
                    {isInstitutional ? targetInstitute.name : (design?.title || "STEM V2")}
                </h1>
                <p className={cn(
                    "text-muted-foreground font-medium",
                    design?.sloganSize || "text-lg"
                )}>
                    {isInstitutional ? "Identifícate para acceder a tu campus virtual." : (design?.slogan || "Gestión Educativa Modular.")}
                </p>
            </div>
            
            <div className="flex-1">
                {children}
            </div>

            {/* Footer */}
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
                    
                    {institutes.length > 0 && !isInstitutional && (
                        <TooltipProvider>
                            <div className="flex -space-x-3 overflow-hidden p-1">
                                {institutes.slice(0, 5).map((inst) => (
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
