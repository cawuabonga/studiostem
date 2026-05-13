
"use client";

import React, { useState, useEffect } from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getLoginDesignSettings } from '@/config/firebase';
import type { LoginDesign } from '@/types';

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
        const loadAndPrint = async () => {
            try {
                const data = await getLoginDesignSettings();
                setSettings(data);
                setLoading(false);
                
                // Esperamos un breve momento para asegurar que las imágenes (logo) se carguen en el DOM
                // y que React haya terminado de pintar el contenido real.
                setTimeout(() => {
                    window.print();
                }, 1500);
            } catch (error) {
                console.error("Error loading print settings:", error);
                setLoading(false);
            }
        };

        loadAndPrint();
    }, []);

    // No mostramos nada mientras carga para evitar que se imprima el estado de carga
    if (loading) return null;

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
                        display: block;
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

            {/* --- PÁGINA 1: PORTADA FORMAL --- */}
            <div className="page-break flex flex-col items-center justify-between h-[275mm] py-20 text-center px-12">
                <div className="flex flex-col items-center gap-10 w-full">
                    <div className="h-48 w-48 flex items-center justify-center">
                        {platformLogo ? (
                            <img 
                                src={platformLogo} 
                                alt="Logo" 
                                className="max-w-full max-h-full object-contain" 
                            />
                        ) : (
                            <div className="w-40 h-40 border-4 border-black flex items-center justify-center">
                                <span className="text-5xl font-black">STEM</span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <p className="text-[12pt] font-black tracking-[0.5em] text-gray-400 uppercase">
                            Plataforma de Gestión Educativa
                        </p>
                        <div className="h-1.5 w-32 bg-black mx-auto"></div>
                        <h1 className="text-[38pt] font-black tracking-tighter leading-none text-black uppercase py-4">
                            {platformTitle}
                        </h1>
                        <h2 className="text-[18pt] font-bold text-gray-600 max-w-3xl mx-auto border-t border-black pt-6">
                            MANUAL TÉCNICO ESTRUCTURAL Y <br/>
                            DOCUMENTACIÓN DE ARQUITECTURA DE DATOS
                        </h2>
                    </div>
                </div>

                <div className="w-full space-y-8 mt-auto">
                    <div className="flex justify-between items-end px-4 border-t-2 border-black pt-8">
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

            {/* --- PÁGINA 2: ÍNDICE --- */}
            <div className="page-break py-10 px-16">
                <header className="flex items-center justify-between border-b-2 border-black pb-3 mb-10">
                    <div className="flex items-center gap-4">
                        {platformLogo && (
                            <img src={platformLogo} alt="Logo" className="w-[50px] h-[50px] object-contain" />
                        )}
                        <div>
                            <p className="font-bold text-[10pt] leading-tight text-black uppercase">{platformTitle}</p>
                            <p className="text-[7pt] tracking-widest text-gray-500 uppercase">Manual Técnico Institucional</p>
                        </div>
                    </div>
                    <div className="text-right text-[7.5pt] font-bold uppercase text-black">
                        Sección de Contenidos
                    </div>
                </header>

                <div className="flex items-center gap-4 mb-16">
                    <div className="h-10 w-2.5 bg-black"></div>
                    <h2 className="text-[24pt] font-black uppercase tracking-tighter text-black">
                        ÍNDICE GENERAL
                    </h2>
                </div>
                
                <div className="space-y-8 max-w-3xl">
                    {documents.map((doc, index) => (
                        <div key={doc.slug} className="flex items-end gap-6">
                            <span className="text-[16pt] font-black text-gray-300 w-10 italic">{(index + 1).toString().padStart(2, '0')}</span>
                            <div className="flex-1 border-b border-gray-100 pb-2">
                                <span className="text-[12pt] font-bold uppercase text-black tracking-tight">{doc.title}</span>
                            </div>
                            <span className="font-bold text-gray-400 text-xs uppercase">Sección {index + 1}</span>
                        </div>
                    ))}
                </div>
                
                <div className="mt-40 p-8 bg-gray-50 rounded-lg border-l-[10px] border-black shadow-sm">
                    <p className="text-[9pt] font-black uppercase text-black mb-3 tracking-widest">Aviso de Confidencialidad</p>
                    <p className="text-[8pt] text-gray-600 leading-relaxed text-justify italic">
                        La información contenida en este manual detalla la arquitectura lógica, el modelo de datos y los protocolos de integración del sistema <strong>{platformTitle}</strong>. 
                        Este documento es propiedad intelectual y su reproducción total o parcial sin autorización expresa queda prohibida.
                    </p>
                </div>
            </div>

            {/* --- CUERPO DEL MANUAL --- */}
            {documents.map((doc, index) => (
                <div key={doc.slug} className="page-break py-10 px-16">
                    <header className="flex items-center justify-between border-b-2 border-black pb-3 mb-8">
                        <div className="flex items-center gap-4">
                            {platformLogo && (
                                <img src={platformLogo} alt="Logo" className="w-[50px] h-[50px] object-contain" />
                            )}
                            <div>
                                <p className="font-bold text-[10pt] leading-tight text-black uppercase">{platformTitle}</p>
                                <p className="text-[7pt] tracking-widest text-gray-500 uppercase">Documentación Estructural</p>
                            </div>
                        </div>
                        <div className="bg-black text-white px-3 py-1 text-[7.5pt] font-black uppercase tracking-widest">
                            SECCIÓN {(index + 1).toString().padStart(2, '0')}
                        </div>
                    </header>
                    
                    <div className="min-h-[200mm] pt-4">
                        <MarkdownRenderer content={doc.content} />
                    </div>
                    
                    <footer className="print-footer">
                        <div className="flex flex-col gap-0.5">
                            <span className="uppercase text-[7.5pt] font-bold text-black tracking-tight">{platformTitle}</span>
                            <span className="text-[6.5pt] text-gray-400 italic font-medium">{platformContact}</span>
                        </div>
                        <div className="text-center text-gray-400 font-medium text-[7.5pt]">
                            &copy; {currentYear} • {platformCreators}
                        </div>
                        <div className="page-number text-black font-bold border-l border-black pl-4 h-full flex items-center"></div>
                    </footer>
                </div>
            ))}
        </div>
    );
}
