
"use client";

import React from 'react';
import type { Plan, LoginDesign } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
    CheckCircle2, 
    ListChecks, 
    FileText, 
    Zap, 
    Rocket, 
    Crown, 
    ShieldCheck, 
    Globe, 
    Cpu, 
    CreditCard, 
    Info,
    BadgeCheck
} from 'lucide-react';
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
        <div className="flex justify-between items-start mb-8 pb-4 border-b-2 border-black w-full shrink-0 no-print-break">
            <div className="flex items-center gap-4">
                {platformLogo ? (
                    <img src={platformLogo} alt="Logo" className="w-14 h-14 object-contain" />
                ) : (
                    <div className="w-14 h-14 bg-black text-white flex items-center justify-center rounded-xl">
                        <span className="text-xs font-black italic">STEM</span>
                    </div>
                )}
                <div>
                    <h1 className="text-[14pt] font-black uppercase leading-tight text-black">{platformTitle}</h1>
                    <p className="text-[8pt] font-bold text-slate-500 uppercase tracking-widest">{pageTitle}</p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-[7pt] font-black uppercase text-gray-400 leading-none mb-1">Documento Oficial</p>
                <p className="text-[9pt] font-mono font-bold text-black">{format(today, 'dd/MM/yyyy')}</p>
            </div>
        </div>
    );
};

/**
 * Componente de Pie de Página con numeración
 */
const PageFooter = ({ pageNumber, design }: { pageNumber: number, design: LoginDesign | null }) => {
    const platformTitle = design?.title || "STEM V2";
    return (
        <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center w-full shrink-0">
            <div className="flex flex-col text-left">
                <span className="text-[8pt] text-slate-400 font-black uppercase tracking-[0.3em]">
                    {platformTitle} • PROPUESTA DE SERVICIO
                </span>
                <span className="text-[6pt] text-slate-300 font-bold uppercase">Validez digital verificada mediante firma de servidor</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-[9pt] font-black text-slate-900 uppercase">Página {pageNumber.toString().padStart(2, '0')}</span>
            </div>
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
                        background: white;
                    }
                }
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 15mm;
                    }
                    body {
                        margin: 0 !important;
                        padding: 0 !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                        background: white !important;
                    }
                    .page-container {
                        width: 100%;
                        height: 265mm; 
                        page-break-after: always;
                        break-after: page;
                        display: flex !important;
                        flex-direction: column !important;
                        position: relative;
                        background: white !important;
                    }
                    .no-print-break {
                        page-break-inside: avoid;
                    }
                }
                .page-container {
                    display: flex;
                    flex-direction: column;
                    box-sizing: border-box;
                    padding: 0;
                }
            `}</style>

            {/* --- PÁGINA 1: CARÁTULA --- */}
            <div className="page-container">
                <PageHeader design={design} pageTitle="Propuesta Técnica Comercial" />
                
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="space-y-4 mb-20">
                        <p className="text-[14pt] font-black tracking-[0.6em] text-slate-300 uppercase">
                            Plan de Implementación
                        </p>
                        <div className="h-1 w-32 bg-black mx-auto"></div>
                    </div>

                    <div className="flex flex-col items-center gap-10 mb-20">
                        {design?.logoUrl ? (
                            <img src={design.logoUrl} alt="Logo" className="h-56 w-56 object-contain" />
                        ) : (
                            <div className="w-48 h-48 bg-black text-white flex items-center justify-center rounded-[3rem]">
                                <span className="text-5xl font-black italic">STEM</span>
                            </div>
                        )}
                        
                        <div className="space-y-4">
                            <h1 className="text-[42pt] font-black uppercase tracking-tighter leading-none text-black">
                                {platformTitle}
                            </h1>
                            <p className="text-[16pt] font-bold text-slate-400 uppercase tracking-widest">
                                Ecosistema de Gestión Educativa Modular
                            </p>
                        </div>
                    </div>

                    <div className="w-full max-w-3xl bg-slate-50 border-y-4 border-black py-16">
                        <p className="text-[12pt] font-black text-primary uppercase tracking-[0.4em] mb-6">Servicio Seleccionado</p>
                        <h2 className="text-[36pt] font-black uppercase tracking-tight text-black">
                            {plan.name}
                        </h2>
                    </div>

                    <div className="w-full mt-24 flex justify-between items-end text-left px-4">
                        <div>
                            <p className="text-[9pt] font-black uppercase text-slate-400 tracking-widest mb-1">Ingeniería y Desarrollo</p>
                            <p className="text-[12pt] font-bold uppercase">{creators}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[9pt] font-black uppercase text-slate-400 tracking-widest mb-1">Fecha de Emisión</p>
                            <p className="text-[12pt] font-black uppercase">{format(today, "MMMM yyyy", { locale: es })}</p>
                        </div>
                    </div>
                </div>

                <PageFooter pageNumber={1} design={design} />
            </div>

            {/* --- PÁGINA 2: PROPUESTA ECONÓMICA --- */}
            <div className="page-container">
                <PageHeader design={design} pageTitle="Cotización de Servicios" />

                <div className="flex-1 space-y-10">
                    <div className="text-center my-6">
                        <h2 className="text-[28pt] font-black uppercase tracking-tighter leading-none mb-2">PROPUESTA ECONÓMICA</h2>
                        <p className="text-[11pt] font-bold text-slate-400 uppercase tracking-[0.4em]">Confidencial Institucional</p>
                    </div>

                    <p className="text-[12pt] leading-relaxed text-justify text-slate-700">
                        Ponemos a su consideración la propuesta técnica y económica para la implementación integral del plan <strong>"{plan.name.toUpperCase()}"</strong>. Nuestra arquitectura bajo el sistema de Educación Modular permite un escalamiento progresivo y eficiente de sus operaciones académicas.
                    </p>

                    {/* Cuadro de Inversión Principal */}
                    <div className="relative py-14 px-10 border-4 border-black rounded-[3rem] bg-white shadow-2xl overflow-hidden mt-10">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <CreditCard className="w-40 h-40" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">
                            <div className="md:col-span-7 space-y-3">
                                <p className="text-[11pt] font-bold text-slate-400 uppercase tracking-widest">Nivel de Suscripción</p>
                                <h3 className="text-[32pt] font-black uppercase text-black leading-tight tracking-tighter">
                                    {plan.name}
                                </h3>
                                <div className="flex items-center gap-2">
                                    <BadgeCheck className="h-5 w-5 text-green-600" />
                                    <span className="text-[10pt] font-bold uppercase text-slate-600">Soporte Técnico 24/7 Incluido</span>
                                </div>
                            </div>
                            <div className="md:col-span-5 text-right border-l-2 border-slate-100 pl-10">
                                <p className="text-[11pt] font-bold text-slate-400 uppercase tracking-widest mb-2">Inversión {plan.billingCycle === 'anual' ? 'Anual' : 'Mensual'}</p>
                                <div className="flex items-baseline justify-end gap-1">
                                    <span className="text-[18pt] font-bold">S/</span>
                                    <span className="text-[48pt] font-black text-black leading-none">
                                        {plan.price.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <p className="text-[9pt] font-bold text-slate-500 uppercase mt-4">Precios expresados en Soles (PEN)</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6 mt-12">
                        <div className="flex flex-col items-center text-center p-6 border-2 border-slate-100 rounded-[2rem] bg-slate-50/50">
                            <ShieldCheck className="h-10 w-10 text-primary mb-4" />
                            <p className="text-[8pt] font-black uppercase tracking-widest text-slate-400 mb-1">Garantía</p>
                            <p className="text-[11pt] font-bold text-slate-800">99.9% Uptime SLA</p>
                        </div>
                        <div className="flex flex-col items-center text-center p-6 border-2 border-slate-100 rounded-[2rem] bg-slate-50/50">
                            <Globe className="h-10 w-10 text-primary mb-4" />
                            <p className="text-[8pt] font-black uppercase tracking-widest text-slate-400 mb-1">Infraestructura</p>
                            <p className="text-[11pt] font-bold text-slate-800">Google Cloud Pro</p>
                        </div>
                        <div className="flex flex-col items-center text-center p-6 border-2 border-slate-100 rounded-[2rem] bg-slate-50/50">
                            <Cpu className="h-10 w-10 text-primary mb-4" />
                            <p className="text-[8pt] font-black uppercase tracking-widest text-slate-400 mb-1">Inteligencia</p>
                            <p className="text-[11pt] font-bold text-slate-800">Motor IA Híbrida</p>
                        </div>
                    </div>

                    <div className="p-8 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 mt-12">
                        <h4 className="text-[10pt] font-black uppercase text-slate-500 tracking-widest mb-3 flex items-center gap-2">
                            <Info className="h-5 w-5" /> Descripción de Servicio
                        </h4>
                        <p className="text-[11pt] text-slate-600 leading-relaxed italic">
                            "{plan.description}"
                        </p>
                    </div>
                </div>

                <PageFooter pageNumber={2} design={design} />
            </div>

            {/* --- PÁGINA 3: MÓDULOS Y FIRMAS --- */}
            <div className="page-container">
                <PageHeader design={design} pageTitle="Especificaciones Técnicas" />

                <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-center mb-10 pb-4 border-b-2 border-black">
                        <h3 className="text-[16pt] font-black uppercase tracking-tight flex items-center gap-3">
                            <ListChecks className="h-7 w-7 text-primary" /> Módulos y Funcionalidades Incluidas
                        </h3>
                        <Badge variant="outline" className="font-black uppercase text-[9pt] border-2 border-black px-4 h-8">{plan.name}</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-16 gap-y-12 mb-16">
                        {plan.features.map((feature, i) => {
                            const [name, ...descParts] = feature.split(':');
                            const description = descParts.join(':');
                            const items = description ? description.split(';').map(s => s.trim()).filter(Boolean) : [];

                            return (
                                <div key={i} className="space-y-4 no-print-break">
                                    <h4 className="text-[13pt] font-black text-primary uppercase tracking-tight flex items-center gap-3">
                                        <div className="h-2 w-2 rounded-full bg-green-500" />
                                        {name}
                                    </h4>
                                    <div className="space-y-2.5 ml-5">
                                        {items.length > 0 ? items.map((item, idx) => (
                                            <div key={idx} className="text-[10pt] text-slate-700 font-medium leading-tight flex items-start gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-slate-300 mt-2 shrink-0" />
                                                <span>{item}</span>
                                            </div>
                                        )) : (
                                            <p className="text-[10pt] text-slate-400 italic">Funcionalidad completa habilitada según estándares modular.</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-auto pb-10">
                        <div className="grid grid-cols-2 gap-32 px-12 text-center no-print-break">
                            <div className="space-y-3">
                                <div className="h-24"></div>
                                <div className="border-t-2 border-black pt-3">
                                    <p className="text-[11pt] font-black uppercase">{platformTitle} Team</p>
                                    <p className="text-[8pt] text-slate-400 font-bold uppercase tracking-widest">Dirección Comercial</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="h-24"></div>
                                <div className="border-t-2 border-black pt-3">
                                    <p className="text-[11pt] font-black uppercase">Cliente Institucional</p>
                                    <p className="text-[8pt] text-slate-400 font-bold uppercase tracking-widest">Sello y Firma Autorizada</p>
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
