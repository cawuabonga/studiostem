
"use client";

import React from 'react';
import type { Plan, LoginDesign } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
    CheckCircle2, 
    ShieldCheck, 
    Info, 
    ListChecks,
    Globe,
    Cpu,
    CreditCard,
    BadgeCheck,
    Briefcase,
    Zap,
    Rocket,
    Crown,
    Star
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PrintPlanQuoteProps {
    plan: Plan;
    design: LoginDesign | null;
}

/**
 * Componente de Encabezado Institucional que se repite en cada página.
 */
const PageHeader = ({ design }: { design: LoginDesign | null }) => {
    const platformTitle = design?.title || "STEM V2";
    const platformLogo = design?.logoUrl;
    
    return (
        <div className="w-full h-[35mm] border-b-2 border-black flex items-center justify-between px-[15mm] shrink-0 bg-white">
            <div className="flex items-center gap-4">
                {platformLogo ? (
                    <img src={platformLogo} alt="Logo" className="w-10 h-10 object-contain" />
                ) : (
                    <div className="w-10 h-10 bg-black text-white flex items-center justify-center rounded-lg">
                        <span className="text-[7pt] font-black italic">STEM</span>
                    </div>
                )}
                <div className="text-left">
                    <h1 className="text-[12pt] font-black uppercase leading-tight text-black">{platformTitle}</h1>
                    <p className="text-[7pt] font-bold text-slate-500 uppercase tracking-widest">Propuesta Técnica Comercial</p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-[8pt] font-black text-black uppercase mb-1">Documento Oficial</p>
                <p className="text-[6.5pt] font-mono font-bold text-gray-400">REF: {format(new Date(), 'yyyyMMdd')}-SAAS</p>
            </div>
        </div>
    );
};

/**
 * Componente de Pie de Página Institucional que se repite en cada página.
 */
const PageFooter = ({ design, pageNumber }: { design: LoginDesign | null, pageNumber: number }) => {
    const platformTitle = design?.title || "STEM V2";
    return (
        <div className="w-full h-[20mm] border-t border-slate-200 flex justify-between items-center px-[15mm] shrink-0 bg-white">
            <div className="text-left">
                <p className="text-[7pt] text-slate-400 font-black uppercase tracking-[0.3em] leading-none mb-1">
                    {platformTitle} • ECOSISTEMA EDUCATIVO
                </p>
                <p className="text-[6pt] text-slate-300 font-bold uppercase italic">Generado digitalmente por la plataforma central</p>
            </div>
            <div className="text-right">
                <p className="text-[8pt] font-black text-black uppercase">PÁGINA 0{pageNumber} / 03</p>
            </div>
        </div>
    );
};

export function PrintPlanQuote({ plan, design }: PrintPlanQuoteProps) {
    const today = new Date();
    const platformTitle = design?.title || "STEM V2";

    return (
        <div className="quote-print-wrapper bg-white text-black font-sans">
            <style jsx global>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 0;
                    }
                    body {
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                    }
                    .print-page {
                        width: 210mm;
                        height: 297mm;
                        display: flex !important;
                        flex-direction: column !important;
                        page-break-after: always !important;
                        break-after: page !important;
                        overflow: hidden !important;
                        background: white !important;
                        box-sizing: border-box !important;
                    }
                }
                
                @media screen {
                    .quote-print-wrapper {
                        background: #f1f5f9;
                        padding: 40px 0;
                    }
                    .print-page {
                        width: 210mm;
                        height: 297mm;
                        margin: 0 auto 20px;
                        display: flex;
                        flex-direction: column;
                        background: white;
                        box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                        overflow: hidden;
                    }
                }
            `}</style>

            {/* --- PÁGINA 1: PORTADA --- */}
            <div className="print-page">
                <PageHeader design={design} />
                
                <div className="flex-1 flex flex-col items-center justify-center text-center px-[20mm]">
                    <p className="text-[11pt] font-black tracking-[0.6em] text-slate-300 uppercase mb-12">Propuesta preparada para:</p>
                    
                    <div className="w-full bg-slate-50 border-y-2 border-black py-16 mb-16">
                        <h2 className="text-[32pt] font-black uppercase tracking-tighter text-black px-6 leading-tight">
                            {plan.name}
                        </h2>
                    </div>

                    <div className="flex flex-col items-center gap-8">
                        {design?.logoUrl ? (
                            <img src={design.logoUrl} alt="Logo" className="h-28 w-28 object-contain" />
                        ) : (
                            <div className="w-24 h-24 bg-black text-white flex items-center justify-center rounded-2xl">
                                <span className="text-3xl font-black italic">STEM</span>
                            </div>
                        )}
                        
                        <div className="space-y-2">
                            <h1 className="text-[24pt] font-black uppercase tracking-tighter leading-none text-primary">
                                {platformTitle}
                            </h1>
                            <p className="text-[10pt] font-bold text-slate-400 uppercase tracking-[0.2em]">Arquitectura Educativa Modular</p>
                        </div>
                    </div>

                    <div className="mt-20 flex justify-between items-end w-full border-t border-slate-100 pt-8">
                        <div className="text-left space-y-1">
                            <p className="text-[7pt] font-black uppercase text-slate-400 tracking-widest">Ingeniería y Desarrollo</p>
                            <p className="text-[10pt] font-bold uppercase">{design?.creators || "Equipo de Desarrollo"}</p>
                        </div>
                        <div className="text-right space-y-1">
                            <p className="text-[7pt] font-black uppercase text-slate-400 tracking-widest">Fecha de Emisión</p>
                            <p className="text-[10pt] font-black uppercase">{format(today, "MMMM yyyy", { locale: es })}</p>
                        </div>
                    </div>
                </div>

                <PageFooter design={design} pageNumber={1} />
            </div>

            {/* --- PÁGINA 2: PROPUESTA E INVERSIÓN --- */}
            <div className="print-page">
                <PageHeader design={design} />
                
                <div className="flex-1 flex flex-col justify-center px-[20mm] space-y-10">
                    <div className="text-center">
                        <h2 className="text-[24pt] font-black uppercase tracking-tighter leading-none mb-2 text-primary">PROPUESTA ECONÓMICA</h2>
                        <div className="inline-block px-4 py-1 bg-black text-white text-[8pt] font-black uppercase tracking-[0.3em]">
                            Inversión Institucional
                        </div>
                    </div>

                    <p className="text-[11pt] leading-relaxed text-justify text-slate-700 font-medium">
                        Estimados señores, presentamos la propuesta económica para la implementación del plan <strong>"{plan.name.toUpperCase()}"</strong>. Nuestra solución garantiza una gestión 100% digital, eficiente y escalable para su institución educativa.
                    </p>

                    <div className="py-12 px-10 border-2 border-black rounded-[2.5rem] bg-white shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <CreditCard className="w-24 h-24 text-black" />
                        </div>
                        <div className="grid grid-cols-12 gap-6 items-center relative z-10">
                            <div className="col-span-7 space-y-3">
                                <p className="text-[10pt] font-bold text-slate-400 uppercase tracking-widest">Suscripción Anual SaaS</p>
                                <h3 className="text-[24pt] font-black uppercase text-primary leading-tight tracking-tighter">
                                    {plan.name}
                                </h3>
                                <div className="flex items-center gap-2">
                                    <BadgeCheck className="h-5 w-5 text-green-600" />
                                    <span className="text-[9pt] font-black uppercase text-slate-600">Servicio y Soporte Incluido</span>
                                </div>
                            </div>
                            <div className="col-span-5 text-right border-l-2 border-slate-100 pl-8">
                                <p className="text-[9pt] font-bold text-slate-400 uppercase tracking-widest mb-1">Costo {plan.billingCycle}</p>
                                <div className="flex items-baseline justify-end gap-1 text-black">
                                    <span className="text-[16pt] font-bold">S/</span>
                                    <span className="text-[42pt] font-black leading-none">{plan.price.toFixed(0)}</span>
                                </div>
                                <p className="text-[7pt] font-bold text-slate-400 uppercase mt-2">Importe neto por sede</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                        <div className="flex flex-col items-center text-center p-6 border rounded-3xl bg-slate-50/50">
                            <ShieldCheck className="h-8 w-8 text-primary mb-3" />
                            <p className="text-[8pt] font-black uppercase tracking-widest text-slate-400 mb-1">Seguridad</p>
                            <p className="text-[10pt] font-bold text-slate-800">Cifrado SSL</p>
                        </div>
                        <div className="flex flex-col items-center text-center p-6 border rounded-3xl bg-slate-50/50">
                            <Globe className="h-8 w-8 text-primary mb-3" />
                            <p className="text-[8pt] font-black uppercase tracking-widest text-slate-400 mb-1">Acceso</p>
                            <p className="text-[10pt] font-bold text-slate-800">100% Nube</p>
                        </div>
                        <div className="flex flex-col items-center text-center p-6 border rounded-3xl bg-slate-50/50">
                            <Star className="h-8 w-8 text-primary mb-3" />
                            <p className="text-[8pt] font-black uppercase tracking-widest text-slate-400 mb-1">Garantía</p>
                            <p className="text-[10pt] font-bold text-slate-800">Soporte 24/7</p>
                        </div>
                    </div>
                </div>

                <PageFooter design={design} pageNumber={2} />
            </div>

            {/* --- PÁGINA 3: DESGLOSE TÉCNICO Y FIRMAS --- */}
            <div className="print-page">
                <PageHeader design={design} />
                
                <div className="flex-1 flex flex-col justify-center px-[20mm] space-y-12">
                    <div className="flex justify-between items-center pb-3 border-b-2 border-black">
                        <h3 className="text-[16pt] font-black uppercase tracking-tight flex items-center gap-3">
                            <ListChecks className="h-7 w-7 text-primary" /> Módulos y Capacidades
                        </h3>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                        {plan.features.map((feature, i) => {
                            const [name, description] = feature.split(':');
                            const items = description ? description.split(';').map(s => s.trim()).filter(Boolean) : [];

                            return (
                                <div key={i} className="space-y-2">
                                    <h4 className="text-[10pt] font-black text-primary uppercase tracking-tight border-l-4 border-primary pl-3 leading-none py-1 bg-primary/5">
                                        {name}
                                    </h4>
                                    <div className="space-y-1 ml-4">
                                        {items.length > 0 ? items.map((item, idx) => (
                                            <div key={idx} className="text-[8.5pt] text-slate-600 font-bold leading-tight flex items-start gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                                                <span>{item}</span>
                                            </div>
                                        )) : (
                                            <p className="text-[8.5pt] text-slate-400 italic">Habilitado según nivel de servicio.</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-12">
                        <div className="grid grid-cols-2 gap-24 text-center px-10">
                            <div className="border-t-2 border-black pt-2">
                                <p className="text-[10pt] font-black uppercase text-black">{design?.creators || "Ingeniería STEM"}</p>
                                <p className="text-[7pt] text-slate-400 font-bold uppercase tracking-widest">Dirección de Desarrollo</p>
                            </div>
                            <div className="border-t-2 border-black pt-2 text-black">
                                <p className="text-[10pt] font-black uppercase">Cliente Institucional</p>
                                <p className="text-[7pt] text-slate-400 font-bold uppercase tracking-widest">Sello y Firma de Aceptación</p>
                            </div>
                        </div>
                    </div>
                </div>

                <PageFooter design={design} pageNumber={3} />
            </div>
        </div>
    );
}
