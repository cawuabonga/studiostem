
"use client";

import React from 'react';
import type { Plan, LoginDesign } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
    CheckCircle2, 
    BadgeCheck, 
    CreditCard, 
    Globe, 
    Cpu, 
    ShieldCheck, 
    Info, 
    ListChecks 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PrintPlanQuoteProps {
    plan: Plan;
    design: LoginDesign | null;
}

/**
 * Componente de Encabezado Institucional Fijo
 */
const PageHeader = ({ design, pageTitle }: { design: LoginDesign | null, pageTitle: string }) => {
    const platformTitle = design?.title || "STEM V2";
    const platformLogo = design?.logoUrl;
    const today = new Date();

    return (
        <div className="absolute top-[10mm] left-[15mm] right-[15mm] border-b-2 border-black pb-4 flex items-center justify-between bg-white">
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
                    <p className="text-[6.5pt] font-bold text-slate-500 uppercase tracking-widest">{pageTitle}</p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-[6pt] font-black uppercase text-slate-400 leading-none mb-1">Doc. Técnico Oficial</p>
                <p className="text-[8pt] font-mono font-bold text-black">{format(today, 'dd/MM/yyyy')}</p>
            </div>
        </div>
    );
};

/**
 * Pie de página institucional fijo con numeración
 */
const PageFooter = ({ pageNumber, design }: { pageNumber: number, design: LoginDesign | null }) => {
    const platformTitle = design?.title || "STEM V2";
    return (
        <div className="absolute bottom-[10mm] left-[15mm] right-[15mm] pt-4 border-t border-slate-200 flex justify-between items-center bg-white">
            <div className="text-left">
                <p className="text-[6.5pt] text-slate-400 font-black uppercase tracking-[0.3em] leading-none mb-1">
                    {platformTitle} • PROPUESTA DE SERVICIO
                </p>
                <p className="text-[5.5pt] text-slate-300 font-bold uppercase italic">Válidez digital verificada mediante firma de servidor</p>
            </div>
            <div className="text-right font-black text-black text-[8pt] uppercase">
                Página {pageNumber.toString().padStart(2, '0')} / 03
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
                        border: 1px solid #eee;
                    }
                }
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 0;
                    }
                    body {
                        margin: 0 !important;
                        padding: 0 !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }
                .page-container {
                    width: 210mm;
                    height: 296.8mm; /* Ligeramente menor para evitar hojas en blanco */
                    position: relative;
                    background: white;
                    box-sizing: border-box;
                    page-break-after: always;
                    break-after: page;
                    overflow: hidden;
                    padding: 35mm 20mm 25mm 20mm; /* Espacio para Header y Footer fijos */
                }
                .no-print-break {
                    page-break-inside: avoid;
                }
                h1, h2, h3, h4 {
                    font-family: 'Montserrat', sans-serif !important;
                }
            `}</style>

            {/* --- PÁGINA 1: CARÁTULA --- */}
            <div className="page-container">
                <PageHeader design={design} pageTitle="Presentación de Solución" />
                
                <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="space-y-4 mb-16">
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
                        
                        <div className="space-y-4 px-10">
                            <h1 className="text-[36pt] font-black uppercase tracking-tighter leading-none text-black">
                                {platformTitle}
                            </h1>
                            <p className="text-[13pt] font-bold text-slate-400 uppercase tracking-[0.2em]">
                                Ecosistema de Gestión Educativa Modular
                            </p>
                        </div>
                    </div>

                    <div className="w-full max-w-xl bg-slate-50 border-y-2 border-black py-12 mb-16">
                        <p className="text-[10pt] font-black text-primary uppercase tracking-[0.4em] mb-4 text-center">Propuesta Técnica para el Plan:</p>
                        <h2 className="text-[28pt] font-black uppercase tracking-tight text-black px-6">
                            {plan.name}
                        </h2>
                    </div>

                    <div className="w-full mt-auto flex justify-between items-end text-left px-10 pb-10">
                        <div className="space-y-1">
                            <p className="text-[8pt] font-black uppercase text-slate-400 tracking-widest">Ingeniería y Desarrollo</p>
                            <p className="text-[11pt] font-bold uppercase">{creators}</p>
                        </div>
                        <div className="text-right space-y-1">
                            <p className="text-[8pt] font-black uppercase text-slate-400 tracking-widest">Fecha de Emisión</p>
                            <p className="text-[11pt] font-black uppercase">{format(today, "MMMM yyyy", { locale: es })}</p>
                        </div>
                    </div>
                </div>

                <PageFooter pageNumber={1} design={design} />
            </div>

            {/* --- PÁGINA 2: PROPUESTA ECONÓMICA --- */}
            <div className="page-container">
                <PageHeader design={design} pageTitle="Cotización de Servicios" />

                <div className="h-full flex flex-col">
                    <div className="text-center my-10">
                        <h2 className="text-[24pt] font-black uppercase tracking-tighter leading-none mb-3">PROPUESTA ECONÓMICA</h2>
                        <div className="inline-block px-6 py-1.5 bg-black text-white text-[9pt] font-black uppercase tracking-[0.3em]">
                            Confidencial Institucional
                        </div>
                    </div>

                    <div className="space-y-8 flex-1">
                        <p className="text-[11pt] leading-relaxed text-justify text-slate-700 font-medium px-4">
                            Estimados, ponemos a su consideración la propuesta comercial para la implementación del plan <strong>"{plan.name.toUpperCase()}"</strong>. Nuestra solución está diseñada para centralizar la gestión académica y administrativa, optimizando recursos mediante el uso de infraestructura en la nube y automatización de procesos críticos.
                        </p>

                        {/* Cuadro de Inversión */}
                        <div className="mx-4 py-12 px-10 border-2 border-black rounded-[2.5rem] bg-white shadow-xl overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <CreditCard className="w-32 h-32" />
                            </div>
                            <div className="grid grid-cols-12 gap-8 items-center relative z-10">
                                <div className="col-span-7 space-y-3">
                                    <p className="text-[10pt] font-bold text-slate-400 uppercase tracking-widest">Suscripción de Servicio</p>
                                    <h3 className="text-[28pt] font-black uppercase text-black leading-tight tracking-tighter">
                                        {plan.name}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <BadgeCheck className="h-5 w-5 text-green-600" />
                                        <span className="text-[9pt] font-black uppercase text-slate-600">SLA: 99.9% Disponibilidad G-Cloud</span>
                                    </div>
                                </div>
                                <div className="col-span-5 text-right border-l border-slate-100 pl-10">
                                    <p className="text-[10pt] font-bold text-slate-400 uppercase tracking-widest mb-1">Inversión {plan.billingCycle === 'anual' ? 'Anual' : 'Mensual'}</p>
                                    <div className="flex items-baseline justify-end gap-1">
                                        <span className="text-[16pt] font-bold">S/</span>
                                        <span className="text-[42pt] font-black text-black leading-none">
                                            {plan.price.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <p className="text-[8pt] font-bold text-slate-400 uppercase mt-2">Importe total neto por sede</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6 px-4">
                            <div className="flex flex-col items-center text-center p-6 border border-slate-100 rounded-3xl bg-slate-50/50">
                                <ShieldCheck className="h-8 w-8 text-primary mb-3" />
                                <p className="text-[8pt] font-black uppercase tracking-widest text-slate-400 mb-1">Seguridad</p>
                                <p className="text-[10pt] font-bold text-slate-800">Cifrado SSL</p>
                            </div>
                            <div className="flex flex-col items-center text-center p-6 border border-slate-100 rounded-3xl bg-slate-50/50">
                                <Globe className="h-8 w-8 text-primary mb-3" />
                                <p className="text-[8pt] font-black uppercase tracking-widest text-slate-400 mb-1">Hosting</p>
                                <p className="text-[10pt] font-bold text-slate-800">Google Cloud</p>
                            </div>
                            <div className="flex flex-col items-center text-center p-6 border border-slate-100 rounded-3xl bg-slate-50/50">
                                <Cpu className="h-8 w-8 text-primary mb-3" />
                                <p className="text-[8pt] font-black uppercase tracking-widest text-slate-400 mb-1">IA</p>
                                <p className="text-[10pt] font-bold text-slate-800">Motor Híbrido</p>
                            </div>
                        </div>

                        <div className="mx-4 p-8 bg-slate-50 rounded-[2rem] border border-slate-200">
                            <h4 className="text-[9pt] font-black uppercase text-slate-500 tracking-widest mb-3 flex items-center gap-2">
                                <Info className="h-4 w-4" /> Resumen de Beneficios
                            </h4>
                            <p className="text-[10.5pt] text-slate-600 leading-relaxed italic font-medium">
                                "{plan.description}"
                            </p>
                        </div>
                    </div>
                </div>

                <PageFooter pageNumber={2} design={design} />
            </div>

            {/* --- PÁGINA 3: DESGLOSE TÉCNICO --- */}
            <div className="page-container">
                <PageHeader design={design} pageTitle="Anexo: Especificaciones del Plan" />

                <div className="h-full flex flex-col">
                    <div className="px-4 mb-10">
                        <div className="flex justify-between items-center mb-6 pb-2 border-b-2 border-black">
                            <h3 className="text-[14pt] font-black uppercase tracking-tight flex items-center gap-3">
                                <ListChecks className="h-6 w-6 text-primary" /> Funcionalidades Incluidas
                            </h3>
                            <Badge variant="outline" className="font-black uppercase text-[8pt] border-black px-4 h-7">{plan.name}</Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                            {plan.features.map((feature, i) => {
                                const [name, ...descParts] = feature.split(':');
                                const description = descParts.join(':');
                                const items = description ? description.split(';').map(s => s.trim()).filter(Boolean) : [];

                                return (
                                    <div key={i} className="space-y-2 no-print-break">
                                        <h4 className="text-[10pt] font-black text-primary uppercase tracking-tight border-l-4 border-primary pl-3">
                                            {name}
                                        </h4>
                                        <div className="space-y-1.5 ml-4">
                                            {items.length > 0 ? items.map((item, idx) => (
                                                <div key={idx} className="text-[9pt] text-slate-600 font-bold leading-snug flex items-start gap-2">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                                                    <span>{item}</span>
                                                </div>
                                            )) : (
                                                <p className="text-[8.5pt] text-slate-400 italic">Módulo habilitado según estándares del plan.</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mt-auto px-10 pb-10">
                        <div className="grid grid-cols-2 gap-24 text-center">
                            <div className="space-y-2">
                                <div className="h-16"></div>
                                <div className="border-t-2 border-black pt-2">
                                    <p className="text-[10pt] font-black uppercase">{platformTitle} Team</p>
                                    <p className="text-[7pt] text-slate-400 font-bold uppercase tracking-[0.2em]">Dirección de Ingeniería</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="h-16"></div>
                                <div className="border-t-2 border-black pt-2">
                                    <p className="text-[10pt] font-black uppercase">Cliente Institucional</p>
                                    <p className="text-[7pt] text-slate-400 font-bold uppercase tracking-[0.2em]">Sello y Firma de Aceptación</p>
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

