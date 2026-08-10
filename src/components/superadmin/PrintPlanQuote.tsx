"use client";

import React from 'react';
import type { Plan, LoginDesign } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle2, ShieldCheck, Globe, CreditCard, Cpu, ListChecks, FileText, LayoutGrid, Zap, Rocket, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface PrintPlanQuoteProps {
    plan: Plan;
    design: LoginDesign | null;
}

export function PrintPlanQuote({ plan, design }: PrintPlanQuoteProps) {
    const today = new Date();
    const platformTitle = design?.title || "STEM V2";
    const platformLogo = design?.logoUrl;
    const creators = design?.creators || "Equipo de Desarrollo STEM";

    const getPlanIcon = () => {
        const name = plan.name.toLowerCase();
        if (name.includes('premium') || name.includes('pro')) return <Crown className="h-12 w-12 text-amber-500" />;
        if (name.includes('avanzado') || name.includes('plus')) return <Rocket className="h-12 w-12 text-purple-500" />;
        return <Zap className="h-12 w-12 text-blue-500" />;
    };

    return (
        <div className="printable-area font-sans text-black bg-white">
            <style jsx global>{`
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
                    background: white;
                    display: flex;
                    flex-direction: column;
                }
            `}</style>

            {/* --- PÁGINA 1: CARÁTULA --- */}
            <div className="page-container flex flex-col items-center justify-between text-center">
                <div className="mt-10 space-y-4">
                    <p className="text-[12pt] font-black tracking-[0.5em] text-slate-400 uppercase">
                        Propuesta Técnica y Económica
                    </p>
                    <div className="h-1 w-24 bg-black mx-auto"></div>
                </div>

                <div className="flex flex-col items-center gap-8">
                    <div className="h-48 w-48 relative">
                        {platformLogo ? (
                            <img src={platformLogo} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                            <div className="w-40 h-40 bg-black text-white flex items-center justify-center rounded-[2.5rem]">
                                <span className="text-4xl font-black italic">STEM</span>
                            </div>
                        )}
                    </div>
                    
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
                    <p className="text-[10pt] font-black text-primary uppercase tracking-[0.3em] mb-4">Plan de Implementación</p>
                    <h2 className="text-[28pt] font-black uppercase tracking-tight text-black">
                        {plan.name}
                    </h2>
                </div>

                <div className="w-full border-t border-slate-100 pt-10 flex justify-between items-end">
                    <div className="text-left">
                        <p className="text-[8pt] font-black uppercase text-slate-400 tracking-widest mb-1">Desarrollado por</p>
                        <p className="text-[11pt] font-bold uppercase">{creators}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[8pt] font-black uppercase text-slate-400 tracking-widest mb-1">Fecha de Emisión</p>
                        <p className="text-[11pt] font-black uppercase">{format(today, "dd 'de' MMMM, yyyy", { locale: es })}</p>
                    </div>
                </div>
            </div>

            {/* --- PÁGINA 2: COSTO Y DESCRIPCIÓN --- */}
            <div className="page-container">
                {/* Header Estándar */}
                <div className="flex justify-between items-start mb-4 border-b-2 border-black pb-4">
                    <div className="flex items-center gap-4">
                        {platformLogo && <img src={platformLogo} alt="Logo" className="w-12 h-12 object-contain" />}
                        <div>
                            <h1 className="text-[12pt] font-black uppercase leading-tight">{platformTitle}</h1>
                            <p className="text-[7pt] font-bold text-slate-500 uppercase tracking-widest">Tecnología de Gestión Educativa</p>
                        </div>
                    </div>
                    <div className="bg-black text-white px-4 py-2 rounded-xl text-center min-w-[120px]">
                        <p className="text-[6pt] font-black uppercase opacity-70">Proforma N°</p>
                        <p className="text-[11pt] font-mono font-black">{today.getFullYear()}-{plan.name.substring(0,3).toUpperCase()}-{(Math.floor(Math.random() * 900) + 100)}</p>
                    </div>
                </div>

                <div className="text-center my-12">
                    <h2 className="text-[24pt] font-black uppercase tracking-tighter leading-none mb-2">COTIZACIÓN DE SERVICIOS</h2>
                    <p className="text-[10pt] font-bold text-slate-400 uppercase tracking-[0.3em]">Confidencial Institucional</p>
                </div>

                <div className="space-y-10">
                    <section>
                        <p className="text-[11pt] leading-relaxed text-justify text-slate-700">
                            Mediante la presente, ponemos a su consideración la propuesta técnica y económica para la implementación integral del plan <strong>"{plan.name.toUpperCase()}"</strong> de nuestra plataforma <strong>{platformTitle}</strong>. Este ecosistema está diseñado específicamente para optimizar los procesos académicos, administrativos y de aprendizaje modular de su institución bajo los más altos estándares de calidad tecnológica.
                        </p>
                    </section>

                    {/* Cuadro de Inversión (Estilo Imagen Referencia) */}
                    <section className="relative py-12 px-8 border-2 border-black rounded-[2.5rem] bg-white shadow-xl">
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
                                <p className="text-[8pt] font-bold text-slate-500 uppercase mt-2">Incluye IGV, Actualizaciones y Soporte 24/7</p>
                            </div>
                        </div>
                    </section>

                    <section className="grid grid-cols-3 gap-6 pt-10">
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
                    </section>
                </div>

                <div className="mt-auto text-center pt-8 border-t border-slate-100">
                    <p className="text-[7pt] text-slate-300 font-black uppercase tracking-[0.5em]">Página 02 / 03</p>
                </div>
            </div>

            {/* --- PÁGINA 3: MÓDULOS INCLUIDOS --- */}
            <div className="page-container">
                 <div className="flex justify-between items-center mb-8 pb-4 border-b-2 border-black">
                    <h3 className="text-[14pt] font-black uppercase tracking-tight flex items-center gap-3">
                        <ListChecks className="h-6 w-6 text-primary" /> Módulos y Capacidades Incluidas
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
                                        <p className="text-[9pt] text-slate-400 italic">Funcionalidad completa sin restricciones.</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Área de Cierre y Firmas */}
                <div className="mt-auto pt-16">
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
                    
                    <div className="mt-12 text-center">
                        <p className="text-[7pt] text-slate-300 uppercase font-black tracking-[0.5em] mb-4">
                            DOCUMENTO OFICIAL GENERADO POR EL SISTEMA DE GESTIÓN STEM V2
                        </p>
                        <p className="text-[7pt] text-slate-300 font-black uppercase tracking-[0.5em]">Página 03 / 03</p>
                    </div>
                </div>
            </div>
        </div>
    );
}