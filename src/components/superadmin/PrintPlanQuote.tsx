
"use client";

import React from 'react';
import type { Plan, LoginDesign } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
    CheckCircle2, 
    ShieldCheck, 
    Globe, 
    Star,
    CreditCard,
    ListChecks
} from 'lucide-react';

interface PrintPlanQuoteProps {
    plan: Plan;
    design: LoginDesign | null;
}

/**
 * Componente de Encabezado Institucional
 * Diseño minimalista sin líneas y altura de 25mm.
 */
const PageHeader = ({ design }: { design: LoginDesign | null }) => {
    const platformTitle = design?.title || "STEM V2";
    const platformLogo = design?.logoUrl;
    
    return (
        <div className="absolute top-0 left-0 w-full h-[25mm] flex items-center justify-between px-[15mm] bg-white z-10">
            <div className="flex items-center gap-4">
                {platformLogo ? (
                    <img src={platformLogo} alt="Logo" className="w-8 h-8 object-contain" />
                ) : (
                    <div className="w-8 h-8 bg-black text-white flex items-center justify-center rounded-lg">
                        <span className="text-[6pt] font-black italic">STEM</span>
                    </div>
                )}
                <div className="text-left">
                    <h1 className="text-[10pt] font-black uppercase leading-tight text-black">{platformTitle}</h1>
                    <p className="text-[6pt] font-bold text-slate-400 uppercase tracking-widest">Propuesta Técnica Comercial</p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-[7pt] font-black text-black uppercase mb-0.5">Documento Oficial</p>
                <p className="text-[6pt] font-mono font-bold text-gray-300">REF: {format(new Date(), 'yyyyMMdd')}-SAAS</p>
            </div>
        </div>
    );
};

/**
 * Componente de Pie de Página
 * Fijado físicamente a 10mm del borde inferior.
 * Recibe el número de página para evitar errores de contadores CSS.
 */
const PageFooter = ({ design, pageNumber }: { design: LoginDesign | null, pageNumber: string }) => {
    const platformTitle = design?.title || "STEM V2";
    return (
        <div className="absolute bottom-[10mm] left-0 w-full h-[10mm] flex justify-between items-center px-[15mm] bg-white z-10">
            <div className="text-left">
                <p className="text-[6.5pt] text-slate-400 font-black uppercase tracking-[0.2em] leading-none mb-0.5">
                    {platformTitle} • ECOSISTEMA EDUCATIVO
                </p>
                <p className="text-[5.5pt] text-slate-300 font-bold uppercase italic">Generado digitalmente por la plataforma central</p>
            </div>
            <div className="text-right">
                <p className="text-[7.5pt] font-black text-black uppercase tracking-tighter">PÁGINA {pageNumber} / 03</p>
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
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .print-page {
                        width: 210mm;
                        height: 297mm;
                        display: block !important;
                        page-break-after: always !important;
                        break-after: page !important;
                        overflow: hidden !important;
                        background: white !important;
                        box-sizing: border-box !important;
                        position: relative !important;
                    }
                    .content-area {
                        position: absolute;
                        top: 30mm;
                        left: 15mm;
                        right: 15mm;
                        bottom: 25mm;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
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
                        display: block;
                        background: white;
                        box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                        overflow: hidden;
                        position: relative;
                    }
                    .content-area {
                        position: absolute;
                        top: 30mm;
                        left: 15mm;
                        right: 15mm;
                        bottom: 25mm;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                    }
                }
            `}</style>

            {/* --- PÁGINA 1: PORTADA --- */}
            <div className="print-page">
                <PageHeader design={design} />
                
                <div className="content-area text-center">
                    <p className="text-[12pt] font-black tracking-[0.6em] text-slate-300 uppercase mb-12">Propuesta preparada para:</p>
                    
                    <div className="w-full bg-slate-50 border-y-2 border-black py-16 mb-16 shadow-inner">
                        <h2 className="text-[34pt] font-black uppercase tracking-tighter text-black px-6 leading-tight">
                            {plan.name}
                        </h2>
                    </div>

                    <div className="flex flex-col items-center gap-6">
                        <div className="space-y-3">
                            {design?.logoUrl && <img src={design.logoUrl} alt="Logo" className="h-20 w-auto mx-auto mb-4 object-contain" />}
                            <h1 className="text-[26pt] font-black uppercase tracking-tighter leading-none text-primary">
                                {platformTitle}
                            </h1>
                            <p className="text-[11pt] font-bold text-slate-400 uppercase tracking-[0.3em]">Arquitectura Educativa Modular</p>
                        </div>
                    </div>

                    <div className="mt-24 w-full flex justify-between items-end border-t border-slate-100 pt-8 px-12">
                        <div className="text-left space-y-1">
                            <p className="text-[8pt] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Ingeniería y Desarrollo</p>
                            <p className="text-[10pt] font-bold uppercase text-black">{design?.creators || "Equipo de Desarrollo"}</p>
                        </div>
                        <div className="text-right space-y-1">
                            <p className="text-[8pt] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Fecha de Emisión</p>
                            <p className="text-[10pt] font-black uppercase text-black">{format(today, "MMMM yyyy", { locale: es })}</p>
                        </div>
                    </div>
                </div>

                <PageFooter design={design} pageNumber="01" />
            </div>

            {/* --- PÁGINA 2: PROPUESTA E INVERSIÓN --- */}
            <div className="print-page">
                <PageHeader design={design} />
                
                <div className="content-area space-y-10">
                    <div className="text-center">
                        <h2 className="text-[26pt] font-black uppercase tracking-tighter leading-none mb-3 text-primary">PROPUESTA ECONÓMICA</h2>
                        <div className="inline-block px-6 py-1.5 bg-black text-white text-[9pt] font-black uppercase tracking-[0.4em] rounded-sm">
                            Inversión Institucional
                        </div>
                    </div>

                    <p className="text-[12pt] leading-relaxed text-justify text-slate-700 font-medium px-4">
                        Estimados señores, presentamos la propuesta económica para la implementación del plan <strong>"{plan.name.toUpperCase()}"</strong>. Nuestra solución garantiza una gestión 100% digital, eficiente y escalable, diseñada para optimizar los procesos de su institución.
                    </p>

                    <div className="py-12 px-12 border-2 border-black rounded-[3rem] bg-white shadow-2xl relative overflow-hidden mx-4">
                        <div className="absolute top-0 right-0 p-10 opacity-[0.03]">
                            <CreditCard className="w-32 h-32 text-black" />
                        </div>
                        <div className="grid grid-cols-12 gap-6 items-center relative z-10">
                            <div className="col-span-7 space-y-4">
                                <p className="text-[11pt] font-bold text-slate-400 uppercase tracking-widest">Suscripción SaaS {plan.billingCycle}</p>
                                <h3 className="text-[28pt] font-black uppercase text-primary leading-tight tracking-tighter">
                                    {plan.name}
                                </h3>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                    <span className="text-[10pt] font-black uppercase text-slate-600 tracking-tight">Soporte y Actualizaciones Incluidas</span>
                                </div>
                            </div>
                            <div className="col-span-5 text-right border-l-2 border-slate-100 pl-10">
                                <p className="text-[10pt] font-bold text-slate-400 uppercase tracking-widest mb-1">Monto {plan.billingCycle}</p>
                                <div className="flex items-baseline justify-end gap-1 text-black">
                                    <span className="text-[18pt] font-bold">S/</span>
                                    <span className="text-[48pt] font-black leading-none">{plan.price.toFixed(0)}</span>
                                </div>
                                <p className="text-[8pt] font-black text-slate-500 uppercase mt-2 tracking-tighter">Importe neto por sede</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-8 px-4">
                        <div className="flex flex-col items-center text-center p-6 border rounded-[2rem] bg-slate-50/50 shadow-sm">
                            <ShieldCheck className="h-10 w-10 text-primary mb-3" />
                            <p className="text-[8pt] font-black uppercase tracking-widest text-slate-400 mb-1">Seguridad</p>
                            <p className="text-[11pt] font-bold text-slate-800">Cifrado SSL</p>
                        </div>
                        <div className="flex flex-col items-center text-center p-6 border rounded-[2rem] bg-slate-50/50 shadow-sm">
                            <Globe className="h-10 w-10 text-primary mb-3" />
                            <p className="text-[8pt] font-black uppercase tracking-widest text-slate-400 mb-1">Acceso</p>
                            <p className="text-[11pt] font-bold text-slate-800">100% Nube</p>
                        </div>
                        <div className="flex flex-col items-center text-center p-6 border rounded-[2rem] bg-slate-50/50 shadow-sm">
                            <Star className="h-10 w-10 text-primary mb-3" />
                            <p className="text-[8pt] font-black uppercase tracking-widest text-slate-400 mb-1">Garantía</p>
                            <p className="text-[11pt] font-bold text-slate-800">Soporte 24/7</p>
                        </div>
                    </div>
                </div>

                <PageFooter design={design} pageNumber="02" />
            </div>

            {/* --- PÁGINA 3: DESGLOSE TÉCNICO Y FIRMAS --- */}
            <div className="print-page">
                <PageHeader design={design} />
                
                <div className="content-area space-y-12">
                    <div className="flex justify-between items-center pb-4 border-b-2 border-black mx-4">
                        <h3 className="text-[18pt] font-black uppercase tracking-tight flex items-center gap-3">
                            <ListChecks className="h-8 w-8 text-primary" /> Módulos Incluidos
                        </h3>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-12 gap-y-8 px-4">
                        {plan.features.map((feature, i) => {
                            const [name, description] = feature.split(':');
                            const items = description ? description.split(';').map(s => s.trim()).filter(Boolean) : [];

                            return (
                                <div key={i} className="space-y-2.5">
                                    <h4 className="text-[10pt] font-black text-primary uppercase tracking-tight border-l-4 border-primary pl-4 leading-none py-1.5 bg-primary/5 rounded-r-lg">
                                        {name}
                                    </h4>
                                    <div className="space-y-1.5 ml-6">
                                        {items.length > 0 ? items.map((item, idx) => (
                                            <div key={idx} className="text-[9pt] text-slate-600 font-bold leading-tight flex items-start gap-2.5">
                                                <div className="h-1.5 w-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                                                <span>{item}</span>
                                            </div>
                                        )) : (
                                            <p className="text-[9pt] text-slate-400 italic">Habilitado según nivel de servicio.</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-auto pb-6">
                        <div className="grid grid-cols-2 gap-32 text-center px-16">
                            <div className="border-t-2 border-black pt-3">
                                <p className="text-[10pt] font-black uppercase text-black">{design?.creators || "Ingeniería STEM"}</p>
                                <p className="text-[8pt] text-slate-400 font-bold uppercase tracking-widest">Dirección de Desarrollo</p>
                            </div>
                            <div className="border-t-2 border-black pt-3 text-black">
                                <p className="text-[10pt] font-black uppercase">Firma del Cliente</p>
                                <p className="text-[8pt] text-slate-400 font-bold uppercase tracking-widest">Sello de Aceptación</p>
                            </div>
                        </div>
                    </div>
                </div>

                <PageFooter design={design} pageNumber="03" />
            </div>
        </div>
    );
}
