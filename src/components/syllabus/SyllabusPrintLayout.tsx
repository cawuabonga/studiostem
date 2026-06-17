
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
                        <p className="font-bold text-[11pt] leading-tight text-black">{institute?.name.toUpperCase()}</p>
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
        <div className="bg-white text-black font-sans w-full leading-normal">
            {/* --- PÁGINA 1: PORTADA --- */}
            <div className="page-break flex flex-col items-center">
                <div className="w-full flex flex-col items-center justify-between h-[265mm] py-8">
                    <div className="w-full space-y-6 flex flex-col items-center">
                        <div className="text-center space-y-4">
                            <h1 className="text-[24pt] font-black tracking-tight leading-tight max-w-4xl text-black">
                                {institute?.name.toUpperCase()}
                            </h1>
                            <div className="h-1.5 w-48 bg-black mx-auto"></div>
                        </div>

                        <div className="py-4">
                            {designOptions.showLogo && institute?.logoUrl && (
                                <img src={institute.logoUrl} alt="Logo" className="w-[200px] h-[200px] object-contain" />
                            )}
                        </div>

                        <div className="text-center space-y-2 pt-2">
                            <p className="text-[11pt] font-bold text-gray-600 uppercase tracking-[0.4em]">Programa de Estudios</p>
                            <h2 className="text-[16pt] font-black uppercase px-12 leading-snug text-black">{program?.name.toUpperCase()}</h2>
                        </div>
                        
                        <div className="border-y-2 border-black py-8 w-full text-center my-4 bg-gray-50">
                            <h2 className="text-[20pt] font-black tracking-[0.1em] text-black px-4 uppercase">SÍLABO DE {unit.name}</h2>
                        </div>
                    </div>

                    <div className="w-full max-w-3xl mx-auto px-12 grid grid-cols-2 gap-12 pt-8 border-t-2 border-black">
                        <div className="space-y-1">
                            <p className="text-[9pt] font-black text-gray-500 uppercase tracking-widest">Docente Responsable</p>
                            <p className="text-[12pt] font-bold uppercase text-black">{teacher?.fullName || 'Personal Asignado'}</p>
                        </div>
                        <div className="space-y-1 text-right">
                            <p className="text-[9pt] font-black text-gray-500 uppercase tracking-widest">Año</p>
                            <p className="text-[20pt] font-black text-black leading-none">{currentYear}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- PÁGINA 2: INFO, SUMILLA, COMPETENCIA --- */}
            <div className="page-break py-4">
                <PageHeader institute={institute} />
                
                <div className="mt-6 space-y-8 px-4">
                    <section>
                        <h3 className="text-[11pt] font-black border-b-2 border-black pb-1 mb-4 flex items-center gap-3 text-black no-print-break">
                            <span className="bg-black text-white px-2 py-0.5 text-[9pt] min-w-[30px] text-center rounded-sm">I</span>
                            INFORMACIÓN GENERAL
                        </h3>
                        <table className="w-full border-collapse border-2 border-black">
                            <tbody className="text-[8.5pt]">
                                <tr><th className="w-[30%] text-left bg-gray-100 p-1.5 border border-black uppercase font-black text-black">Sector Económico</th><td className="p-1.5 border border-black uppercase text-black">{program?.economicSector || '---'}</td></tr>
                                <tr><th className="text-left bg-gray-100 p-1.5 border border-black uppercase font-black text-black">Familia Productiva</th><td className="p-1.5 border border-black uppercase text-black">{program?.productiveFamily || '---'}</td></tr>
                                <tr><th className="text-left bg-gray-100 p-1.5 border border-black uppercase font-black text-black">Activity Económica</th><td className="p-1.5 border border-black uppercase text-black">{program?.economicActivity || '---'}</td></tr>
                                <tr><th className="text-left bg-gray-100 p-1.5 border border-black uppercase font-black text-black">Programa de Estudios</th><td className="p-1.5 border border-black uppercase font-bold text-black">{program?.name}</td></tr>
                                <tr><th className="text-left bg-gray-100 p-1.5 border border-black uppercase font-black text-black">Módulo Profesional</th><td className="p-1.5 border border-black uppercase text-black">{currentModule?.name}</td></tr>
                                <tr><th className="text-left bg-gray-100 p-1.5 border border-black uppercase font-black text-black">Unidad Didáctica</th><td className="p-1.5 border border-black font-black uppercase text-[9.5pt] text-primary">{unit.name}</td></tr>
                                <tr><th className="text-left bg-gray-100 p-1.5 border border-black uppercase font-black text-black">Ciclo / Semestre</th><td className="p-1.5 border border-black font-bold text-black">{unit.semester}° Semestre</td></tr>
                                <tr><th className="text-left bg-gray-100 p-1.5 border border-black uppercase font-black text-black">Créditos</th><td className="p-1.5 border border-black text-black">{unit.credits}</td></tr>
                                <tr><th className="text-left bg-gray-100 p-1.5 border border-black uppercase font-black text-black">Horas Semanales / Totales</th><td className="p-1.5 border border-black text-black">{weeklyHours} h/s | {unit.totalHours} Totales</td></tr>
                                <tr><th className="text-left bg-gray-100 p-1.5 border border-black uppercase font-black text-black">Turno / Periodo</th><td className="p-1.5 border border-black font-bold uppercase text-black">{unit.turno} | {unit.period} {currentYear}</td></tr>
                                <tr><th className="text-left bg-gray-100 p-1.5 border border-black uppercase font-black text-black">Docente Responsable</th><td className="p-1.5 border border-black font-bold uppercase text-black">{teacher?.fullName}</td></tr>
                            </tbody>
                        </table>
                    </section>

                    <section>
                        <h3 className="text-[11pt] font-black border-b-2 border-black pb-1 mb-3 flex items-center gap-3 text-black no-print-break">
                            <span className="bg-black text-white px-2 py-0.5 text-[9pt] min-w-[30px] text-center rounded-sm">II</span>
                            SUMILLA
                        </h3>
                        <div className="text-justify pl-6 text-[9pt] leading-relaxed border-l-4 border-black text-black font-medium">
                            {renderHtml(syllabus?.summary)}
                        </div>
                    </section>

                    <section>
                        <h3 className="text-[11pt] font-black border-b-2 border-black pb-1 mb-3 flex items-center gap-3 text-black no-print-break">
                            <span className="bg-black text-white px-2 py-0.5 text-[9pt] min-w-[30px] text-center rounded-sm">III</span>
                            COMPETENCIA DE LA UNIDAD DIDÁCTICA
                        </h3>
                        <div className="text-justify pl-6 text-[9pt] leading-relaxed border-l-4 border-black text-black">
                            {renderHtml(syllabus?.competence)}
                        </div>
                    </section>
                </div>
                
                <footer className="print-footer">
                    <div className="uppercase font-black tracking-widest">{institute?.name}</div>
                    <div className="page-number font-black"></div>
                </footer>
            </div>

            {/* --- PÁGINA 3: CAPACIDAD, TRASVERSALES E INDICADORES --- */}
            <div className="page-break py-4">
                <PageHeader institute={institute} />
                <div className="mt-6 space-y-12 px-4">
                    <section>
                        <h3 className="text-[11pt] font-black border-b-2 border-black pb-1 mb-3 flex items-center gap-3 text-black no-print-break">
                            <span className="bg-black text-white px-2 py-0.5 text-[9pt] min-w-[30px] text-center rounded-sm">IV</span>
                            CAPACIDAD DE LA UNIDAD DIDÁCTICA
                        </h3>
                        <div className="text-justify pl-6 text-[9pt] leading-relaxed border-l-4 border-black text-black">
                            {renderHtml(syllabus?.capacity)}
                        </div>
                    </section>

                    <section>
                        <h3 className="text-[11pt] font-black border-b-2 border-black pb-1 mb-3 flex items-center gap-3 text-black no-print-break">
                            <span className="bg-black text-white px-2 py-0.5 text-[9pt] min-w-[30px] text-center rounded-sm">V</span>
                            COMPETENCIAS TRASVERSALES PARA LA EMPLEABILIDAD
                        </h3>
                        <div className="text-justify pl-6 text-[9pt] leading-relaxed border-l-4 border-black text-black">
                            {renderHtml(syllabus?.transversalCompetencies)}
                        </div>
                    </section>

                    <section>
                        <h3 className="text-[11pt] font-black border-b-2 border-black pb-1 mb-3 flex items-center gap-3 text-black no-print-break">
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
                </div>
                <footer className="print-footer">
                    <div className="uppercase font-black tracking-widest">{unit.name} - {unit.code}</div>
                    <div className="page-number font-black"></div>
                </footer>
            </div>

            {/* --- PÁGINA 4: ORGANIZACIÓN --- */}
            <div className="page-break py-4">
                <PageHeader institute={institute} />
                <div className="px-4">
                    <h3 className="text-[11pt] font-black border-b-2 border-black pb-1 my-4 flex items-center gap-3 text-black no-print-break">
                        <span className="bg-black text-white px-2 py-0.5 text-[9pt] min-w-[30px] text-center rounded-sm">VII</span>
                        ORGANIZACIÓN DE ACTIVIDADES Y CONTENIDOS
                    </h3>
                    <table className="w-full border-collapse border-2 border-black text-[7pt]">
                        <thead>
                            <tr className="bg-gray-100 font-black uppercase text-black">
                                <th className="border-2 border-black p-1.5 w-[12%]">SEM.</th>
                                <th className="border-2 border-black p-1.5 w-[33%]">ELEMENTOS DE CAPACIDAD</th>
                                <th className="border-2 border-black p-1.5 w-[25%]">ACTIVIDADES DE APRENDIZAJE</th>
                                <th className="border-2 border-black p-1.5 w-[22%]">ACTIVIDAD FORMATIVA</th>
                                <th className="border-2 border-black p-1.5 w-[8%]">HORAS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {indicators.map((ind) => {
                                const weeksInIndicator = weeklyData.filter(w => w.weekNumber >= ind.startWeek && w.weekNumber <= ind.endWeek);
                                return (
                                    <React.Fragment key={ind.id}>
                                        <tr className="bg-gray-200">
                                            <td colSpan={5} className="border-2 border-black p-1.5 font-black uppercase text-black text-center italic tracking-wider">
                                                {ind.name}
                                            </td>
                                        </tr>
                                        {weeksInIndicator.map(week => (
                                            <tr key={week.weekNumber}>
                                                <td className="border border-black p-1.5 text-center font-black bg-white text-black leading-tight">
                                                    {week.weekNumber}
                                                    <br />
                                                    <span className="text-[5.5pt] font-bold text-gray-500">({getWeekDateRange(week.weekNumber)})</span>
                                                </td>
                                                <td className="border border-black p-1.5 align-top text-black">{renderHtml(week.capacityElement)}</td>
                                                <td className="border border-black p-1.5 align-top text-black">{renderHtml(week.learningActivities)}</td>
                                                <td className="border border-black p-1.5 align-top font-bold italic text-black">{renderHtml(week.basicContents)}</td>
                                                <td className="border border-black p-1.5 text-center align-middle font-black text-black">{weeklyHours}h</td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <footer className="print-footer">
                    <div className="uppercase font-black tracking-widest">Planificación Académica {currentYear}</div>
                    <div className="page-number font-black"></div>
                </footer>
            </div>

            {/* --- ÚLTIMA PÁGINA: METODOLOGÍA Y FIRMAS --- */}
            <div className="py-4">
                <PageHeader institute={institute} />
                <div className="mt-6 space-y-10 px-4">
                    <section>
                        <h3 className="text-[11pt] font-black border-b-2 border-black pb-1 mb-3 flex items-center gap-3 text-black no-print-break">
                            <span className="bg-black text-white px-2 py-0.5 text-[9pt] min-w-[30px] text-center rounded-sm">VIII</span>
                            METODOLOGÍA
                        </h3>
                        <div className="text-justify pl-6 text-[9pt] leading-relaxed border-l-4 border-black text-black">
                            {renderHtml(syllabus?.methodology)}
                        </div>
                    </section>

                    <section>
                        <h3 className="text-[11pt] font-black border-b-2 border-black pb-1 mb-3 flex items-center gap-3 text-black no-print-break">
                            <span className="bg-black text-white px-2 py-0.5 text-[9pt] min-w-[30px] text-center rounded-sm">IX</span>
                            FUENTES DE INFORMACIÓN Y BIBLIOGRAFÍA
                        </h3>
                        <div className="text-justify pl-6 text-[8pt] leading-relaxed border-l-4 border-black text-black font-mono">
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
                                <p className="text-[7.5pt] font-black text-gray-500 uppercase tracking-widest text-center leading-tight">COORDINADOR DEL PROGRAMA DE ESTUDIOS</p>
                                <p className="text-[7pt] font-bold text-gray-400 uppercase leading-tight text-center">{program?.name}</p>
                            </div>
                        </div>

                        <div className="mt-20 flex justify-center">
                            <div className="text-center w-[300px] border-t-2 border-black pt-2">
                                <p className="font-black text-[10pt] uppercase text-black">V° B° DIRECCIÓN</p>
                                <p className="text-[8pt] font-black text-gray-500 uppercase tracking-[0.3em]">UNIDAD ACADÉMICA</p>
                            </div>
                        </div>
                    </section>
                </div>
                <footer className="print-footer">
                    <div className="uppercase font-black tracking-widest text-[6pt] opacity-30 italic">Documento Académico STEM V2 • Generado Digitalmente</div>
                    <div className="page-number font-black"></div>
                </footer>
            </div>
        </div>
    );
}
