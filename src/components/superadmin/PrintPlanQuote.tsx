
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
    ListChecks,
    Info
} from 'lucide-react';

interface PrintPlanQuoteProps {
    plan: Plan;
    design: LoginDesign | null;
}

/**
 * Encabezado que se repetirá en las páginas del cuerpo (2 y 3)
 */
const PageHeader = ({ design }: { design: LoginDesign | null }) => {
    const platformTitle = design?.title || "STEM V2";
    const platformLogo = design?.logoUrl;
    
    return (
        <div className="w-full py-4 flex items-center justify-between bg-white">
            <div className="flex items-center gap-4">
                {platformLogo ? (
                    <img src={platformLogo} alt="Logo" className="w-10 h-10 object-contain" />
                ) : (
                    <div className="w-10 h-10 bg-black text-white flex items-center justify-center rounded-lg">
                        <span className="text-[6pt] font-black italic">STEM</span>
                    </div>
                )}
                <div className="text-left">
                    <h1 className="text-[11pt] font-black uppercase leading-tight text-black">{platformTitle}</h1>
                    <p className="text-[7pt] font-bold text-slate-400 uppercase tracking-widest">Propuesta Técnica Comercial</p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-[7pt] font-black text-black uppercase mb-0.5">Documento Oficial</p>
                <p className="text-[6pt] font-mono font-bold text-gray-300">REF: {format(new Date(), 'yyyyMMdd')}-SAAS</p>
            </div>
        </div>
    );
};

export function PrintPlanQuote({ plan, design }: PrintPlanQuoteProps) {
    const today = new Date();
    const platformTitle = design?.title || "STEM V2";
    const platformCreators = design?.creators || "Equipo de Desarrollo";

    return (
        <div className="quote-print-system bg-white text-black font-sans leading-normal">
            <style jsx global>{`
                @media screen {
                    .quote-print-system {
                        max-width: 210mm;
                        margin: 20px auto;
                        box-shadow: 0 0 20px rgba(0,0,0,0.1);
                    }
                }
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 10mm 15mm 10mm 15mm;
                    }
                    body {
                        background: white !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                        margin: 0;
                        padding: 0;
                    }
                    .quote-print-system {
                        counter-reset: page;
                    }
                    .page-break-after {
                        page-break-after: always;
                        break-after: page;
                    }
                    .page-break-before {
                        page-break-before: always;
                        break-before: page;
                    }
                    /* Lógica de tabla para repetir encabezado */
                    .print-table {
                        width: 100%;
                        border-collapse: collapse;
                    }
                    .print-table thead {
                        display: table-header-group;
                    }
                    /* Pie de página fijo a 10mm */
                    .fixed-footer {
                        position: fixed;
                        bottom: 10mm;
                        left: 0;
                        right: 0;
                        height: 12mm;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        font-size: 7.5pt;
                        color: #94a3b8;
                        background: white;
                        z-index: 100;
                    }
                    .page-number:after {
                        content: "PÁGINA " counter(page, decimal-leading-zero) " / 03";
                    }
                }
            `}</style>

            {/* --- PÁGINA 1: PORTADA --- */}
            <div className="cover-page page-break-after h-[275mm] flex flex-col items-center justify-between py-20 text-center relative bg-white">
                <div className="w-full flex flex-col items-center">
                    <p className="text-[12pt] font-black tracking-[0.6em] text-slate-200 uppercase mb-16">Propuesta de Implementación</p>
                    
                    <div className="w-full border-y border-slate-100 py-16 mb-12">
                        <h2 className="text-[36pt] font-black uppercase tracking-tighter text-primary leading-tight px-10">
                            {plan.name}
                        </h2>
                    </div>

                    {design?.logoUrl && (
                        <div className="mb-8">
                            <img src={design.logoUrl} alt="Logo" className="h-32 w-auto object-contain mx-auto" />
                        </div>
                    )}
                    
                    <h1 className="text-[22pt] font-black uppercase tracking-tighter text-black">
                        {platformTitle}
                    </h1>
                    <p className="text-[10pt] font-bold text-slate-400 uppercase tracking-[0.3em] mt-2">Ecosistema Educativo Modular</p>
                </div>

                <div className="w-full flex justify-between items-end border-t border-slate-100 pt-8 px-12">
                    <div className="text-left space-y-1">
                        <p className="text-[8pt] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Desarrollo e Ingeniería</p>
                        <p className="text-[10pt] font-bold uppercase text-black">{platformCreators}</p>
                    </div>
                    <div className="text-right space-y-1">
                        <p className="text-[8pt] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Emisión</p>
                        <p className="text-[10pt] font-black uppercase text-black">{format(today, "MMMM yyyy", { locale: es })}</p>
                    </div>
                </div>
            </div>

            {/* --- CUERPO DEL DOCUMENTO (PAG 2 Y 3) --- */}
            <table className="print-table">
                <thead>
                    <tr>
                        <td>
                            <div className="px-6">
                                <PageHeader design={design} />
                            </div>
                        </td>
                    </tr>
                </thead>
                <tbody>
                    {/* --- PÁGINA 2: PROPUESTA ECONÓMICA --- */}
                    <tr>
                        <td className="py-8">
                            <div className="space-y-12 px-10">
                                <div className="text-center space-y-4">
                                    <h2 className="text-[24pt] font-black uppercase tracking-tighter leading-none text-primary">Propuesta Económica</h2>
                                    <div className="inline-block px-6 py-1 bg-black text-white text-[8pt] font-black uppercase tracking-[0.4em]">Inversión Corporativa</div>
                                </div>

                                <p className="text-[11pt] leading-relaxed text-justify text-slate-700 font-medium">
                                    Presentamos la estructura de costos para la implementación del plan <strong>"{plan.name.toUpperCase()}"</strong>. Nuestra solución garantiza una gestión 100% digital, escalable y con soporte técnico especializado permanente.
                                </p>

                                <div className="py-12 px-10 border-2 border-black rounded-[2.5rem] bg-white shadow-xl relative overflow-hidden">
                                    <div className="grid grid-cols-12 gap-6 items-center">
                                        <div className="col-span-7 space-y-4">
                                            <p className="text-[10pt] font-bold text-slate-400 uppercase tracking-widest">Suscripción SaaS {plan.billingCycle}</p>
                                            <h3 className="text-[26pt] font-black uppercase text-primary leading-tight tracking-tighter">{plan.name}</h3>
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                                <span className="text-[9pt] font-black uppercase text-slate-600">Soporte y Actualizaciones Cloud</span>
                                            </div>
                                        </div>
                                        <div className="col-span-5 text-right border-l border-slate-100 pl-10">
                                            <p className="text-[9pt] font-bold text-slate-400 uppercase tracking-widest mb-1">Inversión {plan.billingCycle}</p>
                                            <div className="flex items-baseline justify-end gap-1 text-black">
                                                <span className="text-[16pt] font-bold">S/</span>
                                                <span className="text-[42pt] font-black leading-none">{plan.price.toFixed(0)}</span>
                                            </div>
                                            <p className="text-[8pt] font-black text-slate-400 uppercase mt-2 tracking-tighter">Importe neto por sede</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-6">
                                    <div className="flex flex-col items-center text-center p-6 border rounded-3xl bg-slate-50/50">
                                        <ShieldCheck className="h-8 w-8 text-primary mb-2" />
                                        <p className="text-[7pt] font-black uppercase text-slate-400">Seguridad</p>
                                        <p className="text-[10pt] font-bold">Cifrado SSL</p>
                                    </div>
                                    <div className="flex flex-col items-center text-center p-6 border rounded-3xl bg-slate-50/50">
                                        <Globe className="h-8 w-8 text-primary mb-2" />
                                        <p className="text-[7pt] font-black uppercase text-slate-400">Acceso</p>
                                        <p className="text-[10pt] font-bold">24/7 Cloud</p>
                                    </div>
                                    <div className="flex flex-col items-center text-center p-6 border rounded-3xl bg-slate-50/50">
                                        <Star className="h-8 w-8 text-primary mb-2" />
                                        <p className="text-[7pt] font-black uppercase text-slate-400">Garantía</p>
                                        <p className="text-[10pt] font-bold">Respaldo Google</p>
                                    </div>
                                </div>
                            </div>
                        </td>
                    </tr>

                    {/* --- PÁGINA 3: DESGLOSE TÉCNICO (FORZAMOS SALTO) --- */}
                    <tr style={{ breakBefore: 'page' }}>
                        <td className="py-8">
                            <div className="space-y-8 px-10">
                                <h3 className="text-[18pt] font-black uppercase tracking-tight flex items-center gap-3 border-b-2 border-black pb-2">
                                    <ListChecks className="h-6 w-6 text-primary" /> Módulos y Capacidades Incluidas
                                </h3>
                                
                                <div className="grid grid-cols-2 gap-x-10 gap-y-8">
                                    {plan.features.map((feature, i) => {
                                        const [name, ...descParts] = feature.split(':');
                                        const description = descParts.join(':');
                                        const items = description ? description.split(';').map(s => s.trim()).filter(Boolean) : [];

                                        return (
                                            <div key={i} className="space-y-2">
                                                <h4 className="text-[9.5pt] font-black text-primary uppercase border-l-4 border-primary pl-3 leading-none py-1 bg-primary/5 tracking-tighter">
                                                    {name}
                                                </h4>
                                                <div className="ml-5 space-y-1.5">
                                                    {items.length > 0 ? items.map((item, itemIdx) => (
                                                        <div key={itemIdx} className="text-[8.5pt] text-slate-600 font-medium leading-tight flex items-start gap-1.5">
                                                            <div className="h-1 w-1 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                                                            <span>{item}</span>
                                                        </div>
                                                    )) : (
                                                        <p className="text-[8.5pt] text-slate-600 font-medium leading-tight ml-4">
                                                            Funcionalidad completa habilitada.
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="pt-20 mt-auto no-print-break">
                                    <div className="grid grid-cols-2 gap-24 text-center px-10">
                                        <div className="border-t-2 border-black pt-2">
                                            <p className="text-[9pt] font-black uppercase text-black">{platformCreators}</p>
                                            <p className="text-[7pt] text-slate-400 font-bold uppercase">Dirección de Ingeniería</p>
                                        </div>
                                        <div className="border-t-2 border-black pt-2 text-black">
                                            <p className="text-[9pt] font-black uppercase">Sello de Aceptación</p>
                                            <p className="text-[7pt] text-slate-400 font-bold uppercase">Firma del Cliente</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* PIE DE PÁGINA FIJO INSTITUCIONAL (10mm margen inferior) */}
            <div className="fixed-footer px-10">
                <div className="text-left">
                    <p className="font-black uppercase tracking-[0.2em]">{platformTitle} • {format(new Date(), "yyyy")}</p>
                </div>
                <div className="page-number font-black uppercase tracking-widest"></div>
            </div>
        </div>
    );
}
