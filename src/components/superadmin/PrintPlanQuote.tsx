
"use client";

import React from 'react';
import type { Plan, LoginDesign } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle2, ShieldCheck, Globe, CreditCard, Cpu, ListChecks } from 'lucide-react';

interface PrintPlanQuoteProps {
    plan: Plan;
    design: LoginDesign | null;
}

export function PrintPlanQuote({ plan, design }: PrintPlanQuoteProps) {
    const today = new Date();
    const platformTitle = design?.title || "STEM V2";
    const platformLogo = design?.logoUrl;

    return (
        <div className="printable-area p-10 font-sans text-black bg-white w-full max-w-[210mm] mx-auto">
            {/* Encabezado Profesional Rediseñado */}
            <div className="flex justify-between items-center mb-2 pb-6">
                <div className="flex items-center gap-8 flex-1">
                    {platformLogo ? (
                        <img 
                            src={platformLogo} 
                            alt="Logo" 
                            className="w-[100px] h-[100px] object-contain" 
                        />
                    ) : (
                        <div className="w-[80px] h-[80px] bg-black text-white flex items-center justify-center rounded-2xl shrink-0">
                            <span className="text-2xl font-black italic">STEM</span>
                        </div>
                    )}
                    <div className="space-y-1">
                        <h1 className="text-[20pt] font-black uppercase leading-tight tracking-tighter text-black">
                            {platformTitle}
                        </h1>
                        <p className="text-[9pt] text-slate-800 font-black uppercase tracking-widest">
                            Ecosistema Tecnológico de Gestión Educativa
                        </p>
                        <p className="text-[8pt] text-slate-400 italic font-medium">
                            Propuesta de Implementación y Licenciamiento SaaS
                        </p>
                    </div>
                </div>
                
                <div className="flex flex-col items-end">
                    <div className="bg-black text-white px-5 py-3 rounded-2xl mb-2 text-center min-w-[140px]">
                        <p className="text-[7pt] font-black uppercase tracking-[0.2em] mb-1 opacity-70">Proforma N°</p>
                        <p className="text-[14pt] font-mono font-black leading-none">
                            {today.getFullYear()}-<br/>
                            {plan.name.substring(0,3).toUpperCase()}-<br/>
                            {Math.floor(Math.random() * 900) + 100}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-[7pt] font-black text-slate-400 uppercase tracking-widest">
                            Emisión: {format(today, "dd 'de' MMMM, yyyy", { locale: es }).toUpperCase()}
                        </p>
                    </div>
                </div>
            </div>

            {/* Línea Divisora Principal */}
            <div className="h-1.5 w-full bg-black mb-12"></div>

            {/* Título de la Propuesta */}
            <div className="text-center mb-12">
                <h2 className="text-[26pt] font-black uppercase tracking-tighter leading-none mb-2">COTIZACIÓN DE SERVICIOS</h2>
                <p className="text-[10pt] font-bold text-slate-400 uppercase tracking-[0.3em]">Confidencial Institucional</p>
            </div>

            {/* Cuerpo de la Proforma */}
            <div className="space-y-12">
                <section>
                    <p className="text-[11.5pt] leading-relaxed text-justify text-slate-700">
                        Mediante la presente, ponemos a su consideración la propuesta técnica y económica para la implementación integral del plan <strong>"{plan.name.toUpperCase()}"</strong> de nuestra plataforma <strong>{platformTitle}</strong>. Este ecosistema está diseñado específicamente para optimizar los procesos académicos, administrativos y de aprendizaje modular de su institución bajo los más altos estándares de calidad tecnológica.
                    </p>
                </section>

                {/* Cuadro de Inversión */}
                <section className="bg-slate-50 border-2 border-black p-8 rounded-[2.5rem] relative overflow-hidden shadow-sm">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <CreditCard className="w-32 h-32" />
                    </div>
                    <div className="flex justify-between items-center relative z-10">
                        <div className="space-y-1">
                            <h3 className="text-[9pt] font-black uppercase tracking-[0.2em] text-slate-400">Plan de Licenciamiento</h3>
                            <p className="text-[24pt] font-black uppercase text-black tracking-tight">{plan.name}</p>
                        </div>
                        <div className="text-right">
                            <h3 className="text-[9pt] font-black uppercase tracking-[0.2em] text-slate-400">Inversión {plan.billingCycle === 'anual' ? 'Anual' : 'Mensual'}</h3>
                            <div className="flex items-baseline justify-end gap-1">
                                <span className="text-[14pt] font-bold">S/</span>
                                <span className="text-[36pt] font-black text-black leading-none">{plan.price.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <p className="text-[8pt] font-bold text-slate-500 uppercase tracking-tighter mt-1">Incluye IGV, Actualizaciones e Soporte 24/7</p>
                        </div>
                    </div>
                </section>

                {/* Especificaciones Técnicas */}
                <section>
                    <h3 className="text-[12pt] font-black uppercase tracking-widest border-b-2 border-black pb-3 mb-8 flex items-center gap-3">
                        <ListChecks className="h-6 w-6" /> Módulos y Capacidades Incluidas
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                        {plan.features.map((feature, i) => {
                            const [name, ...descParts] = feature.split(':');
                            const description = descParts.join(':');
                            const items = description ? description.split(';').map(s => s.trim()).filter(Boolean) : [];

                            return (
                                <div key={i} className="space-y-2 border-l-4 border-slate-100 pl-5">
                                    <h4 className="text-[10pt] font-black text-black uppercase tracking-tight flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        {name}
                                    </h4>
                                    <div className="space-y-1.5">
                                        {items.length > 0 ? items.map((item, idx) => (
                                            <p key={idx} className="text-[8.5pt] text-slate-600 font-medium leading-tight flex items-start gap-2">
                                                <span className="text-slate-300">•</span>
                                                {item}
                                            </p>
                                        )) : (
                                            <p className="text-[8.5pt] text-slate-400 italic">Funcionalidad completa habilitada sin restricciones.</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Garantía de Servicio */}
                <section className="grid grid-cols-3 gap-6 pt-10 border-t border-slate-100">
                    <div className="flex flex-col items-center text-center p-5 border rounded-3xl bg-slate-50/50">
                        <ShieldCheck className="h-8 w-8 text-slate-400 mb-3" />
                        <p className="text-[7.5pt] font-black uppercase tracking-widest text-slate-500 mb-1">Garantía</p>
                        <p className="text-[10pt] font-bold">99.9% Uptime SLA</p>
                    </div>
                    <div className="flex flex-col items-center text-center p-5 border rounded-3xl bg-slate-50/50">
                        <Globe className="h-8 w-8 text-slate-400 mb-3" />
                        <p className="text-[7.5pt] font-black uppercase tracking-widest text-slate-500 mb-1">Infraestructura</p>
                        <p className="text-[10pt] font-bold">Google Cloud Pro</p>
                    </div>
                    <div className="flex flex-col items-center text-center p-5 border rounded-3xl bg-slate-50/50">
                        <Cpu className="h-8 w-8 text-slate-400 mb-3" />
                        <p className="text-[7.5pt] font-black uppercase tracking-widest text-slate-500 mb-1">Inteligencia</p>
                        <p className="text-[10pt] font-bold">Cerebro AI Híbrido</p>
                    </div>
                </section>
            </div>

            {/* Footer y Firmas */}
            <div className="mt-24 pt-10 border-t-2 border-slate-100">
                <div className="grid grid-cols-2 gap-24 px-12 text-center">
                    <div>
                        <div className="h-20"></div>
                        <p className="text-[10pt] font-black uppercase border-t-2 border-black pt-2">Dirección Comercial</p>
                        <p className="text-[8pt] text-slate-500 font-bold uppercase tracking-widest">{platformTitle} Tech Team</p>
                    </div>
                    <div>
                        <div className="h-20"></div>
                        <p className="text-[10pt] font-black uppercase border-t-2 border-black pt-2">Aceptación del Cliente</p>
                        <p className="text-[8pt] text-slate-500 font-bold uppercase tracking-widest">Sello y Firma Autorizada</p>
                    </div>
                </div>
                
                <div className="mt-16 text-center">
                    <p className="text-[7pt] text-slate-300 uppercase font-black tracking-[0.5em]">
                        DOCUMENTO OFICIAL GENERADO POR EL SISTEMA DE GESTIÓN STEM V2
                    </p>
                </div>
            </div>
        </div>
    );
}
