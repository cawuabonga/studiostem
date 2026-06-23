
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
        <div className="inst-header border-b-2 border-black pb-2 mb-6 no-print-break">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {institute?.logoUrl ? (
                        <img src={institute.logoUrl} alt="Logo" className="w-[50px] h-[50px] object-contain" />
                    ) : (
                        <div className="w-[45px] h-[45px] border border-dashed border-gray-300 flex items-center justify-center text-[6pt]">LOGO</div>
                    )}
                    <div>
                        <p className="font-bold text-[11pt] leading-tight text-black">{institute?.name?.toUpperCase() || ''}</p>
                        <p className="text-[7pt] tracking-widest text-gray-500 uppercase font-medium">Sistema Tecnológico de Educación Modular</p>
                    </div>
                </div>
                <div className="text-right leading-tight">
                    <p className="font-bold text-[9pt] uppercase text-black">SÍLABO ACADÉMICO</p>
                    <p className="text-[8pt] text-gray-600 uppercase font-bold">{format(today, 'MMMM yyyy', { locale: es })}</p>
                </div>
            </div>
        </div>
    );
};

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
        <div className="printable-area bg-white text-black font-sans w-full leading-normal">
            
            {/* Pie de Página Fijo (15mm) - Se oculta en la hoja 1 mediante el footer-hider */}
            <div className="print-footer">
                <div className="flex flex-col">
                    <span className="uppercase font-black text-[7pt] tracking-tight">{institute?.name}</span>
                    <span className="text-[6pt] text-gray-500 italic">Documento Académico Generado Digitalmente por STEM V2</span>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[7pt] font-black uppercase">{unit.code} | {unit.turno}</span>
                    <span className="page-number-display text-[7pt] font-bold"></span>
                </div>
            </div>

            {/* --- PÁGINA 1: PORTADA --- */}
            <div className="cover-page page-break">
                <div className="w-full space-y-6 flex flex-col items-center">
                    <div className="text-center space-y-4">
                        <h1 className="text-[24pt] font-black tracking-tight leading-tight max-w-4xl text-black">
                            {institute?.name?.toUpperCase() || ''}
                        </h1>
                        <div className="h-1.5 w-48 bg-black mx-auto"></div>
                    </div>

                    <div className="py-12">
                        {designOptions.showLogo && institute?.logoUrl && (
                            <img src={institute.logoUrl} alt="Logo" className="w-[200px] h-[200px] object-contain" />
                        )}
                    </div>

                    <div className="text-center space-y-2 pt-2">
                        <p className="text-[11pt] font-bold text-gray-600 uppercase tracking-[0.4em]">Programa de Estudios</p>
                        <h2 className="text-[16pt] font-black uppercase px-12 leading-snug text-black">{program?.name?.toUpperCase() || ''}</h2>
                    </div>
                    
                    <div className="border-y-2 border-black py-8 w-full text-center my-4 bg-gray-50">
                        <h2 className="text-[20pt] font-black tracking-[0.1em] text-black px-4 uppercase">SÍLABO DE {unit.name}</h2>
                    </div>
                </div>

                {/* Docente y Año desplazados más abajo */}
                <div className="w-full max-w-3xl mx-auto px-12 grid grid-cols-2 gap-12 pb-20 border-t-2 border-black pt-12 mt-12">
                    <div className="space-y-1">
                        <p className="text-[9pt] font-black text-gray-500 uppercase tracking-widest">Docente Responsable</p>
                        <p className="text-[12pt] font-bold uppercase text-black">{teacher?.fullName || 'Personal Asignado'}</p>
                    </div>
                    <div className="space-y-1 text-right">
                        <p className="text-[9pt] font-black text-gray-500 uppercase tracking-widest">Año Académico</p>
                        <p className="text-[20pt] font-black text-black leading-none">{currentYear}</p>
                    </div>
                </div>

                {/* Ocultador de Pie de Página para Hoja 1 */}
                <div className="footer-hider"></div>
            </div>

            {/* --- PÁGINA 2: INFORMACIÓN GENERAL Y SUMILLA --- */}
            <div className="second-page-fixed page-break pt-4">
                <PageHeader institute={institute} />
                
                <div className="mt-6 space-y-8 px-4 flex-1">
                    <section>
                        <h3 className="text-[11pt] font-black border-b-2 border-black pb-1 mb-4 flex items-center gap-3 text-black">
                            <span className="bg-black text-white px-2 py-0.5 text-[9pt] min-w-[30px] text-center rounded-sm">I</span>
                            INFORMACIÓN GENERAL
                        </h3>
                        <table className="w-full border-collapse border-2 border-black">
                            <tbody className="text-[8pt]">
                                <tr><th className="w-[30%] text-left bg-gray-100 p-1 border border-black uppercase font-black">Sector Económico</th><td className="p-1 border border-black uppercase">{program?.economicSector || '---'}</td></tr>
                                <tr><th className="text-left bg-gray-100 p-1 border border-black uppercase font-black">Familia Productiva</th><td className="p-1 border border-black uppercase">{program?.productiveFamily || '---'}</td></tr>
                                <tr><th className="text-left bg-gray-100 p-1 border border-black uppercase font-black">Activity Económica</th><td className="p-1 border border-black uppercase">{program?.economicActivity || '---'}</td></tr>
                                <tr><th className="text-left bg-gray-100 p-1 border border-black uppercase font-black">Programa de Estudios</th><td className="p-1 border border-black uppercase font-bold">{program?.name}</td></tr>
                                <tr><th className="text-left bg-gray-100 p-1 border border-black uppercase font-black">Módulo Profesional</th><td className="p-1 border border-black uppercase">{currentModule?.name}</td></tr>
                                <tr><th className="text-left bg-gray-100 p-1 border border-black uppercase font-black">Unidad Didáctica</th><td className="p-1 border border-black font-black uppercase text-[9pt] text-primary">{unit.name}</td></tr>
                                <tr><th className="text-left bg-gray-100 p-1 border border-black uppercase font-black">Ciclo / Semestre</th><td className="p-1 border border-black font-bold">{unit.semester}° Semestre</td></tr>
                                <tr><th className="text-left bg-gray-100 p-1 border border-black uppercase font-black">Créditos</th><td className="p-1 border border-black">{unit.credits}</td></tr>
                                <tr><th className="text-left bg-gray-100 p-1 border border-black uppercase font-black">Horas Semanales / Totales</th><td className="p-1 border border-black">{weeklyHours} h/s | {unit.totalHours} Totales</td></tr>
                                <tr><th className="text-left bg-gray-100 p-1 border border-black uppercase font-black">Turno / Periodo</th><td className="p-1 border border-black font-bold uppercase">{unit.turno} | {unit.period} {currentYear}</td></tr>
                                <tr><th className="text-left bg-gray-100 p-1 border border-black uppercase font-black">Docente Responsable</th><td className="p-1 border border-black font-bold uppercase">{teacher?.fullName}</td></tr>
                            </tbody>
                        </table>
                    </section>

                    <section>
                        <h3 className="text-[11pt] font-black border-b-2 border-black pb-1 mb-3 flex items-center gap-3 text-black">
                            <span className="bg-black text-white px-2 py-0.5 text-[9pt] min-w-[30px] text-center rounded-sm">II</span>
                            SUMILLA
                        </h3>
                        <div className="text-justify pl-6 text-[9pt] leading-relaxed border-l-4 border-black text-black font-medium">
                            {renderHtml(syllabus?.summary)}
                        </div>
                    </section>
                </div>
            </div>

            {/* --- PÁGINAS 3 EN ADELANTE: CONTENIDO FLUIDO --- */}
            <div className="dynamic-content page-break pt-4">
                <PageHeader institute={institute} />
                <div className="space-y-12 px-4">
                    
                    <section>
                        <h3 className="text-[11pt] font-black border-b-2 border-black pb-1 mb-3 flex items-center gap-3 text-black">
                            <span className="bg-black text-white px-2 py-0.5 text-[9pt] min-w-[30px] text-center rounded-sm">III</span>
                            COMPETENCIA DE LA UNIDAD DIDÁCTICA
                        </h3>
                        <div className="text-justify pl-6 text-[9pt] leading-relaxed border-l-4 border-black text-black">
                            {renderHtml(syllabus?.competence)}
                        </div>
                    </section>

                    <section>
                        <h3 className="text-[11pt] font-black border-b-2 border-black pb-1 mb-3 flex items-center gap-3 text-black">
                            <span className="bg-black text-white px-2 py-0.5 text-[9pt] min-w-[30px] text-center rounded-sm">IV</span>
                            CAPACIDAD DE LA UNIDAD DIDÁCTICA
                        </h3>
                        <div className="text-justify pl-6 text-[9pt] leading-relaxed border-l-4 border-black text-black">
                            {renderHtml(syllabus?.capacity)}
                        </div>
                    </section>

                    <section>
                        <h3 className="text-[11pt] font-black border-b-2 border-black pb-1 mb-3 flex items-center gap-3 text-black">
                            <span className="bg-black text-white px-2 py-0.5 text-[9pt] min-w-[30px] text-center rounded-sm">V</span>
                            COMPETENCIAS TRASVERSALES PARA LA EMPLEABILIDAD
                        </h3>
                        <div className="text-justify pl-6 text-[9pt] leading-relaxed border-l-4 border-black text-black">
                            {renderHtml(syllabus?.transversalCompetencies)}
                        </div>
                    </section>

                    <section>
                        <h3 className="text-[11pt] font-black border-b-2 border-black pb-1 mb-3 flex items-center gap-3 text-black">
                            <span className="bg-black text-white px-2 py-0.5 text-[9pt] min-w-[30px] text-center rounded-sm">VI</span>
                            INDICADORES DE LOGRO
                        </h3>
                        <div className="pl-6 space-y-2">
                            {indicators.map((ind, idx) => (
                                <div key={ind.id} className="flex gap-4 items-center">
                                    <span className="font-black text-[9pt] text-black bg-gray-100 px-2 py-0.5 rounded-sm">{(idx + 1).toString().padStart(2, '0')}</span>
                                    <p className="text-[9pt] font-bold uppercase leading-tight text-black">{ind.name}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section>
                        <h3 className="text-[11pt] font-black border-b-2 border-black pb-1 my-4 flex items-center gap-3 text-black">
                            <span className="bg-black text-white px-2 py-0.5 text-[9pt] min-w-[30px] text-center rounded-sm">VII</span>
                            ORGANIZACIÓN DE ACTIVIDADES Y CONTENIDOS
                        </h3>
                        <table className="w-full border-collapse border-2 border-black text-[7pt]">
                            <thead>
                                <tr className="bg-gray-100 font-black uppercase text-black">
                                    <th className="border-2 border-black p-1 w-[8%]">SEM.</th>
                                    <th className="border-2 border-black p-1 w-[35%]">ELEMENTOS DE CAPACIDAD</th>
                                    <th className="border-2 border-black p-1 w-[25%]">ACTIVIDADES DE APRENDIZAJE</th>
                                    <th className="border-2 border-black p-1 w-[22%]">ACTIVIDAD FORMATIVA</th>
                                    <th className="border-2 border-black p-1 w-[10%]">HORAS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {indicators.map((ind) => {
                                    const weeksInIndicator = weeklyData.filter(w => w.weekNumber >= ind.startWeek && w.weekNumber <= ind.endWeek);
                                    return (
                                        <React.Fragment key={ind.id}>
                                            <tr className="bg-gray-200">
                                                <td colSpan={5} className="border-2 border-black p-1 font-black uppercase text-black text-center italic tracking-wider">
                                                    {ind.name}
                                                </td>
                                            </tr>
                                            {weeksInIndicator.map(week => (
                                                <tr key={week.weekNumber}>
                                                    <td className="border border-black p-1 text-center font-black bg-white text-black leading-tight">
                                                        {week.weekNumber}
                                                        <br />
                                                        <span className="text-[5pt] font-bold text-gray-500">({getWeekDateRange(week.weekNumber)})</span>
                                                    </td>
                                                    <td className="border border-black p-1 align-top text-black">{renderHtml(week.capacityElement)}</td>
                                                    <td className="border border-black p-1 align-top text-black">{renderHtml(week.learningActivities)}</td>
                                                    <td className="border border-black p-1 align-top font-bold italic text-black">{renderHtml(week.basicContents)}</td>
                                                    <td className="border border-black p-1 text-center align-middle font-black text-black">{weeklyHours}h</td>
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </section>

                    <section>
                        <h3 className="text-[11pt] font-black border-b-2 border-black pb-1 mb-3 flex items-center gap-3 text-black">
                            <span className="bg-black text-white px-2 py-0.5 text-[9pt] min-w-[30px] text-center rounded-sm">VIII</span>
                            METODOLOGÍA
                        </h3>
                        <div className="text-justify pl-6 text-[9pt] leading-relaxed border-l-4 border-black text-black">
                            {renderHtml(syllabus?.methodology)}
                        </div>
                    </section>

                    <section>
                        <h3 className="text-[11pt] font-black border-b-2 border-black pb-1 mb-3 flex items-center gap-3 text-black">
                            <span className="bg-black text-white px-2 py-0.5 text-[9pt] min-w-[30px] text-center rounded-sm">IX</span>
                            FUENTES DE INFORMACIÓN Y BIBLIOGRAFÍA
                        </h3>
                        <div className="text-justify pl-6 text-[8pt] leading-relaxed border-l-4 border-black text-black font-mono">
                            {renderHtml(syllabus?.bibliography)}
                        </div>
                    </section>

                    {/* SECCIÓN DE FIRMAS */}
                    <section className="pt-24 no-print-break">
                        <div className="grid grid-cols-2 gap-x-20 items-end px-12">
                            <div className="text-center border-t-2 border-black pt-1">
                                <p className="font-black text-[9pt] uppercase text-black">{teacher?.fullName || 'Firma del Docente'}</p>
                                <p className="text-[7pt] font-black text-gray-500 uppercase tracking-widest">{program?.name}</p>
                            </div>
                            <div className="text-center border-t-2 border-black pt-1">
                                <p className="font-black text-[9pt] uppercase text-black">COORDINACIÓN DE PROGRAMA</p>
                                <p className="text-[7pt] font-black text-gray-500 uppercase tracking-widest">{program?.name}</p>
                            </div>
                        </div>

                        <div className="mt-16 flex justify-center">
                            <div className="text-center w-[250px] border-t-2 border-black pt-1">
                                <p className="font-black text-[9pt] uppercase text-black">V° B° UNIDAD ACADÉMICA</p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
