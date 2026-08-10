
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
 * Componente de Encabezado Institucional para cada página de la proforma
 */
const PageHeader = ({ design, pageTitle }: { design: LoginDesign | null, pageTitle: string }) => {
    const platformTitle = design?.title || "STEM V2";
    const platformLogo = design?.logoUrl;
    const today = new Date();

    return (
        <div className="print-header flex items-center justify-between mb-8 border-b-2 border-black pb-4 w-full no-print-break">
            <div className="flex items-center gap-4">
                {platformLogo ? (
                    <img src={platformLogo} alt="Logo" className="w-14 h-14 object-contain" />
                ) : (
                    <div className="w-12 h-12 bg-black text-white flex items-center justify-center rounded-xl">
                        <span className="text-[10px] font-black italic">STEM</span>
                    </div>
                )}
                <div className="text-left">
                    <h1 className="text-[13pt] font-black uppercase leading-tight text-black">{platformTitle}</h1>
                    <p className="text-[7.5pt] font-bold text-slate-500 uppercase tracking-widest">{pageTitle}</p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-[6.5pt] font-black uppercase text-slate-400 leading-none mb-1">Documento Técnico Oficial</p>
                <p className="text-[9pt] font-mono font-bold text-black">{format(today, 'dd/MM/yyyy')}</p>
            </div>
        </div>
    );
};

/**
 * Componente de Pie de Página Institucional con numeración
 */
const PageFooter = ({ pageNumber, totalPages = 3, design }: { pageNumber: number, totalPages?: number, design: LoginDesign | null }) => {
    const platformTitle = design?.title || "STEM V2";
    return (
        <div className="print-footer fixed bottom-0 left-0 right-0 h-10 border-t border-slate-200 flex justify-between items-center w-full px-2 bg-white">
            <div className="flex flex-col text-left">
                <span className="text-[7.5pt] text-slate-400 font-black uppercase tracking-[0.3em]">
                    {platformTitle} • PROPUESTA DE SERVICIO
                </span>
                <span className="text-[6pt] text-slate-300 font-bold uppercase italic">Este documento tiene validez digital mediante firma de servidor</span>
            </div>
            <div className="flex items-center gap-3">
                <span className="text-[8pt] font-black text-slate-900 uppercase">Página {pageNumber.toString().padStart(2, '0')} / {totalPages.toString().padStart(2, '0')}</span>
            </div>
        </div>
    );
};

export function PrintPlanQuote({ plan, design }: PrintPlanQuoteProps) {
    const today = new Date();
    const platformTitle = design?.title || "STEM V2";
    const creators = design?.creators || "Equipo de Desarrollo STEM";

    return (
        <div className="printable-area font-sans text-black bg-white w-full">
            <style jsx global>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        /* Márgenes institucionales estándar */
                        margin: 10mm 15mm 10mm 15mm;
                    }
                    body {
                        margin: 0 !important;
                        padding: 0 !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                        background: white !important;
                        display: block !important;
                    }
                    /* Reset de contenedores de NextJS para permitir flujo de páginas */
                    html, body, .print-container {
                        height: auto !important;
                        overflow: visible !important;
                    }
                    .page-container {
                        width: 100%;
                        /* Altura de página menos los márgenes del @page */
                        min-height: 270mm; 
                        page-break-after: always;
                        break-after: page;
                        display: flex !important;
                        flex-direction: column !important;
                        position: relative;
                        background: white !important;
                        padding-bottom: 15mm; /* Espacio para el footer fijo */
                    }
                    .no-print-break {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }
                }
                /* Estilos visuales compartidos */
                .page-container {
                    display: flex;
                    flex-direction: column;
                    box-sizing: border-box;
                    background: white;
                }
            `}</style>

            {/* --- PÁGINA 1: CARÁTULA --- */}
            <div className="page-container">
                <PageHeader design={design} pageTitle="Presentación de Solución" />
                
                <div className="flex-grow flex flex-col items-center justify-center text-center">
                    <div className="space-y-4 mb-20">
                        <p className="text-[14pt] font-black tracking-[0.6em] text-slate-300 uppercase">
                            Plan de Implementación
                        </p>
                        <div className="h-1 w-32 bg-black mx-auto"></div>
                    </div>

                    <div className="flex flex-col items-center gap-10 mb-20">
                        {design?.logoUrl ? (
                            <img src={design.logoUrl} alt="Logo" className="h-48 w-48 object-contain" />
                        ) : (
                            <div className="w-40 h-40 bg-black text-white flex items-center justify-center rounded-[2.5rem]">
                                <span className="text-4xl font-black italic">STEM</span>
                            </div>
                        )}
                        
                        <div className="space-y-4 px-12">
                            <h1 className="text-[38pt] font-black uppercase tracking-tighter leading-[1.1] text-black">
                                {platformTitle}
                            </h1>
                            <p className="text-[14pt] font-bold text-slate-400 uppercase tracking-widest">
                                Ecosistema de Gestión Educativa Modular
                            </p>
                        </div>
                    </div>

                    <div className="w-full max-w-2xl bg-slate-50 border-y-2 border-black py-12">
                        <p className="text-[10pt] font-black text-primary uppercase tracking-[0.4em] mb-4">Propuesta Técnica para el Plan:</p>
                        <h2 className="text-[28pt] font-black uppercase tracking-tight text-black px-6">
                            {plan.name}
                        </h2>
                    </div>

                    <div className="w-full mt-24 flex justify-between items-end text-left px-8">
                        <div className="space-y-1">
                            <p className="text-[8pt] font-black uppercase text-slate-400 tracking-widest">Ingeniería y Desarrollo</p>
                            <p className="text-[11pt] font-bold uppercase">{creators}</p>
                        </div>
                        <div className="text-right space-y-1">
                            <p className="text-[8pt] font-black uppercase text-slate-400 tracking-widest">Emisión de Proforma</p>
                            <p className="text-[11pt] font-black uppercase">{format(today, "MMMM yyyy", { locale: es })}</p>
                        </div>
                    </div>
                </div>

                <PageFooter pageNumber={1} design={design} />
            </div>

            {/* --- PÁGINA 2: PROPUESTA ECONÓMICA --- */}
            <div className="page-container">
                <PageHeader design={design} pageTitle="Cotización de Servicios" />

                <div className="flex-grow space-y-12">
                    <div className="text-center my-6">
                        <h2 className="text-[26pt] font-black uppercase tracking-tighter leading-none mb-2">PROPUESTA ECONÓMICA</h2>
                        <div className="inline-block px-6 py-1 bg-black text-white text-[9pt] font-black uppercase tracking-[0.3em]">
                            Confidencial Institucional
                        </div>
                    </div>

                    <p className="text-[11.5pt] leading-relaxed text-justify text-slate-700 px-4 font-medium">
                        Estimados señores, ponemos a su consideración la propuesta comercial para la implementación del plan <strong>"{plan.name.toUpperCase()}"</strong>. Nuestra solución está diseñada para centralizar la gestión académica y administrativa, optimizando recursos mediante el uso de infraestructura en la nube y automatización de procesos críticos.
                    </p>

                    {/* Cuadro de Inversión Central */}
                    <div className="mx-4 relative py-12 px-10 border-[3px] border-black rounded-[2.5rem] bg-white shadow-xl overflow-hidden no-print-break">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <CreditCard className="w-32 h-32" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">
                            <div className="md:col-span-7 space-y-3">
                                <p className="text-[10pt] font-bold text-slate-400 uppercase tracking-widest">Suscripción de Servicio</p>
                                <h3 className="text-[28pt] font-black uppercase text-black leading-tight tracking-tighter">
                                    {plan.name}
                                </h3>
                                <div className="flex items-center gap-2">
                                    <BadgeCheck className="h-5 w-5 text-green-600" />
                                    <span className="text-[9pt] font-black uppercase text-slate-600">SLA: 99.9% de Disponibilidad Anual</span>
                                </div>
                            </div>
                            <div className="md:col-span-5 text-right border-l border-slate-100 pl-10">
                                <p className="text-[10pt] font-bold text-slate-400 uppercase tracking-widest mb-1">Inversión {plan.billingCycle === 'anual' ? 'Anual' : 'Mensual'}</p>
                                <div className="flex items-baseline justify-end gap-1">
                                    <span className="text-[16pt] font-bold">S/</span>
                                    <span className="text-[42pt] font-black text-black leading-none">
                                        {plan.price.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <p className="text-[8.5pt] font-bold text-slate-400 uppercase mt-3">Importe total por sede institucional</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6 px-4">
                        <div className="flex flex-col items-center text-center p-6 border border-slate-100 rounded-3xl bg-slate-50/50 no-print-break">
                            <ShieldCheck className="h-8 w-8 text-primary mb-3" />
                            <p className="text-[7.5pt] font-black uppercase tracking-widest text-slate-400 mb-1">Seguridad</p>
                            <p className="text-[10pt] font-bold text-slate-800">Cifrado Bancario SSL</p>
                        </div>
                        <div className="flex flex-col items-center text-center p-6 border border-slate-100 rounded-3xl bg-slate-50/50 no-print-break">
                            <Globe className="h-8 w-8 text-primary mb-3" />
                            <p className="text-[7.5pt] font-black uppercase tracking-widest text-slate-400 mb-1">Hosting</p>
                            <p className="text-[10pt] font-bold text-slate-800">Global Google CDN</p>
                        </div>
                        <div className="flex flex-col items-center text-center p-6 border border-slate-100 rounded-3xl bg-slate-50/50 no-print-break">
                            <Cpu className="h-8 w-8 text-primary mb-3" />
                            <p className="text-[7.5pt] font-black uppercase tracking-widest text-slate-400 mb-1">Procesamiento</p>
                            <p className="text-[10pt] font-bold text-slate-800">Motor IA Híbrida</p>
                        </div>
                    </div>

                    <div className="mx-4 p-8 bg-slate-50 rounded-[2rem] border border-slate-200 no-print-break">
                        <h4 className="text-[9pt] font-black uppercase text-slate-500 tracking-widest mb-3 flex items-center gap-2">
                            <Info className="h-4 w-4" /> Alcance de la Suscripción
                        </h4>
                        <p className="text-[10.5pt] text-slate-600 leading-relaxed italic font-medium">
                            "{plan.description}"
                        </p>
                    </div>
                </div>

                <PageFooter pageNumber={2} design={design} />
            </div>

            {/* --- PÁGINA 3: DESGLOSE TÉCNICO Y FIRMAS --- */}
            <div className="page-container">
                <PageHeader design={design} pageTitle="Anexo: Especificaciones del Plan" />

                <div className="flex-grow flex flex-col px-4">
                    <div className="flex justify-between items-center mb-10 pb-2 border-b border-black no-print-break">
                        <h3 className="text-[14pt] font-black uppercase tracking-tight flex items-center gap-3">
                            <ListChecks className="h-6 w-6 text-primary" /> Funcionalidades Incluidas
                        </h3>
                        <Badge variant="outline" className="font-black uppercase text-[8pt] border-black px-4">{plan.name}</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-12 gap-y-10">
                        {plan.features.map((feature, i) => {
                            const [name, ...descParts] = feature.split(':');
                            const description = descParts.join(':');
                            const items = description ? description.split(';').map(s => s.trim()).filter(Boolean) : [];

                            return (
                                <div key={i} className="space-y-3 no-print-break">
                                    <h4 className="text-[11pt] font-black text-primary uppercase tracking-tight border-l-4 border-primary pl-3">
                                        {name}
                                    </h4>
                                    <div className="space-y-2 ml-4">
                                        {items.length > 0 ? items.map((item, idx) => (
                                            <div key={idx} className="text-[9pt] text-slate-600 font-bold leading-snug flex items-start gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                                                <span>{item}</span>
                                            </div>
                                        )) : (
                                            <p className="text-[9pt] text-slate-400 italic">Módulo habilitado según estándares del plan.</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-auto mb-10 pt-16">
                        <div className="grid grid-cols-2 gap-32 px-12 text-center no-print-break">
                            <div className="space-y-2">
                                <div className="h-16"></div>
                                <div className="border-t border-black pt-2">
                                    <p className="text-[10pt] font-black uppercase">{platformTitle} Team</p>
                                    <p className="text-[7.5pt] text-slate-400 font-bold uppercase tracking-widest">Dirección de Ingeniería</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="h-16"></div>
                                <div className="border-t border-black pt-2">
                                    <p className="text-[10pt] font-black uppercase">Cliente Institucional</p>
                                    <p className="text-[7.5pt] text-slate-400 font-bold uppercase tracking-widest">Sello y Firma de Aceptación</p>
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
