"use client";

import React from 'react';
import type { Plan, LoginDesign } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle2, ListChecks, FileText, Zap, Rocket, Crown, ShieldCheck, Globe, Cpu, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface PrintPlanQuoteProps {
    plan: Plan;
    design: LoginDesign | null;
}

/**
 * Componente de Encabezado Institucional para cada página
 */
const PageHeader = ({ design, pageTitle }: { design: LoginDesign | null, pageTitle: string }) => {
    const platformTitle = design?.title || "STEM V2";
    const platformLogo = design?.logoUrl;
    const today = new Date();

    return (
        <div className="flex justify-between items-start mb-6 pb-4 border-b-2 border-black">
            <div className="flex items-center gap-4">
                {platformLogo ? (
                    <img src={platformLogo} alt="Logo" className="w-12 h-12 object-contain" />
                ) : (
                    <div className="w-12 h-12 bg-black text-white flex items-center justify-center rounded-xl">
                        <span className="text-xs font-black italic">STEM</span>
                    </div>
                )}
                <div>
                    <h1 className="text-[12pt] font-black uppercase leading-tight text-black">{platformTitle}</h1>
                    <p className="text-[7pt] font-bold text-slate-500 uppercase tracking-widest">{pageTitle}</p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-[6pt] font-black uppercase text-gray-400 leading-none mb-1">Documento Oficial</p>
                <p className="text-[8pt] font-mono font-bold text-black">{format(today, 'dd/MM/yyyy')}</p>
            </div>
        </div>
    );
};

/**
 * Componente de Pie de Página para cada página
 */
const PageFooter = ({ pageNumber, design }: { pageNumber: number, design: LoginDesign | null }) => {
    const platformTitle = design?.title || "STEM V2";
    return (
        <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
            <p className="text-[7pt] text-slate-300 font-black uppercase tracking-[0.3em]">
                {platformTitle} • VALIDEZ DIGITAL VERIFICADA
            </p>
            <p className="text-[8pt] font-black text-slate-400 uppercase">
                Página {pageNumber.toString().padStart(2, '0')} / 03
            </p>
        </div>
    );
};

export function PrintPlanQuote({ plan, design }: PrintPlanQuoteProps) {
    const today = new Date();
    const platformTitle = design?.title || "STEM V2";
    const creators = design?.creators || "Equipo de Desarrollo STEM";

    return (
        <div className="printable-area font-sans text-black bg-white">
            <style jsx global>{`
                @media screen {
                    .page-container {
                        max-width: 210mm;
                        margin: 20px auto;
                        box-shadow: 0 0 20px rgba(0,0,0,0.1);
                    }
                }
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 0;
                    }
                    body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .page-container {
                        width: 210mm;
                        height: 297mm;
                        padding: 20mm;
                        page-break-after: always;
                        position: relative;
                        overflow: hidden;
                        box-sizing: border-box;
                        display: flex;
                        flex-direction: column;
                        background: white !important;
                    }
                    .no-print-break {
                        page-break-inside: avoid;
                    }
                }
                .page-container {
                    width: 210mm;
                    height: 297mm;
                    padding: 20mm;
                    margin: 0 auto;
                    display: flex;
                    flex-direction: column;
                    background: white;
                }
            `}</style>

            {/* --- PÁGINA 1: CARÁTULA --- */}
            <div className="page-container">
                <PageHeader design={design} pageTitle="Propuesta Técnica Comercial" />
                
                <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
                    <div className="space-y-4 mb-16">
                        <p className="text-[12pt] font-black tracking-[0.5em] text-slate-400 uppercase">
                            Plan de Implementación
                        </p>
                        <div className="h-1 w-24 bg-black mx-auto"></div>
                    </div>

                    <div className="flex flex-col items-center gap-8 mb-16">
                        {design?.logoUrl ? (
                            <img src={design.logoUrl} alt="Logo" className="h-48 w-48 object-contain" />
                        ) : (
                            <div className="w-40 h-40 bg-black text-white flex items-center justify-center rounded-[2.5rem]">
                                <span className="text-4xl font-black italic">STEM</span>
                            </div>
                        )}
                        
                        <div className="space-y-4">
                            <h1 className="text-[32pt] font-black uppercase tracking-tighter leading-none text-black">
                                {platformTitle}
                            </h1>
                            <p className="text-[14pt] font-bold text-slate-500 uppercase tracking-widest">
                                Ecosistema de Gestión Educativa Modular
                            </p>
                        </div>
                    </div>

                    <div className="w-full max-w-2xl bg-slate-50 border-y-2 border-black py-12">
                        <p className="text-[10pt] font-black text-primary uppercase tracking-[0.3em] mb-4">Servicio Seleccionado</p>
                        <h2 className="text-[28pt] font-black uppercase tracking-tight text-black">
                            {plan.name}
                        </h2>
                    </div>

                    <div className="w-full mt-16 flex justify-between items-end text-left">
                        <div>
                            <p className="text-[8pt] font-black uppercase text-slate-400 tracking-widest mb-1">Desarrollado por</p>
                            <p className="text-[11pt] font-bold uppercase">{creators}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[8pt] font-black uppercase text-slate-400 tracking-widest mb-1">Fecha de Emisión</p>
                            <p className="text-[11pt] font-black uppercase">{format(today, "dd 'de' MMMM, yyyy", { locale: es })}</p>
                        </div>
                    </div>
                </div>

                <PageFooter pageNumber={1} design={design} />
            </div>

            {/* --- PÁGINA 2: COSTO E INVERSIÓN --- */}
            <div className="page-container">
                <PageHeader design={design} pageTitle="Cotización de Servicios" />

                <div className="flex-1">
                    <div className="text-center my-10">
                        <h2 className="text-[24pt] font-black uppercase tracking-tighter leading-none mb-2">PROPUESTA ECONÓMICA</h2>
                        <p className="text-[10pt] font-bold text-slate-400 uppercase tracking-[0.3em]">Confidencial Institucional</p>
                    </div>

                    <div className="space-y-8">
                        <section>
                            <p className="text-[11pt] leading-relaxed text-justify text-slate-700">
                                Por intermedio de la presente, ponemos a su consideración la propuesta técnica y económica para la implementación integral del plan <strong>"{plan.name.toUpperCase()}"</strong> de nuestra plataforma <strong>{platformTitle}</strong>. Este ecosistema está diseñado bajo un modelo de alta disponibilidad para optimizar los procesos académicos y administrativos de su institución.
                            </p>
                        </section>

                        {/* Cuadro de Inversión */}
                        <section className="relative py-12 px-8 border-2 border-black rounded-[2.5rem] bg-white shadow-xl overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-5">
                                <CreditCard className="w-32 h-32" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">
                                <div className="md:col-span-7 space-y-2">
                                    <p className="text-[10pt] font-bold text-slate-400 uppercase tracking-widest">Plan de Licenciamiento</p>
                                    <h3 className="text-[26pt] font-black uppercase text-black leading-tight tracking-tighter">
                                        {plan.name}
                                    </h3>
                                </div>
                                <div className="md:col-span-5 text-right border-l-2 border-slate-100 pl-8">
                                    <p className="text-[10pt] font-bold text-slate-400 uppercase tracking-widest mb-2">Inversión {plan.billingCycle === 'anual' ? 'Anual' : 'Mensual'}</p>
                                    <div className="flex items-baseline justify-end gap-1">
                                        <span className="text-[16pt] font-bold">S/</span>
                                        <span className="text-[42pt] font-black text-black leading-none">
                                            {plan.price.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <p className="text-[8pt] font-bold text-slate-500 uppercase mt-2">Incluye IGV y Soporte Especializado</p>
                                </div>
                            </div>
                        </section>

                        <div className="grid grid-cols-3 gap-6 pt-10">
                            <div className="flex flex-col items-center text-center p-5 border rounded-3xl bg-slate-50/50">
                                <ShieldCheck className="h-8 w-8 text-primary/40 mb-3" />
                                <p className="text-[7pt] font-black uppercase tracking-widest text-slate-500 mb-1">Garantía</p>
                                <p className="text-[9pt] font-bold">99.9% Uptime SLA</p>
                            </div>
                            <div className="flex flex-col items-center text-center p-5 border rounded-3xl bg-slate-50/50">
                                <Globe className="h-8 w-8 text-primary/40 mb-3" />
                                <p className="text-[7pt] font-black uppercase tracking-widest text-slate-500 mb-1">Hosting</p>
                                <p className="text-[9pt] font-bold">Google Cloud Pro</p>
                            </div>
                            <div className="flex flex-col items-center text-center p-5 border rounded-3xl bg-slate-50/50">
                                <Cpu className="h-8 w-8 text-primary/40 mb-3" />
                                <p className="text-[7pt] font-black uppercase tracking-widest text-slate-500 mb-1">Motor</p>
                                <p className="text-[9pt] font-bold">IA Híbrida Gemini</p>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 mt-10">
                            <h4 className="text-[9pt] font-black uppercase text-slate-400 tracking-widest mb-2 flex items-center gap-2">
                                <Info className="h-4 w-4" /> Resumen del Plan
                            </h4>
                            <p className="text-[10pt] text-slate-600 leading-relaxed italic">
                                {plan.description}
                            </p>
                        </div>
                    </div>
                </div>

                <PageFooter pageNumber={2} design={design} />
            </div>

            {/* --- PÁGINA 3: MÓDULOS Y FIRMAS --- */}
            <div className="page-container">
                <PageHeader design={design} pageTitle="Especificaciones Técnicas" />

                <div className="flex-1">
                    <div className="flex justify-between items-center mb-8 pb-4 border-b-2 border-black">
                        <h3 className="text-[14pt] font-black uppercase tracking-tight flex items-center gap-3">
                            <ListChecks className="h-6 w-6 text-primary" /> Módulos y Funcionalidades
                        </h3>
                        <Badge variant="outline" className="font-black uppercase text-[8pt] border-black">{plan.name}</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-12 gap-y-10">
                        {plan.features.map((feature, i) => {
                            const [name, ...descParts] = feature.split(':');
                            const description = descParts.join(':');
                            const items = description ? description.split(';').map(s => s.trim()).filter(Boolean) : [];

                            return (
                                <div key={i} className="space-y-3 no-print-break">
                                    <h4 className="text-[11pt] font-black text-primary uppercase tracking-tight flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        {name}
                                    </h4>
                                    <div className="space-y-2 ml-6">
                                        {items.length > 0 ? items.map((item, idx) => (
                                            <div key={idx} className="text-[9pt] text-slate-600 font-medium leading-tight flex items-start gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                                                <span>{item}</span>
                                            </div>
                                        )) : (
                                            <p className="text-[9pt] text-slate-400 italic">Funcionalidad completa habilitada.</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-auto pt-24 no-print-break">
                        <div className="grid grid-cols-2 gap-24 px-12 text-center">
                            <div className="space-y-2">
                                <div className="h-20"></div>
                                <div className="border-t-2 border-black pt-2">
                                    <p className="text-[10pt] font-black uppercase">Dirección Comercial</p>
                                    <p className="text-[8pt] text-slate-500 font-bold uppercase tracking-widest">{platformTitle} Team</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="h-20"></div>
                                <div className="border-t-2 border-black pt-2">
                                    <p className="text-[10pt] font-black uppercase">Aceptación del Cliente</p>
                                    <p className="text-[8pt] text-slate-500 font-bold uppercase tracking-widest">Sello y Firma Autorizada</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <PageFooter pageNumber={3} design={design} />
            </div>
        </div>
    );
}
