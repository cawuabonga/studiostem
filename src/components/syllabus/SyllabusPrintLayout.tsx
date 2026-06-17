
"use client";

import React from 'react';
import type { Institute, Program, Unit, Teacher, Syllabus, WeekData, AchievementIndicator, SyllabusDesignOptions } from '@/types';
import { format, addDays, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';

interface SyllabusPrintLayoutProps {
    institute: Institute | null;
    program: Program | null;
    unit: Unit;
    teacher: Teacher | null;
    syllabus: Syllabus | null;
    weeklyData: WeekData[];
    indicators: AchievementIndicator[];
    designOptions?: SyllabusDesignOptions;
    academicDates?: { start?: Date; end?: Date };
}

const defaultOptions: SyllabusDesignOptions = {
    showLogo: true,
    showInfoTable: true,
    showSignature: true,
};

const PageHeader = ({ institute }: { institute: Institute | null }) => {
    const today = new Date();
    return (
        <div className="inst-header flex items-center justify-between border-b-2 border-black pb-2 mb-8">
            {/* Logo a la izquierda */}
            <div className="w-[100px] shrink-0">
                {institute?.logoUrl ? (
                    <img src={institute.logoUrl} alt="Logo" className="w-[65px] h-[65px] object-contain" />
                ) : (
                    <div className="w-[60px] h-[60px] border border-dashed border-gray-300 flex items-center justify-center text-[6pt]">LOGO</div>
                )}
            </div>

            {/* Nombre del Instituto al Centro - 18pt nivelado */}
            <div className="flex-1 text-center px-4">
                <h1 className="text-[18pt] font-black uppercase tracking-tight leading-tight text-black">
                    {institute?.name || 'INSTITUTO SUPERIOR'}
                </h1>
                <p className="text-[6.5pt] tracking-[0.3em] text-gray-500 uppercase mt-1">Manual Técnico de Planificación Curricular</p>
            </div>

            {/* Fecha a la derecha */}
            <div className="w-[100px] shrink-0 text-right leading-none">
                <p className="text-[6pt] font-black text-gray-400 uppercase mb-1">Emisión</p>
                <p className="text-[8pt] font-bold text-black">{format(today, 'dd/MM/yyyy')}</p>
                <p className="text-[7pt] text-gray-600 uppercase">{format(today, 'HH:mm', { locale: es })}</p>
            </div>
        </div>
    );
};

const SectionTitle = ({ numeral, title }: { numeral: string, title: string }) => (
    <div className="bg-black text-white p-1.5 mb-6 flex items-center gap-4 uppercase tracking-widest no-print-break">
        <span className="bg-white text-black px-3 py-0.5 font-black text-[10pt]">{numeral}</span>
        <h3 className="text-[10pt] font-black">{title}</h3>
    </div>
);

export function SyllabusPrintLayout({ 
    institute, 
    program, 
    unit, 
    teacher, 
    syllabus, 
    weeklyData, 
    indicators, 
    designOptions = defaultOptions,
    academicDates
}: SyllabusPrintLayoutProps) {
    
    const currentYear = new Date().getFullYear();

    const renderHtml = (text?: string) => {
        if (!text) return null;
        return text.split('\n').map((item, index) => (
            <React.Fragment key={index}>
                {item}
                <br />
            </React.Fragment>
        ));
    };

    const getWeekDateRange = (weekNum: number): string => {
        if (!academicDates?.start) return '---';
        try {
            const semesterStart = startOfWeek(academicDates.start, { weekStartsOn: 1 });
            const monday = addDays(semesterStart, (weekNum - 1) * 7);
            const sunday = addDays(monday, 6);
            return `${format(monday, 'dd/MM')} al ${format(sunday, 'dd/MM')}`;
        } catch (e) { return '---'; }
    };
    
    const currentModule = program?.modules.find(m => m.code === unit.moduleId);
    const weeklyHours = (unit.theoreticalHours || 0) + (unit.practicalHours || 0);

    return (
        <div className="bg-white text-black font-sans w-full selection:bg-transparent">
            <style jsx global>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 15mm 15mm 20mm 15mm;
                    }
                    body {
                        counter-reset: page;
                        background-color: white !important;
                    }
                    .page-break {
                        page-break-after: always;
                        position: relative;
                        background-color: white !important;
                        display: block;
                        min-height: 260mm;
                    }
                    .print-footer {
                        position: fixed;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        height: 35px;
                        border-top: 1px solid #000;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        font-size: 7.5pt;
                        color: #000;
                        padding-top: 5px;
                        background: white;
                    }
                    .page-number:after {
                        content: "Página " counter(page);
                    }
                    .section-container {
                        page-break-inside: avoid;
                    }
                }
            `}</style>

            {/* --- PÁGINA 1: PORTADA --- */}
            <div className="page-break flex flex-col items-center">
                <div className="w-full flex flex-col items-center justify-between h-[270mm] py-8 border-4 border-double border-black m-2 box-border">
                    <div className="w-full space-y-8 flex flex-col items-center">
                        <div className="text-center space-y-6">
                            <h1 className="text-[26pt] font-black tracking-tighter leading-tight max-w-4xl text-black px-8">
                                {institute?.name.toUpperCase()}
                            </h1>
                            <div className="h-2 w-32 bg-black mx-auto"></div>
                        </div>

                        <div className="py-12">
                            {designOptions.showLogo && institute?.logoUrl && (
                                <img src={institute.logoUrl} alt="Logo" className="w-[220px] h-[220px] object-contain" />
                            )}
                        </div>

                        <div className="text-center space-y-4 pt-4">
                            <p className="text-[12pt] font-bold text-gray-500 uppercase tracking-[0.5em]">Programa de Estudios</p>
                            <h2 className="text-[18pt] font-black uppercase px-16 leading-tight text-black underline decoration-4 underline-offset-8">
                                {program?.name.toUpperCase()}
                            </h2>
                        </div>
                        
                        <div className="bg-black text-white py-10 w-full text-center mt-12">
                            <h2 className="text-[22pt] font-black tracking-[0.2em]">SÍLABO ACADÉMICO</h2>
                            <p className="text-[14pt] font-bold mt-2 uppercase">{unit.name}</p>
                        </div>
                    </div>

                    <div className="w-full max-w-2xl mx-auto px-12 flex justify-between items-end pb-12">
                        <div className="space-y-1">
                            <p className="text-[8pt] font-black text-gray-400 uppercase tracking-widest">Responsable</p>
                            <p className="text-[11pt] font-bold uppercase text-black">{teacher?.fullName || 'Personal Docente'}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[8pt] font-black text-gray-400 uppercase tracking-widest">Año</p>
                            <p className="text-[20pt] font-black text-black leading-none">{currentYear}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- CUERPO DEL SÍLABO --- */}
            <div className="page-break py-4">
                <PageHeader institute={institute} />
                
                <div className="mt-8 space-y-12 px-2">
                    <section className="section-container">
                        <SectionTitle numeral="I" title="INFORMACIÓN GENERAL" />
                        <table className="w-full border-collapse border-2 border-black">
                            <tbody className="text-[8.5pt]">
                                <tr><th className="w-[30%] text-left bg-gray-100 p-2 border border-black uppercase font-black text-black">Sector Económico</th><td className="p-2 border border-black uppercase text-black">{program?.economicSector || '---'}</td></tr>
                                <tr><th className="text-left bg-gray-100 p-2 border border-black uppercase font-black text-black">Familia Productiva</th><td className="p-2 border border-black uppercase text-black">{program?.productiveFamily || '---'}</td></tr>
                                <tr><th className="text-left bg-gray-100 p-2 border border-black uppercase font-black text-black">Actividad Económica</th><td className="p-2 border border-black uppercase text-black">{program?.economicActivity || '---'}</td></tr>
                                <tr><th className="text-left bg-gray-100 p-2 border border-black uppercase font-black text-black">Programa de Estudios</th><td className="p-2 border border-black uppercase font-bold text-black">{program?.name}</td></tr>
                                <tr><th className="text-left bg-gray-100 p-2 border border-black uppercase font-black text-black">Módulo Profesional</th><td className="p-2 border border-black uppercase text-black">{currentModule?.name}</td></tr>
                                <tr><th className="text-left bg-gray-100 p-2 border border-black uppercase font-black text-black">Unidad Didáctica</th><td className="p-2 border border-black font-black uppercase text-[10pt] text-primary">{unit.name}</td></tr>
                                <tr><th className="text-left bg-gray-100 p-2 border border-black uppercase font-black text-black">Ciclo / Semestre</th><td className="p-2 border border-black font-bold text-black">{unit.semester}° Semestre</td></tr>
                                <tr><th className="text-left bg-gray-100 p-2 border border-black uppercase font-black text-black">Créditos / Horas</th><td className="p-2 border border-black text-black">{unit.credits} Créditos | {weeklyHours} h/s | {unit.totalHours} Totales</td></tr>
                                <tr><th className="text-left bg-gray-100 p-2 border border-black uppercase font-black text-black">Turno / Periodo</th><td className="p-2 border border-black font-bold uppercase text-black">{unit.turno} | {unit.period} {currentYear}</td></tr>
                            </tbody>
                        </table>
                    </section>

                    <section className="section-container">
                        <SectionTitle numeral="II" title="SUMILLA" />
                        <div className="text-justify pl-6 text-[9pt] leading-relaxed border-l-4 border-black text-black font-medium">
                            {renderHtml(syllabus?.summary)}
                        </div>
                    </section>

                    <section className="section-container">
                        <SectionTitle numeral="III" title="COMPETENCIA DE LA UNIDAD" />
                        <div className="text-justify pl-6 text-[9pt] leading-relaxed border-l-4 border-black text-black">
                            {renderHtml(syllabus?.competence)}
                        </div>
                    </section>
                </div>

                <footer className="print-footer">
                    <div className="font-black uppercase tracking-widest">{institute?.name}</div>
                    <div className="page-number font-black border-l border-black pl-4 h-full flex items-center"></div>
                </footer>
            </div>

            <div className="page-break py-4">
                <PageHeader institute={institute} />
                <div className="mt-8 space-y-12 px-2">
                    <section className="section-container">
                        <SectionTitle numeral="IV" title="CAPACIDAD DE LA UNIDAD" />
                        <div className="text-justify pl-6 text-[9pt] leading-relaxed border-l-4 border-black text-black">
                            {renderHtml(syllabus?.capacity)}
                        </div>
                    </section>

                    <section className="section-container">
                        <SectionTitle numeral="V" title="COMPETENCIAS TRANSVERSALES" />
                        <div className="text-justify pl-6 text-[9pt] leading-relaxed border-l-4 border-black text-black">
                            {renderHtml(syllabus?.transversalCompetencies)}
                        </div>
                    </section>

                    <section className="section-container">
                        <SectionTitle numeral="VI" title="INDICADORES DE LOGRO" />
                        <div className="pl-6 space-y-4">
                            {indicators.map((ind, idx) => (
                                <div key={ind.id} className="flex gap-4 items-start">
                                    <span className="font-black text-[10pt] text-black bg-gray-100 px-2 py-0.5 rounded-sm">{(idx + 1).toString().padStart(2, '0')}</span>
                                    <p className="text-[9pt] font-bold uppercase leading-tight text-black pt-1">{ind.name}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
                <footer className="print-footer">
                    <div className="font-black uppercase tracking-widest">{unit.name} - {unit.code}</div>
                    <div className="page-number font-black border-l border-black pl-4 h-full flex items-center"></div>
                </footer>
            </div>

            {/* --- TABLA DE ORGANIZACIÓN --- */}
            <div className="page-break py-4">
                <PageHeader institute={institute} />
                <div className="px-2">
                    <SectionTitle numeral="VII" title="ORGANIZACIÓN DE ACTIVIDADES Y CONTENIDOS" />
                    <table className="w-full border-collapse border-2 border-black text-[7.5pt]">
                        <thead>
                            <tr className="bg-gray-100 font-black uppercase text-black">
                                <th className="border-2 border-black p-2 w-[12%]">SEM.</th>
                                <th className="border-2 border-black p-2 w-[33%]">ELEMENTOS DE CAPACIDAD</th>
                                <th className="border-2 border-black p-2 w-[25%]">ACTIVIDADES DE APRENDIZAJE</th>
                                <th className="border-2 border-black p-2 w-[22%]">ACTIVIDAD FORMATIVA</th>
                                <th className="border-2 border-black p-2 w-[8%]">HORAS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {indicators.map((ind) => {
                                const weeks = weeklyData.filter(w => w.weekNumber >= ind.startWeek && w.weekNumber <= ind.endWeek);
                                return (
                                    <React.Fragment key={ind.id}>
                                        <tr className="bg-gray-200">
                                            <td colSpan={5} className="border-2 border-black p-2 font-black uppercase text-black text-center italic tracking-wider">
                                                {ind.name}
                                            </td>
                                        </tr>
                                        {weeks.map(week => (
                                            <tr key={week.weekNumber}>
                                                <td className="border border-black p-1.5 text-center font-black bg-white">
                                                    {week.weekNumber}
                                                    <br />
                                                    <span className="text-[5.5pt] font-bold text-gray-500">({getWeekDateRange(week.weekNumber)})</span>
                                                </td>
                                                <td className="border border-black p-2 align-top">{renderHtml(week.capacityElement)}</td>
                                                <td className="border border-black p-2 align-top">{renderHtml(week.learningActivities)}</td>
                                                <td className="border border-black p-2 align-top font-bold italic">{renderHtml(week.basicContents)}</td>
                                                <td className="border border-black p-2 text-center align-middle font-black">{weeklyHours}h</td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <footer className="print-footer">
                    <div className="font-black uppercase tracking-widest">Plan de Organización Curricular {currentYear}</div>
                    <div className="page-number font-black border-l border-black pl-4 h-full flex items-center"></div>
                </footer>
            </div>

            {/* --- ÚLTIMA PÁGINA: FIRMAS --- */}
            <div className="py-4 relative">
                <PageHeader institute={institute} />
                <div className="mt-8 space-y-12 px-2">
                    <section className="section-container">
                        <SectionTitle numeral="VIII" title="METODOLOGÍA" />
                        <div className="text-justify pl-6 text-[9pt] leading-relaxed border-l-4 border-black text-black">
                            {renderHtml(syllabus?.methodology)}
                        </div>
                    </section>

                    <section className="section-container">
                        <SectionTitle numeral="IX" title="BIBLIOGRAFÍA" />
                        <div className="text-justify pl-6 text-[8.5pt] leading-relaxed border-l-4 border-black text-black font-mono">
                            {renderHtml(syllabus?.bibliography)}
                        </div>
                    </section>

                    {/* SECCIÓN DE FIRMAS ACTUALIZADA */}
                    <section className="pt-32 no-print-break">
                        <div className="grid grid-cols-2 gap-x-20 items-end px-12">
                            <div className="text-center border-t-2 border-black pt-2">
                                <p className="font-black text-[10pt] uppercase text-black">{teacher?.fullName || 'Firma del Docente'}</p>
                                <p className="text-[7.5pt] font-black text-gray-500 uppercase tracking-widest">Docente Responsable</p>
                            </div>
                            <div className="text-center border-t-2 border-black pt-2">
                                <p className="font-black text-[10pt] uppercase text-black">Firma y Sello</p>
                                <p className="text-[7.5pt] font-black text-gray-500 uppercase tracking-widest">COORDINADOR DEL PROGRAMA DE ESTUDIOS</p>
                                <p className="text-[7.5pt] font-bold text-gray-400 uppercase">{program?.name}</p>
                            </div>
                        </div>

                        {/* BLOQUE CENTRAL: UNIDAD ACADÉMICA */}
                        <div className="mt-24 flex justify-center">
                            <div className="text-center w-[300px] border-t-2 border-black pt-2">
                                <p className="font-black text-[10pt] uppercase text-black">V° B° DIRECCIÓN</p>
                                <p className="text-[8pt] font-black text-gray-500 uppercase tracking-[0.3em]">UNIDAD ACADÉMICA</p>
                            </div>
                        </div>
                    </section>
                </div>
                <footer className="print-footer">
                    <div className="text-[6.5pt] font-black uppercase tracking-[0.3em] opacity-30 italic">Generado Digitalmente por STEM V2 - Plataforma Educativa</div>
                    <div className="page-number font-black border-l border-black pl-4 h-full flex items-center"></div>
                </footer>
            </div>
        </div>
    );
}
