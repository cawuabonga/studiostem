
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
    BadgeCheck
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PrintPlanQuoteProps {
    plan: Plan;
    design: LoginDesign | null;
}

/**
 * Encabezado Institucional que se repite en cada hoja
 */
const Header = ({ design, pageNumber }: { design: LoginDesign | null, pageNumber: number }) => {
    const platformTitle = design?.title || "STEM V2";
    const platformLogo = design?.logoUrl;
    const today = new Date();

    return (
        <div className="w-full border-b-2 border-black pb-4 flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
                {platformLogo ? (
                    <img src={platformLogo} alt="Logo" className="w-12 h-12 object-contain" />
                ) : (
                    <div className="w-10 h-10 bg-black text-white flex items-center justify-center rounded-lg">
                        <span className="text-[8pt] font-black italic">STEM</span>
                    </div>
                )}
                <div className="text-left">
                    <h1 className="text-[11pt] font-black uppercase leading-tight text-black">{platformTitle}</h1>
                    <p className="text-[6.5pt] font-bold text-slate-500 uppercase tracking-widest">Documento de Propuesta Técnica</p>
                </div>
            </div>
            <div className="text-right">
                <div className="bg-black text-white px-3 py-1 rounded text-[8pt] font-black uppercase mb-1">
                    PÁGINA 0{pageNumber} / 03
                </div>
                <p className="text-[7pt] font-mono font-bold text-black">{format(today, 'dd/MM/yyyy')}</p>
            </div>
        </div>
    );
};

/**
 * Pie de página Institucional que se repite en cada hoja
 */
const Footer = ({ design }: { design: LoginDesign | null }) => {
    const platformTitle = design?.title || "STEM V2";
    return (
        <div className="pt-4 border-t border-slate-200 flex justify-between items-center w-full mt-auto">
            <div className="text-left">
                <p className="text-[7pt] text-slate-400 font-black uppercase tracking-[0.3em] leading-none mb-1">
                    {platformTitle} • ECOSISTEMA EDUCATIVO MODULAR
                </p>
                <p className="text-[6pt] text-slate-300 font-bold uppercase italic">Este documento tiene validez digital mediante firma electrónica de servidor</p>
            </div>
            <div className="text-right">
                <p className="text-[7pt] font-black text-slate-400 uppercase">{design?.creators || "STEM Dev Team"}</p>
            </div>
        </div>
    );
};

export function PrintPlanQuote({ plan, design }: PrintPlanQuoteProps) {
    const today = new Date();
    const platformTitle = design?.title || "STEM V2";

    return (
        <div className="quote-print-container bg-white text-black">
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
                }
                .a4-page {
                    width: 210mm;
                    height: 297mm;
                    padding: 20mm;
                    margin: 0 auto;
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                    page-break-after: always;
                    overflow: hidden;
                    position: relative;
                    background: white;
                }
                @media screen {
                    .a4-page {
                        margin-bottom: 20px;
                        box-shadow: 0 0 10px rgba(0,0,0,0.1);
                        border: 1px solid #eee;
                    }
                }
            `}</style>

            {/* --- PÁGINA 1: CARÁTULA --- */}
            <div className="a4-page">
                <Header design={design} pageNumber={1} />
                
                <div className="flex-1 flex flex-col items-center justify-center text-center px-10">
                    <div className="space-y-4 mb-16">
                        <p className="text-[14pt] font-black tracking-[0.6em] text-slate-300 uppercase">Propuesta de Servicio</p>
                        <div className="h-1.5 w-32 bg-black mx-auto"></div>
                    </div>

                    <div className="flex flex-col items-center gap-12 mb-20">
                        {design?.logoUrl ? (
                            <img src={design.logoUrl} alt="Logo" className="h-48 w-48 object-contain" />
                        ) : (
                            <div className="w-40 h-40 bg-black text-white flex items-center justify-center rounded-[2.5rem]">
                                <span className="text-4xl font-black italic">STEM</span>
                            </div>
                        )}
                        
                        <div className="space-y-4">
                            <h1 className="text-[36pt] font-black uppercase tracking-tighter leading-none text-black">
                                {platformTitle}
                            </h1>
                            <p className="text-[13pt] font-bold text-slate-400 uppercase tracking-[0.2em]">Gestión Tecnológica de Vanguardia</p>
                        </div>
                    </div>

                    <div className="w-full max-w-xl bg-slate-50 border-y-2 border-black py-12">
                        <p className="text-[10pt] font-black text-primary uppercase tracking-[0.4em] mb-4">Cotización preparada para:</p>
                        <h2 className="text-[28pt] font-black uppercase tracking-tight text-black px-6">
                            {plan.name}
                        </h2>
                    </div>
                </div>

                <div className="flex justify-between items-end px-4 mb-10">
                    <div className="space-y-1">
                        <p className="text-[8pt] font-black uppercase text-slate-400 tracking-widest">Ingeniería y Desarrollo</p>
                        <p className="text-[11pt] font-bold uppercase">{design?.creators || "Equipo de Desarrollo"}</p>
                    </div>
                    <div className="text-right space-y-1">
                        <p className="text-[8pt] font-black uppercase text-slate-400 tracking-widest">Emisión</p>
                        <p className="text-[11pt] font-black uppercase">{format(today, "MMMM yyyy", { locale: es })}</p>
                    </div>
                </div>

                <Footer design={design} />
            </div>

            {/* --- PÁGINA 2: PROPUESTA ECONÓMICA --- */}
            <div className="a4-page">
                <Header design={design} pageNumber={2} />

                <div className="flex-1">
                    <div className="text-center mb-12">
                        <h2 className="text-[26pt] font-black uppercase tracking-tighter leading-none mb-3">PROPUESTA ECONÓMICA</h2>
                        <div className="inline-block px-6 py-1.5 bg-black text-white text-[9pt] font-black uppercase tracking-[0.3em]">
                            Confidencial Institucional
                        </div>
                    </div>

                    <div className="space-y-10">
                        <p className="text-[11pt] leading-relaxed text-justify text-slate-700 font-medium px-6">
                            Tras analizar las necesidades de su institución, presentamos la propuesta económica para la implementación del plan <strong>"{plan.name.toUpperCase()}"</strong>. Nuestra solución garantiza una gestión 100% digital, optimizada para la acreditación y el control administrativo centralizado.
                        </p>

                        {/* Cuadro de Inversión */}
                        <div className="py-12 px-10 border-2 border-black rounded-[2.5rem] bg-white shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <CreditCard className="w-32 h-32 text-black" />
                            </div>
                            <div className="grid grid-cols-12 gap-8 items-center relative z-10">
                                <div className="col-span-7 space-y-3">
                                    <p className="text-[10pt] font-bold text-slate-400 uppercase tracking-widest">Suscripción de Servicio</p>
                                    <h3 className="text-[28pt] font-black uppercase text-black leading-tight tracking-tighter">
                                        {plan.name}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <BadgeCheck className="h-5 w-5 text-green-600" />
                                        <span className="text-[9pt] font-black uppercase text-slate-600">Disponibilidad Garantizada 99.9%</span>
                                    </div>
                                </div>
                                <div className="col-span-5 text-right border-l border-slate-100 pl-10">
                                    <p className="text-[10pt] font-bold text-slate-400 uppercase tracking-widest mb-1">Inversión {plan.billingCycle}</p>
                                    <div className="flex items-baseline justify-end gap-1 text-black">
                                        <span className="text-[16pt] font-bold">S/</span>
                                        <span className="text-[46pt] font-black leading-none">{plan.price.toFixed(0)}</span>
                                    </div>
                                    <p className="text-[8pt] font-bold text-slate-400 uppercase mt-2">Importe neto por sede</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6 px-4">
                            {[
                                { icon: ShieldCheck, t: "Seguridad", v: "Cifrado SSL" },
                                { icon: Globe, t: "Hosting", v: "Nube Google" },
                                { icon: Cpu, t: "IA", v: "Motor Híbrido" }
                            ].map((item, i) => (
                                <div key={i} className="flex flex-col items-center text-center p-6 border rounded-3xl bg-slate-50/50">
                                    <item.icon className="h-8 w-8 text-black mb-3" />
                                    <p className="text-[8pt] font-black uppercase tracking-widest text-slate-400 mb-1">{item.t}</p>
                                    <p className="text-[10pt] font-bold text-slate-800">{item.v}</p>
                                </div>
                            ))}
                        </div>

                        <div className="p-8 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 mx-6">
                            <h4 className="text-[9pt] font-black uppercase text-slate-400 tracking-widest mb-3 flex items-center gap-2">
                                <Info className="h-4 w-4" /> Resumen del Plan
                            </h4>
                            <p className="text-[10pt] text-slate-600 leading-relaxed italic font-medium">
                                "{plan.description}"
                            </p>
                        </div>
                    </div>
                </div>

                <Footer design={design} />
            </div>

            {/* --- PÁGINA 3: DESGLOSE TÉCNICO --- */}
            <div className="a4-page">
                <Header design={design} pageNumber={3} />

                <div className="flex-1 px-4">
                    <div className="flex justify-between items-center mb-8 pb-2 border-b-2 border-black">
                        <h3 className="text-[16pt] font-black uppercase tracking-tight flex items-center gap-3">
                            <ListChecks className="h-7 w-7 text-primary" /> Módulos y Capacidades
                        </h3>
                        <Badge variant="outline" className="font-black uppercase text-[8pt] border-black px-4 h-7">{plan.name}</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                        {plan.features.map((feature, i) => {
                            const [name, description] = feature.split(':');
                            const items = description ? description.split(';').map(s => s.trim()).filter(Boolean) : [];

                            return (
                                <div key={i} className="space-y-2">
                                    <h4 className="text-[10.5pt] font-black text-black uppercase tracking-tight border-l-4 border-black pl-3">
                                        {name}
                                    </h4>
                                    <div className="space-y-1 ml-4">
                                        {items.length > 0 ? items.map((item, idx) => (
                                            <div key={idx} className="text-[9pt] text-slate-600 font-bold leading-snug flex items-start gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                                                <span>{item}</span>
                                            </div>
                                        )) : (
                                            <p className="text-[8.5pt] text-slate-400 italic">Módulo habilitado por defecto.</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-24 pt-16">
                        <div className="grid grid-cols-2 gap-24 text-center">
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

                <Footer design={design} />
            </div>
        </div>
    );
}
