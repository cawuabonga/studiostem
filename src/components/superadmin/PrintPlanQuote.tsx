
"use client";

import React from 'react';
import type { Plan, LoginDesign } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
    CheckCircle2, 
    ListChecks, 
    Info,
    BadgeCheck,
    CreditCard,
    Globe,
    Cpu,
    ShieldCheck
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PrintPlanQuoteProps {
    plan: Plan;
    design: LoginDesign | null;
}

/**
 * Componente de Encabezado Institucional para cada hoja
 */
const PageHeader = ({ design, pageTitle }: { design: LoginDesign | null, pageTitle: string }) => {
    const platformTitle = design?.title || "STEM V2";
    const platformLogo = design?.logoUrl;
    const today = new Date();

    return (
        <div className="mb-8 border-b-2 border-black pb-4 flex items-center justify-between">
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
 * Pie de página institucional con numeración absoluta
 */
const PageFooter = ({ pageNumber, design }: { pageNumber: number, design: LoginDesign | null }) => {
    const platformTitle = design?.title || "STEM V2";
    return (
        <div className="absolute bottom-[15mm] left-[20mm] right-[20mm] pt-4 border-t border-slate-200 flex justify-between items-center bg-white">
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
                        margin: 0; /* Control total manual */
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
                    height: 297mm;
                    padding: 20mm;
                    position: relative;
                    background: white;
                    box-sizing: border-box;
                    page-break-after: always;
                    overflow: hidden;
                }
                .no-print-break {
                    page-break-inside: avoid;
                }
            `}</style>

            {/* --- PÁGINA 1: CARÁTULA --- */}
            <div className="page-container">
                <PageHeader design={design} pageTitle="Presentación de Solución" />
                
                <div className="mt-20 flex flex-col items-center justify-center text-center">
                    <div className="space-y-4 mb-16">
                        <p className="text-[12pt] font-black tracking-[0.5em] text-slate-300 uppercase">
                            Plan de Implementación
                        </p>
                        <div className="h-1 w-24 bg-black mx-auto"></div>
                    </div>

                    <div className="flex flex-col items-center gap-8 mb-16">
                        {design?.logoUrl ? (
                            <img src={design.logoUrl} alt="Logo" className="h-40 w-40 object-contain" />
                        ) : (
                            <div className="w-32 h-32 bg-black text-white flex items-center justify-center rounded-3xl">
                                <span className="text-3xl font-black italic">STEM</span>
                            </div>
                        )}
                        
                        <div className="space-y-4 px-10">
                            <h1 className="text-[32pt] font-black uppercase tracking-tighter leading-none text-black">
                                {platformTitle}
                            </h1>
                            <p className="text-[12pt] font-bold text-slate-400 uppercase tracking-widest">
                                Ecosistema de Gestión Educativa Modular
                            </p>
                        </div>
                    </div>

                    <div className="w-full max-w-xl bg-slate-50 border-y-2 border-black py-10 mb-12">
                        <p className="text-[9pt] font-black text-primary uppercase tracking-[0.4em] mb-3">Propuesta Técnica para el Plan:</p>
                        <h2 className="text-[24pt] font-black uppercase tracking-tight text-black px-6">
                            {plan.name}
                        </h2>
                    </div>

                    <div className="w-full mt-12 flex justify-between items-end text-left px-8">
                        <div className="space-y-1">
                            <p className="text-[7.5pt] font-black uppercase text-slate-400 tracking-widest">Ingeniería y Desarrollo</p>
                            <p className="text-[10pt] font-bold uppercase">{creators}</p>
                        </div>
                        <div className="text-right space-y-1">
                            <p className="text-[7.5pt] font-black uppercase text-slate-400 tracking-widest">Fecha de Emisión</p>
                            <p className="text-[10pt] font-black uppercase">{format(today, "MMMM yyyy", { locale: es })}</p>
                        </div>
                    </div>
                </div>

                <PageFooter pageNumber={1} design={design} />
            </div>

            {/* --- PÁGINA 2: PROPUESTA ECONÓMICA --- */}
            <div className="page-container">
                <PageHeader design={design} pageTitle="Cotización de Servicios" />

                <div className="space-y-8">
                    <div className="text-center my-4">
                        <h2 className="text-[22pt] font-black uppercase tracking-tighter leading-none mb-2">PROPUESTA ECONÓMICA</h2>
                        <div className="inline-block px-5 py-1 bg-black text-white text-[8pt] font-black uppercase tracking-[0.3em]">
                            Confidencial Institucional
                        </div>
                    </div>

                    <p className="text-[10.5pt] leading-relaxed text-justify text-slate-700 font-medium px-4">
                        Ponemos a su consideración la propuesta comercial para la implementación del plan <strong>"{plan.name.toUpperCase()}"</strong>. Nuestra solución está diseñada para centralizar la gestión académica y administrativa, optimizando recursos mediante el uso de infraestructura en la nube y automatización de procesos críticos.
                    </p>

                    {/* Cuadro de Inversión */}
                    <div className="mx-4 py-10 px-8 border-2 border-black rounded-[2rem] bg-white shadow-lg overflow-hidden no-print-break relative">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <CreditCard className="w-24 h-24" />
                        </div>
                        <div className="grid grid-cols-12 gap-8 items-center relative z-10">
                            <div className="col-span-7 space-y-2">
                                <p className="text-[9pt] font-bold text-slate-400 uppercase tracking-widest">Suscripción de Servicio</p>
                                <h3 className="text-[24pt] font-black uppercase text-black leading-tight tracking-tighter">
                                    {plan.name}
                                </h3>
                                <div className="flex items-center gap-2">
                                    <BadgeCheck className="h-4 w-4 text-green-600" />
                                    <span className="text-[8.5pt] font-black uppercase text-slate-600">SLA: 99.9% Disponibilidad</span>
                                </div>
                            </div>
                            <div className="col-span-5 text-right border-l border-slate-100 pl-8">
                                <p className="text-[9pt] font-bold text-slate-400 uppercase tracking-widest mb-1">Inversión {plan.billingCycle === 'anual' ? 'Anual' : 'Mensual'}</p>
                                <div className="flex items-baseline justify-end gap-1">
                                    <span className="text-[14pt] font-bold">S/</span>
                                    <span className="text-[36pt] font-black text-black leading-none">
                                        {plan.price.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <p className="text-[7.5pt] font-bold text-slate-400 uppercase mt-2">Importe total por sede</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 px-4">
                        <div className="flex flex-col items-center text-center p-4 border border-slate-100 rounded-2xl bg-slate-50/50">
                            <ShieldCheck className="h-7 w-7 text-primary mb-2" />
                            <p className="text-[7pt] font-black uppercase tracking-widest text-slate-400 mb-0.5">Seguridad</p>
                            <p className="text-[9pt] font-bold text-slate-800">Cifrado SSL</p>
                        </div>
                        <div className="flex flex-col items-center text-center p-4 border border-slate-100 rounded-2xl bg-slate-50/50">
                            <Globe className="h-7 w-7 text-primary mb-2" />
                            <p className="text-[7pt] font-black uppercase tracking-widest text-slate-400 mb-0.5">Hosting</p>
                            <p className="text-[9pt] font-bold text-slate-800">Google Cloud</p>
                        </div>
                        <div className="flex flex-col items-center text-center p-4 border border-slate-100 rounded-2xl bg-slate-50/50">
                            <Cpu className="h-7 w-7 text-primary mb-2" />
                            <p className="text-[7pt] font-black uppercase tracking-widest text-slate-400 mb-0.5">IA</p>
                            <p className="text-[9pt] font-bold text-slate-800">Motor Híbrido</p>
                        </div>
                    </div>

                    <div className="mx-4 p-6 bg-slate-50 rounded-2xl border border-slate-200">
                        <h4 className="text-[8pt] font-black uppercase text-slate-500 tracking-widest mb-2 flex items-center gap-2">
                            <Info className="h-3.5 w-3.5" /> Resumen de Beneficios
                        </h4>
                        <p className="text-[9.5pt] text-slate-600 leading-relaxed italic font-medium">
                            "{plan.description}"
                        </p>
                    </div>
                </div>

                <PageFooter pageNumber={2} design={design} />
            </div>

            {/* --- PÁGINA 3: DESGLOSE TÉCNICO --- */}
            <div className="page-container">
                <PageHeader design={design} pageTitle="Anexo: Especificaciones del Plan" />

                <div className="px-4">
                    <div className="flex justify-between items-center mb-8 pb-1 border-b border-black">
                        <h3 className="text-[12pt] font-black uppercase tracking-tight flex items-center gap-2">
                            <ListChecks className="h-5 w-5 text-primary" /> Funcionalidades Incluidas
                        </h3>
                        <Badge variant="outline" className="font-black uppercase text-[7pt] border-black px-3 h-6">{plan.name}</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-10 gap-y-6">
                        {plan.features.map((feature, i) => {
                            const [name, ...descParts] = feature.split(':');
                            const description = descParts.join(':');
                            const items = description ? description.split(';').map(s => s.trim()).filter(Boolean) : [];

                            return (
                                <div key={i} className="space-y-1.5 no-print-break">
                                    <h4 className="text-[9.5pt] font-black text-primary uppercase tracking-tight border-l-2 border-primary pl-2">
                                        {name}
                                    </h4>
                                    <div className="space-y-1 ml-3">
                                        {items.length > 0 ? items.map((item, idx) => (
                                            <div key={idx} className="text-[8.5pt] text-slate-600 font-bold leading-snug flex items-start gap-1.5">
                                                <div className="h-1 w-1 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                                                <span>{item}</span>
                                            </div>
                                        )) : (
                                            <p className="text-[8pt] text-slate-400 italic">Módulo habilitado según estándares del plan.</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="absolute bottom-[40mm] left-[20mm] right-[20mm]">
                    <div className="grid grid-cols-2 gap-20 px-8 text-center">
                        <div className="space-y-1">
                            <div className="h-14"></div>
                            <div className="border-t border-black pt-1">
                                <p className="text-[9pt] font-black uppercase">{platformTitle} Team</p>
                                <p className="text-[6.5pt] text-slate-400 font-bold uppercase tracking-widest">Dirección de Ingeniería</p>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="h-14"></div>
                            <div className="border-t border-black pt-1">
                                <p className="text-[9pt] font-black uppercase">Cliente Institucional</p>
                                <p className="text-[6.5pt] text-slate-400 font-bold uppercase tracking-widest">Sello y Firma de Aceptación</p>
                            </div>
                        </div>
                    </div>
                </div>

                <PageFooter pageNumber={3} design={design} />
            </div>
        </div>
    );
}
