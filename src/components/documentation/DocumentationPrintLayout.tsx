
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
                
                // Esperamos un momento para asegurar que el logo y fuentes se carguen
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

    if (loading) return null;

    const platformTitle = settings?.title || "STEM V2";
    const platformCreators = settings?.creators || "Equipo de Desarrollo";
    const platformContact = settings?.contactInfo || "";
    const platformLogo = settings?.logoUrl;

    return (
        <div className="p-0 font-sans text-black leading-relaxed bg-white">
            <style jsx global>{`
                @media screen {
                    .print-only-container {
                        max-width: 210mm;
                        margin: 20px auto;
                        box-shadow: 0 0 20px rgba(0,0,0,0.1);
                    }
                }
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 20mm 15mm 20mm 15mm;
                    }
                    body {
                        counter-reset: page;
                        background-color: white !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .page-break {
                        page-break-after: always;
                        position: relative;
                        background-color: white !important;
                        display: block;
                        /* Cada sección incrementa el contador de página */
                        counter-increment: page;
                        min-height: 250mm;
                    }
                    .print-footer {
                        position: fixed;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        height: 30px;
                        border-top: 1px solid #e5e7eb;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        font-size: 7pt;
                        color: #6b7280;
                        padding-top: 5px;
                        background: white;
                    }
                    /* Numeración dinámica */
                    .page-number-display::after {
                        content: "Página " counter(page);
                    }
                    h1, h2, h3 {
                        page-break-after: avoid;
                    }
                }
            `}</style>

            <div className="print-only-container">
                {/* --- PÁGINA 1: PORTADA FORMAL --- */}
                <div className="page-break flex flex-col items-center justify-between py-20 text-center px-12">
                    <div className="flex flex-col items-center gap-12 w-full">
                        {/* Frase de encabezado solicitada: Antes del logo */}
                        <p className="text-[12pt] font-black tracking-[0.6em] text-gray-400 uppercase mb-4">
                            PLATAFORMA DE GESTIÓN EDUCATIVA
                        </p>

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

                        <div className="space-y-6 w-full">
                            <div className="h-1 w-32 bg-black mx-auto mb-8"></div>
                            <h1 className="text-[36pt] font-black tracking-tighter leading-[1.1] text-black uppercase py-4">
                                {platformTitle}
                            </h1>
                            <h2 className="text-[16pt] font-bold text-gray-600 max-w-2xl mx-auto border-t border-gray-200 pt-8 mt-4">
                                MANUAL TÉCNICO ESTRUCTURAL Y <br/>
                                DOCUMENTACIÓN DE ARQUITECTURA DE DATOS
                            </h2>
                        </div>
                    </div>

                    <div className="w-full space-y-8 mt-auto">
                        <div className="flex justify-between items-end px-4 border-t-2 border-black pt-8">
                            <div className="text-left space-y-1">
                                <p className="text-[8pt] font-black uppercase tracking-widest text-gray-400">Ingeniería y Desarrollo</p>
                                <p className="text-[10pt] font-bold uppercase">{platformCreators}</p>
                            </div>
                            <div className="text-right space-y-1">
                                <p className="text-[8pt] font-black uppercase tracking-widest text-gray-400">Fecha de Emisión</p>
                                <p className="text-[11pt] font-black uppercase">{format(today, 'MMMM yyyy', { locale: es })}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- PÁGINA 2: ÍNDICE --- */}
                <div className="page-break py-10 px-16">
                    <header className="flex items-center justify-between border-b-2 border-black pb-3 mb-10">
                        <div className="flex items-center gap-4">
                            {platformLogo && (
                                <img src={platformLogo} alt="Logo" className="w-[45px] h-[45px] object-contain" />
                            )}
                            <div>
                                <p className="font-bold text-[9pt] leading-tight text-black uppercase">{platformTitle}</p>
                                <p className="text-[6.5pt] tracking-widest text-gray-500 uppercase">Manual Técnico Institucional</p>
                            </div>
                        </div>
                        <div className="text-right text-[7pt] font-bold uppercase text-black">
                            Contenidos del Sistema
                        </div>
                    </header>

                    <div className="flex items-center gap-4 mb-16">
                        <div className="h-8 w-2 bg-black"></div>
                        <h2 className="text-[22pt] font-black uppercase tracking-tighter text-black">
                            ÍNDICE DE SECCIONES
                        </h2>
                    </div>
                    
                    <div className="space-y-6 max-w-2xl">
                        {documents.map((doc, index) => (
                            <div key={doc.slug} className="flex items-end gap-6">
                                <span className="text-[14pt] font-black text-gray-300 w-8 italic">{(index + 1).toString().padStart(2, '0')}</span>
                                <div className="flex-1 border-b border-gray-100 pb-2">
                                    <span className="text-[11pt] font-bold uppercase text-black tracking-tight">{doc.title}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="mt-40 p-8 bg-gray-50 rounded-lg border-l-[8px] border-gray-200">
                        <p className="text-[8pt] font-black uppercase text-gray-500 mb-3 tracking-widest">Nota Legal</p>
                        <p className="text-[7.5pt] text-gray-500 leading-relaxed text-justify italic">
                            Este documento detalla la lógica operativa y estructural del sistema <strong>{platformTitle}</strong>. 
                            La información aquí contenida es para uso exclusivo administrativo y técnico de la institución.
                        </p>
                    </div>

                    <footer className="print-footer">
                        <div className="flex items-center gap-4">
                             <span className="uppercase font-bold text-black">{platformTitle}</span>
                             <span className="italic">{platformContact}</span>
                        </div>
                        <div className="page-number-display font-bold text-black"></div>
                    </footer>
                </div>

                {/* --- CUERPO DEL MANUAL --- */}
                {documents.map((doc, index) => (
                    <div key={doc.slug} className="page-break py-10 px-16">
                        <header className="flex items-center justify-between border-b border-gray-200 pb-3 mb-8">
                            <div className="flex items-center gap-4">
                                {platformLogo && (
                                    <img src={platformLogo} alt="Logo" className="w-[40px] h-[40px] object-contain" />
                                )}
                                <div>
                                    <p className="font-bold text-[8.5pt] leading-tight text-black uppercase">{platformTitle}</p>
                                    <p className="text-[6pt] tracking-widest text-gray-400 uppercase">Documentación Técnica v2.0</p>
                                </div>
                            </div>
                            <div className="text-[7pt] font-bold text-gray-400 uppercase tracking-widest">
                                SECCIÓN {(index + 1).toString().padStart(2, '0')}
                            </div>
                        </header>
                        
                        <div className="min-h-[180mm] pt-2">
                            <MarkdownRenderer content={doc.content} />
                        </div>
                        
                        <footer className="print-footer">
                            <div className="flex flex-col gap-0.5">
                                <span className="uppercase font-bold text-black">{platformTitle}</span>
                                <span className="italic text-[6pt]">{platformContact}</span>
                            </div>
                            <div className="text-center font-medium">
                                &copy; {currentYear} • {platformCreators}
                            </div>
                            <div className="page-number-display font-bold text-black border-l border-gray-200 pl-4"></div>
                        </footer>
                    </div>
                ))}
            </div>
        </div>
    );
}
