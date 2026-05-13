"use client";

import React, { useState, useEffect } from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getLoginDesignSettings } from '@/config/firebase';
import type { LoginDesign } from '@/types';
import { Skeleton } from '../ui/skeleton';

interface Doc {
    slug: string;
    title: string;
    content: string;
}

interface DocumentationPrintLayoutProps {
    documents: Doc[];
}

export function DocumentationPrintLayout({ documents }: DocumentationPrintLayoutProps) {
    const [settings, setSettings] = useState<LoginDesign | null>(null);
    const [loading, setLoading] = useState(true);
    const today = new Date();
    const currentYear = today.getFullYear();

    useEffect(() => {
        getLoginDesignSettings().then(data => {
            setSettings(data);
            setLoading(false);
        });
    }, []);

    if (loading) {
        return (
            <div className="p-20 space-y-10">
                <Skeleton className="h-20 w-3/4 mx-auto" />
                <Skeleton className="h-[400px] w-full" />
                <Skeleton className="h-10 w-1/2" />
            </div>
        );
    }

    const platformTitle = settings?.title || "STEM V2";
    const platformCreators = settings?.creators || "Equipo de Desarrollo";
    const platformContact = settings?.contactInfo || "";

    return (
        <div className="p-0 font-sans text-black leading-relaxed bg-white">
            <style jsx global>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 20mm;
                    }
                    body {
                        counter-reset: page-counter;
                        background-color: white !important;
                    }
                    .page-break {
                        page-break-after: always;
                        position: relative;
                        background-color: white !important;
                    }
                    .print-footer {
                        position: fixed;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        height: 40px;
                        border-top: 1px solid #e5e7eb;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        font-size: 8pt;
                        color: #4b5563;
                        padding-top: 10px;
                        background: white;
                    }
                    .page-number::after {
                        counter-increment: page-counter;
                        content: "Página " counter(page-counter);
                    }
                }
            `}</style>

            {/* --- PORTADA --- */}
            <div className="page-break flex flex-col items-center justify-between h-[275mm] py-20 text-center">
                {/* Logo Institucional arriba del título */}
                <div className="flex flex-col items-center gap-6">
                    {settings?.logoUrl ? (
                        <img 
                            src={settings.logoUrl} 
                            alt="Logo" 
                            className="w-[180px] h-[180px] object-contain" 
                        />
                    ) : (
                        <div className="relative w-48 h-48 bg-gray-50 rounded-full flex items-center justify-center border-4 border-black">
                            <span className="text-[60pt] font-black">{platformTitle.charAt(0)}</span>
                        </div>
                    )}
                </div>

                <div className="space-y-8 px-10 mt-12">
                    <div className="text-[12pt] font-black tracking-[0.5em] text-primary uppercase">
                        Plataforma de Gestión Educativa
                    </div>
                    <div className="h-1 w-24 bg-black mx-auto"></div>
                    <h1 className="text-[40pt] font-black tracking-tighter leading-none text-black uppercase">
                        {platformTitle}
                    </h1>
                    <h2 className="text-[18pt] font-bold text-gray-700 max-w-2xl mx-auto px-12 mt-6">
                        MANUAL TÉCNICO Y DOCUMENTACIÓN ESTRUCTURAL DEL SISTEMA
                    </h2>
                </div>

                <div className="space-y-6 w-full max-w-xl mt-auto">
                    <p className="text-sm font-bold text-gray-400 tracking-[0.2em] uppercase mb-8">Documentación Oficial</p>
                    <div className="h-px bg-black w-full opacity-20"></div>
                    <div className="flex justify-between items-end px-4">
                        <div className="text-left space-y-1">
                            <p className="text-[9pt] font-black uppercase tracking-widest text-gray-400">Desarrollado por</p>
                            <p className="text-[11pt] font-bold uppercase">{platformCreators}</p>
                        </div>
                        <div className="text-right space-y-1">
                            <p className="text-[9pt] font-black uppercase tracking-widest text-gray-400">Fecha de Emisión</p>
                            <p className="text-[12pt] font-black uppercase">{format(today, 'MMMM yyyy', { locale: es })}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- ÍNDICE --- */}
            <div className="page-break py-12 px-16">
                {/* Header con Logo a partir de pág 2 */}
                <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-10">
                    <div className="flex items-center gap-3">
                        {settings?.logoUrl && <img src={settings.logoUrl} className="h-8 w-8 object-contain" />}
                        <span className="text-[8pt] font-black text-gray-400 uppercase tracking-[0.2em]">Manual Técnico {platformTitle}</span>
                    </div>
                </div>

                <div className="flex items-center gap-4 mb-12">
                    <div className="h-10 w-2 bg-primary"></div>
                    <h2 className="text-[24pt] font-black uppercase tracking-tighter text-black">
                        Contenido del Manual
                    </h2>
                </div>
                
                <div className="space-y-6">
                    {documents.map((doc, index) => (
                        <div key={doc.slug} className="flex items-end gap-4">
                            <span className="text-[14pt] font-black text-gray-300">{(index + 1).toString().padStart(2, '0')}</span>
                            <div className="flex-1 border-b-2 border-dotted border-gray-200 pb-1">
                                <span className="text-[12pt] font-bold uppercase text-black">{doc.title}</span>
                            </div>
                            <span className="font-bold text-gray-400">Sección {index + 1}</span>
                        </div>
                    ))}
                </div>
                
                <div className="mt-32 p-8 bg-slate-50 rounded-2xl border-l-8 border-primary shadow-inner">
                    <p className="text-sm font-black uppercase text-primary mb-3 tracking-widest">Nota de Confidencialidad</p>
                    <p className="text-xs text-gray-600 leading-relaxed">
                        Este documento contiene información técnica privada sobre la arquitectura de la plataforma <strong>{platformTitle}</strong>. 
                        Su distribución está restringida a personal autorizado de nivel Super Administrador y equipos de ingeniería.
                        La propiedad intelectual del sistema pertenece a <strong>{platformCreators}</strong>.
                    </p>
                </div>
            </div>

            {/* --- CUERPO DEL MANUAL --- */}
            {documents.map((doc, index) => (
                <div key={doc.slug} className="page-break py-12 px-16">
                    {/* Header de sección con Logo */}
                    <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-10">
                        <div className="flex items-center gap-3">
                            {settings?.logoUrl && <img src={settings.logoUrl} className="h-8 w-8 object-contain" />}
                            <span className="text-[8pt] font-black text-gray-400 uppercase tracking-[0.2em]">Manual Técnico {platformTitle}</span>
                        </div>
                        <span className="text-[8pt] font-black text-primary px-3 py-1 bg-primary/5 rounded-full uppercase">SECCIÓN {(index + 1).toString().padStart(2, '0')}</span>
                    </div>
                    
                    <div className="min-h-[200mm]">
                        <MarkdownRenderer content={doc.content} />
                    </div>
                    
                    {/* Footer dinámico por página - Sin negrita para mejor apreciación */}
                    <footer className="print-footer font-normal">
                        <div className="flex flex-col">
                            <span className="uppercase tracking-tighter text-black font-semibold">{platformTitle}</span>
                            <span className="text-[7pt] italic text-gray-500">{platformContact}</span>
                        </div>
                        <div className="text-center text-gray-500">
                            © {currentYear} {platformCreators}
                        </div>
                        <div className="page-number text-primary font-semibold"></div>
                    </footer>
                </div>
            ))}
        </div>
    );
}
