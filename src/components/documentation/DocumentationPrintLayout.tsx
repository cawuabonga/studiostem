
"use client";

import React from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Doc {
    slug: string;
    title: string;
    content: string;
}

interface DocumentationPrintLayoutProps {
    documents: Doc[];
}

export function DocumentationPrintLayout({ documents }: DocumentationPrintLayoutProps) {
    const today = new Date();

    return (
        <div className="p-0 font-sans text-black leading-relaxed">
            {/* --- PORTADA --- */}
            <div className="page-break flex flex-col items-center justify-between h-[270mm] py-20 text-center">
                <div className="space-y-8">
                    <div className="text-[12pt] font-black tracking-[0.5em] text-gray-500 uppercase">
                        Plataforma de Gestión Educativa
                    </div>
                    <div className="h-1 w-24 bg-primary mx-auto"></div>
                    <h1 className="text-[42pt] font-black tracking-tighter leading-none text-black uppercase">
                        STEM V2
                    </h1>
                    <h2 className="text-[18pt] font-bold text-gray-700 max-w-2xl mx-auto px-12">
                        MANUAL TÉCNICO Y DOCUMENTACIÓN ESTRUCTURAL DEL SISTEMA
                    </h2>
                </div>

                <div className="relative w-48 h-48 my-12 bg-gray-50 rounded-full flex items-center justify-center border-4 border-black">
                     <span className="text-[60pt] font-black">S</span>
                </div>

                <div className="space-y-4 border-t-2 border-black pt-12 w-full max-w-xl">
                    <p className="text-[11pt] font-bold uppercase tracking-widest text-gray-500">Documento de Ingeniería</p>
                    <p className="text-[14pt] font-black uppercase">{format(today, 'MMMM yyyy', { locale: es })}</p>
                </div>
            </div>

            {/* --- ÍNDICE --- */}
            <div className="page-break py-12 px-16">
                <h2 className="text-[24pt] font-black border-b-4 border-black pb-2 mb-12 uppercase tracking-tighter">
                    Contenido del Manual
                </h2>
                <div className="space-y-6">
                    {documents.map((doc, index) => (
                        <div key={doc.slug} className="flex items-end gap-4">
                            <span className="text-[14pt] font-black text-gray-300">{(index + 1).toString().padStart(2, '0')}</span>
                            <div className="flex-1 border-b-2 border-dotted border-gray-200 pb-1">
                                <span className="text-[12pt] font-bold uppercase">{doc.title}</span>
                            </div>
                            <span className="font-bold text-gray-400">Pág. {index + 2}</span>
                        </div>
                    ))}
                </div>
                
                <div className="mt-32 p-6 bg-gray-50 rounded-xl border-l-8 border-primary">
                    <p className="text-sm font-bold uppercase text-primary mb-2">Nota de Confidencialidad</p>
                    <p className="text-xs text-gray-600 leading-normal">
                        Este documento contiene información técnica privada sobre la arquitectura de la plataforma STEM. 
                        Su distribución está restringida a personal autorizado de nivel Super Administrador y equipos de desarrollo.
                    </p>
                </div>
            </div>

            {/* --- CUERPO DEL MANUAL --- */}
            {documents.map((doc, index) => (
                <div key={doc.slug} className="page-break py-12 px-16">
                    <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-10">
                        <span className="text-[9pt] font-black text-gray-400 uppercase tracking-widest">Manual STEM V2</span>
                        <span className="text-[9pt] font-black text-primary">SECCIÓN {(index + 1).toString().padStart(2, '0')}</span>
                    </div>
                    
                    <MarkdownRenderer content={doc.content} />
                    
                    <footer className="mt-20 pt-8 border-t border-gray-100 flex justify-between text-[8pt] text-gray-400 font-bold uppercase tracking-widest">
                        <span>Proyecto STEM - {currentYear}</span>
                        <span>Página {index + 3}</span>
                    </footer>
                </div>
            ))}
        </div>
    );
}

const currentYear = new Date().getFullYear();
