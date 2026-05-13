
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
    const platformLogo = settings?.logoUrl;

    return (
        <div className="p-0 font-sans text-black leading-relaxed bg-white">
            <style jsx global>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 15mm;
                    }
                    body {
                        counter-reset: page-counter;
                        background-color: white !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
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
                        border-top: 1px solid #000;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        font-size: 7.5pt;
                        color: #374151;
                        padding-top: 8px;
                        background: white;
                        font-weight: normal;
                    }
                    .page-number::after {
                        counter-increment: page-counter;
                        content: "Página " counter(page-counter);
                    }
                    h1, h2, h3 {
                        page-break-after: avoid;
                    }
                }
            `}</style>

            {/* --- PORTADA PROFESIONAL (Estilo Ingeniería) --- */}
            <div className="page-break flex flex-col items-center justify-between h-[275mm] py-20 text-center px-12">
                <div className="flex flex-col items-center gap-10 w-full">
                    {/* Logo arriba del todo */}
                    <div className="h-48 w-48 flex items-center justify-center">
                        {platformLogo ? (
                            <img 
                                src={platformLogo} 
                                alt="Logo" 
                                className="max-w-full max-h-full object-contain" 
                            />
                        ) : (
                            <div className="w-40 h-48 border-4 border-black flex items-center justify-center">
                                <span className="text-6xl font-black">STEM</span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <p className="text-[12pt] font-black tracking-[0.6em] text-gray-500 uppercase">
                            Plataforma de Gestión Educativa
                        </p>
                        <div className="h-1.5 w-32 bg-black mx-auto"></div>
                        <h1 className="text-[42pt] font-black tracking-tighter leading-none text-black uppercase py-4">
                            {platformTitle}
                        </h1>
                        <h2 className="text-[18pt] font-bold text-gray-600 max-w-3xl mx-auto border-t border-black pt-6">
                            MANUAL TÉCNICO ESTRUCTURAL Y <br/>
                            DOCUMENTACIÓN DE ARQUITECTURA DE DATOS
                        </h2>
                    </div>
                </div>

                <div className="w-full space-y-8 mt-auto">
                    <div className="text-center">
                        <p className="text-sm font-black uppercase text-gray-400 tracking-[0.3em] mb-4">Documentación Oficial del Sistema</p>
                        <div className="h-0.5 bg-black w-full opacity-10"></div>
                    </div>
                    
                    <div className="flex justify-between items-end px-4">
                        <div className="text-left space-y-1">
                            <p className="text-[9pt] font-black uppercase tracking-widest text-gray-400">Ingeniería y Desarrollo</p>
                            <p className="text-[11pt] font-bold uppercase">{platformCreators}</p>
                        </div>
                        <div className="text-right space-y-1">
                            <p className="text-[9pt] font-black uppercase tracking-widest text-gray-400">Fecha de Emisión</p>
                            <p className="text-[12pt] font-black uppercase">{format(today, 'MMMM yyyy', { locale: es })}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- ÍNDICE DINÁMICO --- */}
            <div className="page-break py-10 px-16">
                {/* Cabecera idéntica a los Sílabos */}
                <header className="flex items-center justify-between border-b-2 border-black pb-3 mb-10">
                    <div className="flex items-center gap-4">
                        {platformLogo && (
                            <img src={platformLogo} alt="Logo" className="w-[60px] h-[60px] object-contain" />
                        )}
                        <div>
                            <p className="font-bold text-[11pt] leading-tight text-black uppercase">{platformTitle}</p>
                            <p className="text-[7.5pt] tracking-widest text-gray-500 uppercase font-medium">Manual Técnico Institucional / V2.0</p>
                        </div>
                    </div>
                    <div className="text-right text-[8pt] font-bold uppercase text-black">
                        Sección de Contenidos
                    </div>
                </header>

                <div className="flex items-center gap-4 mb-16">
                    <div className="h-10 w-2.5 bg-black"></div>
                    <h2 className="text-[26pt] font-black uppercase tracking-tighter text-black">
                        ÍNDICE DEL MANUAL
                    </h2>
                </div>
                
                <div className="space-y-8 max-w-3xl">
                    {documents.map((doc, index) => (
                        <div key={doc.slug} className="flex items-end gap-6 group">
                            <span className="text-[18pt] font-black text-gray-200 w-12 italic">{(index + 1).toString().padStart(2, '0')}</span>
                            <div className="flex-1 border-b border-gray-100 pb-2">
                                <span className="text-[13pt] font-bold uppercase text-black tracking-tight">{doc.title}</span>
                            </div>
                            <span className="font-bold text-gray-400 text-sm whitespace-nowrap">SECCIÓN {index + 1}</span>
                        </div>
                    ))}
                </div>
                
                <div className="mt-40 p-10 bg-gray-50 rounded-lg border-l-[12px] border-black shadow-sm">
                    <p className="text-[10pt] font-black uppercase text-black mb-4 tracking-widest">Aviso de Confidencialidad</p>
                    <p className="text-[8.5pt] text-gray-600 leading-relaxed text-justify italic">
                        La información contenida en este manual detalla la arquitectura lógica, el modelo de datos y los protocolos de integración del sistema <strong>{platformTitle}</strong>. 
                        Este documento es propiedad intelectual de <strong>{platformCreators}</strong> y su reproducción total o parcial sin autorización expresa queda prohibida, 
                        considerándose información sensible para la seguridad tecnológica de las instituciones afiliadas.
                    </p>
                </div>
            </div>

            {/* --- CUERPO DEL MANUAL (Estilo Sílabos) --- */}
            {documents.map((doc, index) => (
                <div key={doc.slug} className="page-break py-10 px-16">
                    {/* Header Institucional en cada página */}
                    <header className="flex items-center justify-between border-b-2 border-black pb-3 mb-8">
                        <div className="flex items-center gap-4">
                            {platformLogo && (
                                <img src={platformLogo} alt="Logo" className="w-[55px] h-[55px] object-contain" />
                            )}
                            <div>
                                <p className="font-bold text-[10pt] leading-tight text-black uppercase">{platformTitle}</p>
                                <p className="text-[7pt] tracking-widest text-gray-500 uppercase font-medium">Documentación Estructural del Sistema</p>
                            </div>
                        </div>
                        <div className="bg-black text-white px-4 py-1.5 text-[8pt] font-black uppercase tracking-widest">
                            SECCIÓN {(index + 1).toString().padStart(2, '0')}
                        </div>
                    </header>
                    
                    <div className="min-h-[200mm] pt-4">
                        <MarkdownRenderer content={doc.content} />
                    </div>
                    
                    {/* Footer Limpio y Profesional */}
                    <footer className="print-footer">
                        <div className="flex flex-col gap-0.5">
                            <span className="uppercase text-[8pt] font-bold text-black tracking-tight">{platformTitle}</span>
                            <span className="text-[7pt] text-gray-400 italic font-medium">{platformContact}</span>
                        </div>
                        <div className="text-center text-gray-400 font-medium">
                            &copy; {currentYear} • {platformCreators}
                        </div>
                        <div className="page-number text-black font-bold border-l border-black pl-4 h-full flex items-center"></div>
                    </footer>
                </div>
            ))}
        </div>
    );
}

