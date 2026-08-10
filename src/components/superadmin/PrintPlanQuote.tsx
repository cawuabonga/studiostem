
"use client";

import React from 'react';
import type { Plan, LoginDesign } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle2, ShieldCheck, Globe, CreditCard, Cpu } from 'lucide-react';

interface PrintPlanQuoteProps {
    plan: Plan;
    design: LoginDesign | null;
}

export function PrintPlanQuote({ plan, design }: PrintPlanQuoteProps) {
    const today = new Date();
    const platformTitle = design?.title || "STEM V2";
    const platformLogo = design?.logoUrl;

    return (
        <div className="printable-area p-10 font-sans text-black bg-white w-full max-w-[210mm] mx-auto border-2 border-black border-dashed">
            {/* Encabezado Profesional */}
            <div className="flex justify-between items-start mb-8 pb-6 border-b-4 border-black">
                <div className="flex items-center gap-6">
                    {platformLogo ? (
                        <img 
                            src={platformLogo} 
                            alt="Logo" 
                            className="w-[90px] h-[90px] object-contain" 
                        />
                    ) : (
                        <div className="w-[80px] h-[80px] bg-black text-white flex items-center justify-center rounded-2xl">
                            <span className="text-2xl font-black italic">STEM</span>
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl font-black uppercase leading-tight tracking-tighter">{platformTitle}</h1>
                        <p className="text-[10pt] text-gray-600 font-bold uppercase tracking-widest">Ecosistema Tecnológico de Gestión Educativa</p>
                        <p className="text-[8pt] text-gray-400 mt-1 italic">Propuesta de Implementación y Licenciamiento SaaS</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="bg-black text-white px-4 py-2 rounded-lg mb-2">
                        <p className="text-[8pt] font-black uppercase tracking-widest">Proforma N°</p>
                        <p className="text-[14pt] font-mono font-black">{today.getFullYear()}-{plan.name.substring(0,3).toUpperCase()}-{Math.floor(Math.random() * 1000)}</p>
                    </div>
                    <p className="text-[8pt] font-bold text-gray-500 uppercase">Emisión: {format(today, "dd 'de' MMMM, yyyy", { locale: es })}</p>
                </div>
            </div>

            {/* Título de la Propuesta */}
            <div className="text-center my-10">
                <h2 className="text-[22pt] font-black uppercase tracking-tighter leading-none mb-2">COTIZACIÓN DE SERVICIOS</h2>
                <div className="h-1 w-24 bg-black mx-auto"></div>
            </div>

            {/* Cuerpo de la Proforma */}
            <div className="space-y-10">
                <section>
                    <p className="text-[11pt] leading-relaxed text-justify mb-6">
                        Mediante la presente, ponemos a su consideración la propuesta técnica y económica para la implementación del plan <strong>"{plan.name.toUpperCase()}"</strong> de nuestra plataforma <strong>{platformTitle}</strong>, diseñada para optimizar los procesos académicos, administrativos y de aprendizaje modular de su institución.
                    </p>
                </section>

                {/* Cuadro de Inversión */}
                <section className="bg-gray-50 border-2 border-black p-6 rounded-3xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <CreditCard className="w-32 h-32" />
                    </div>
                    <div className="flex justify-between items-center relative z-10">
                        <div>
                            <h3 className="text-[10pt] font-black uppercase tracking-widest text-gray-500 mb-1">Plan Seleccionado</h3>
                            <p className="text-[18pt] font-black uppercase text-black">{plan.name}</p>
                        </div>
                        <div className="text-right">
                            <h3 className="text-[10pt] font-black uppercase tracking-widest text-gray-500 mb-1">Inversión {plan.billingCycle === 'anual' ? 'Anual' : 'Mensual'}</h3>
                            <p className="text-[28pt] font-black text-black">S/ {plan.price.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
                            <p className="text-[8pt] font-bold text-gray-400 uppercase tracking-tighter">Incluye IGV e Soporte Técnico</p>
                        </div>
                    </div>
                </section>

                {/* Especificaciones Técnicas */}
                <section>
                    <h3 className="text-[11pt] font-black uppercase tracking-widest border-b-2 border-black pb-2 mb-6 flex items-center gap-3">
                        <ListChecks className="h-5 w-5" /> Módulos y Funcionalidades Incluidas
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                        {plan.features.map((feature, i) => {
                            const [name, ...descParts] = feature.split(':');
                            const description = descParts.join(':');
                            const items = description ? description.split(';').map(s => s.trim()).filter(Boolean) : [];

                            return (
                                <div key={i} className="space-y-1.5 border-l-2 border-gray-100 pl-4">
                                    <h4 className="text-[9.5pt] font-black text-black uppercase tracking-tight flex items-center gap-2">
                                        <CheckCircle2 className="h-3.5 w-3.5 text-black" />
                                        {name}
                                    </h4>
                                    <div className="space-y-1">
                                        {items.length > 0 ? items.map((item, idx) => (
                                            <p key={idx} className="text-[8pt] text-gray-600 font-medium leading-tight">
                                                • {item}
                                            </p>
                                        )) : (
                                            <p className="text-[8pt] text-gray-500 italic">Funcionalidad completa habilitada.</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Garantía de Servicio */}
                <section className="grid grid-cols-3 gap-4 pt-8">
                    <div className="flex flex-col items-center text-center p-4 border rounded-2xl">
                        <ShieldCheck className="h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-[7pt] font-black uppercase tracking-widest mb-1">Disponibilidad</p>
                        <p className="text-[9pt] font-bold">99.9% Uptime SLA</p>
                    </div>
                    <div className="flex flex-col items-center text-center p-4 border rounded-2xl">
                        <Globe className="h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-[7pt] font-black uppercase tracking-widest mb-1">Infraestructura</p>
                        <p className="text-[9pt] font-bold">Google Cloud Platform</p>
                    </div>
                    <div className="flex flex-col items-center text-center p-4 border rounded-2xl">
                        <Cpu className="h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-[7pt] font-black uppercase tracking-widest mb-1">Cerebro AI</p>
                        <p className="text-[9pt] font-bold">Motor Gemini 2.0</p>
                    </div>
                </section>
            </div>

            {/* Footer y Firmas */}
            <div className="mt-20 pt-10 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-20 px-12 text-center">
                    <div>
                        <div className="h-16 flex items-end justify-center mb-2">
                             {/* Placeholder para firma digital o sello si lo hubiera */}
                        </div>
                        <p className="text-[9pt] font-black uppercase border-t border-black pt-1">Gerencia Comercial</p>
                        <p className="text-[7pt] text-gray-500 font-bold uppercase tracking-widest">{platformTitle} Team</p>
                    </div>
                    <div>
                        <div className="h-16 flex items-end justify-center mb-2"></div>
                        <p className="text-[9pt] font-black uppercase border-t border-black pt-1">Aceptación de Propuesta</p>
                        <p className="text-[7pt] text-gray-500 font-bold uppercase tracking-widest">Sello y Firma del Cliente</p>
                    </div>
                </div>
                
                <div className="mt-12 text-center">
                    <p className="text-[6.5pt] text-gray-300 uppercase font-black tracking-[0.4em]">
                        Esta proforma tiene una validez de 30 días calendario a partir de su fecha de emisión.
                    </p>
                </div>
            </div>
        </div>
    );
}
