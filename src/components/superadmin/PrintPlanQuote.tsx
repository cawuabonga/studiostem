
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
 * Encabezado Institucional - Tamaño de logo reducido
 */
const PageHeader = ({ design, pageNumber }: { design: LoginDesign | null, pageNumber: number }) => {
    const platformTitle = design?.title || "STEM V2";
    const platformLogo = design?.logoUrl;
    const today = new Date();

    return (
        <div className="absolute top-[15mm] left-[20mm] right-[20mm] border-b-2 border-black pb-4 flex items-center justify-between z-50">
            <div className="flex items-center gap-3">
                {platformLogo ? (
                    <img src={platformLogo} alt="Logo" className="w-8 h-8 object-contain" />
                ) : (
                    <div className="w-8 h-8 bg-black text-white flex items-center justify-center rounded-lg">
                        <span className="text-[6pt] font-black italic">STEM</span>
                    </div>
                )}
                <div className="text-left">
                    <h1 className="text-[10pt] font-black uppercase leading-tight text-black">{platformTitle}</h1>
                    <p className="text-[6pt] font-bold text-slate-500 uppercase tracking-widest">Propuesta Técnica Comercial</p>
                </div>
            </div>
            <div className="text-right">
                <div className="bg-black text-white px-2 py-0.5 rounded text-[7pt] font-black uppercase mb-1">
                    PÁGINA 0{pageNumber} / 03
                </div>
                <p className="text-[6pt] font-mono font-bold text-black">{format(today, 'dd/MM/yyyy')}</p>
            </div>
        </div>
    );
};

/**
 * Pie de página Institucional - Posición absoluta al fondo
 */
const PageFooter = ({ design }: { design: LoginDesign | null }) => {
    const platformTitle = design?.title || "STEM V2";
    return (
        <div className="absolute bottom-[15mm] left-[20mm] right-[20mm] pt-2 border-t border-slate-200 flex justify-between items-center z-50">
            <div className="text-left">
                <p className="text-[6.5pt] text-slate-400 font-black uppercase tracking-[0.3em] leading-none mb-0.5">
                    {platformTitle} • ECOSISTEMA EDUCATIVO MODULAR
                </p>
                <p className="text-[5.5pt] text-slate-300 font-bold uppercase italic">Validez digital certificada mediante firma electrónica de servidor</p>
            </div>
            <div className="text-right">
                <p className="text-[6.5pt] font-black text-slate-400 uppercase">{design?.creators || "STEM Dev Team"}</p>
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
                    margin: 0 auto;
                    position: relative;
                    background: white;
                    overflow: hidden;
                    page-break-after: always;
                }
                .content-box {
                    position: absolute;
                    top: 50mm;
                    bottom: 40mm;
                    left: 20mm;
                    right: 20mm;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
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
                <PageHeader design={design} pageNumber={1} />
                
                <div className="content-box text-center px-10">
                    <div className="space-y-4 mb-12">
                        <p className="text-[12pt] font-black tracking-[0.6em] text-slate-300 uppercase">Propuesta de Servicio</p>
                        <div className="h-1 w-24 bg-black mx-auto"></div>
                    </div>

                    <div className="flex flex-col items-center gap-10 mb-16">
                        {design?.logoUrl ? (
                            <img src={design.logoUrl} alt="Logo" className="h-32 w-32 object-contain" />
                        ) : (
                            <div className="w-24 h-24 bg-black text-white flex items-center justify-center rounded-[2rem]">
                                <span className="text-3xl font-black italic">STEM</span>
                            </div>
                        )}
                        
                        <div className="space-y-3">
                            <h1 className="text-[32pt] font-black uppercase tracking-tighter leading-none text-black">
                                {platformTitle}
                            </h1>
                            <p className="text-[11pt] font-bold text-slate-400 uppercase tracking-[0.2em]">Gestión Tecnológica de Vanguardia</p>
                        </div>
                    </div>

                    <div className="w-full bg-slate-50 border-y-2 border-black py-10">
                        <p className="text-[9pt] font-black text-primary uppercase tracking-[0.4em] mb-3">Cotización preparada para:</p>
                        <h2 className="text-[24pt] font-black uppercase tracking-tight text-black px-6">
                            {plan.name}
                        </h2>
                    </div>

                    <div className="mt-20 flex justify-between items-end px-4">
                        <div className="text-left space-y-1">
                            <p className="text-[7.5pt] font-black uppercase text-slate-400 tracking-widest">Ingeniería y Desarrollo</p>
                            <p className="text-[10pt] font-bold uppercase">{design?.creators || "Equipo de Desarrollo"}</p>
                        </div>
                        <div className="text-right space-y-1">
                            <p className="text-[7.5pt] font-black uppercase text-slate-400 tracking-widest">Emisión</p>
                            <p className="text-[10pt] font-black uppercase">{format(today, "MMMM yyyy", { locale: es })}</p>
                        </div>
                    </div>
                </div>

                <PageFooter design={design} />
            </div>

            {/* --- PÁGINA 2: PROPUESTA ECONÓMICA --- */}
            <div className="a4-page">
                <PageHeader design={design} pageNumber={2} />

                <div className="content-box">
                    <div className="text-center mb-10">
                        <h2 className="text-[22pt] font-black uppercase tracking-tighter leading-none mb-2">PROPUESTA ECONÓMICA</h2>
                        <div className="inline-block px-5 py-1 bg-black text-white text-[8pt] font-black uppercase tracking-[0.3em]">
                            Confidencial Institucional
                        </div>
                    </div>

                    <div className="space-y-8">
                        <p className="text-[10pt] leading-relaxed text-justify text-slate-700 font-medium px-4">
                            Tras analizar las necesidades de su institución, presentamos la propuesta económica para la implementación del plan <strong>"{plan.name.toUpperCase()}"</strong>. Nuestra solución garantiza una gestión 100% digital y segura.
                        </p>

                        {/* Cuadro de Inversión */}
                        <div className="py-10 px-8 border-2 border-black rounded-[2rem] bg-white shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-5">
                                <CreditCard className="w-24 h-24 text-black" />
                            </div>
                            <div className="grid grid-cols-12 gap-6 items-center relative z-10">
                                <div className="col-span-7 space-y-2">
                                    <p className="text-[9pt] font-bold text-slate-400 uppercase tracking-widest">Suscripción de Servicio</p>
                                    <h3 className="text-[24pt] font-black uppercase text-black leading-tight tracking-tighter">
                                        {plan.name}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <BadgeCheck className="h-4 w-4 text-green-600" />
                                        <span className="text-[8pt] font-black uppercase text-slate-600">Disponibilidad Garantizada 99.9%</span>
                                    </div>
                                </div>
                                <div className="col-span-5 text-right border-l border-slate-100 pl-8">
                                    <p className="text-[9pt] font-bold text-slate-400 uppercase tracking-widest mb-1">Inversión {plan.billingCycle}</p>
                                    <div className="flex items-baseline justify-end gap-1 text-black">
                                        <span className="text-[14pt] font-bold">S/</span>
                                        <span className="text-[40pt] font-black leading-none">{plan.price.toFixed(0)}</span>
                                    </div>
                                    <p className="text-[7pt] font-bold text-slate-400 uppercase mt-1">Importe neto por sede</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 px-2">
                            {[
                                { icon: ShieldCheck, t: "Seguridad", v: "Cifrado SSL" },
                                { icon: Globe, t: "Hosting", v: "Nube Google" },
                                { icon: Cpu, t: "IA", v: "Motor Híbrido" }
                            ].map((item, i) => (
                                <div key={i} className="flex flex-col items-center text-center p-4 border rounded-2xl bg-slate-50/50">
                                    <item.icon className="h-6 w-6 text-black mb-2" />
                                    <p className="text-[7pt] font-black uppercase tracking-widest text-slate-400 mb-0.5">{item.t}</p>
                                    <p className="text-[9pt] font-bold text-slate-800">{item.v}</p>
                                </div>
                            ))}
                        </div>

                        <div className="p-6 bg-slate-50 rounded-[1.5rem] border-2 border-dashed border-slate-200 mx-4">
                            <h4 className="text-[8pt] font-black uppercase text-slate-400 tracking-widest mb-2 flex items-center gap-2">
                                <Info className="h-3.5 w-3.5" /> Resumen del Plan
                            </h4>
                            <p className="text-[9pt] text-slate-600 leading-relaxed italic font-medium">
                                "{plan.description}"
                            </p>
                        </div>
                    </div>
                </div>

                <PageFooter design={design} />
            </div>

            {/* --- PÁGINA 3: DESGLOSE TÉCNICO --- */}
            <div className="a4-page">
                <PageHeader design={design} pageNumber={3} />

                <div className="content-box px-4">
                    <div className="flex justify-between items-center mb-6 pb-2 border-b-2 border-black">
                        <h3 className="text-[14pt] font-black uppercase tracking-tight flex items-center gap-3">
                            <ListChecks className="h-6 w-6 text-primary" /> Módulos y Capacidades
                        </h3>
                        <Badge variant="outline" className="font-black uppercase text-[7pt] border-black px-3 h-6">{plan.name}</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-10 gap-y-6">
                        {plan.features.map((feature, i) => {
                            const [name, description] = feature.split(':');
                            const items = description ? description.split(';').map(s => s.trim()).filter(Boolean) : [];

                            return (
                                <div key={i} className="space-y-1.5">
                                    <h4 className="text-[9.5pt] font-black text-black uppercase tracking-tight border-l-4 border-black pl-3 leading-none">
                                        {name}
                                    </h4>
                                    <div className="space-y-0.5 ml-4">
                                        {items.length > 0 ? items.map((item, idx) => (
                                            <div key={idx} className="text-[8pt] text-slate-600 font-bold leading-tight flex items-start gap-1.5">
                                                <div className="h-1 w-1 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                                                <span>{item}</span>
                                            </div>
                                        )) : (
                                            <p className="text-[8pt] text-slate-400 italic">Módulo habilitado según nivel.</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-20">
                        <div className="grid grid-cols-2 gap-20 text-center px-10">
                            <div className="border-t-2 border-black pt-1">
                                <p className="text-[9pt] font-black uppercase text-black">{design?.creators || "Ingeniería STEM"}</p>
                                <p className="text-[6.5pt] text-slate-400 font-bold uppercase tracking-widest">Dirección de Desarrollo</p>
                            </div>
                            <div className="border-t-2 border-black pt-1 text-black">
                                <p className="text-[9pt] font-black uppercase">Cliente Institucional</p>
                                <p className="text-[6.5pt] text-slate-400 font-bold uppercase tracking-widest">Sello y Firma de Aceptación</p>
                            </div>
                        </div>
                    </div>
                </div>

                <PageFooter design={design} />
            </div>
        </div>
    );
}
