
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

const PageHeader = ({ institute }: { institute: Institute | null }) => (
    <div className="inst-header flex items-center justify-between border-b-2 border-black pb-2 mb-4">
        <div className="flex items-center gap-4">
            {institute?.logoUrl && (
                <img src={institute.logoUrl} alt="Logo" className="w-[50px] h-[50px] object-contain" />
            )}
            <div>
                <p className="font-bold text-[10pt] leading-tight text-black">{institute?.name.toUpperCase()}</p>
                <p className="text-[7pt] tracking-widest text-gray-500 uppercase">Sistema Tecnológico de Educación Modular</p>
            </div>
        </div>
        <div className="text-right text-[7pt] text-black">
            <p className="font-bold">SÍLABO ACADÉMICO</p>
            <p className="uppercase">{format(new Date(), 'MMMM yyyy', { locale: es })}</p>
        </div>
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

    // Función para calcular las fechas de la semana
    const getWeekDateRange = (weekNum: number): string => {
        if (!academicDates?.start) return '---';
        try {
            // Buscamos el lunes de la semana en la que inicia el periodo
            const semesterStart = startOfWeek(academicDates.start, { weekStartsOn: 1 });
            const monday = addDays(semesterStart, (weekNum - 1) * 7);
            const sunday = addDays(monday, 6);
            
            return `${format(monday, 'dd/MM')} al ${format(sunday, 'dd/MM')}`;
        } catch (e) {
            return '---';
        }
    };
    
    const currentModule = program?.modules.find(m => m.code === unit.moduleId);
    const weeklyHours = (unit.theoreticalHours || 0) + (unit.practicalHours || 0);

    return (
        <div className="bg-white text-black font-sans w-full">
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
                                <img 
                                    src={institute.logoUrl} 
                                    alt="Logo Institucional" 
                                    className="w-[200px] h-[200px] object-contain" 
                                />
                            )}
                        </div>

                        <div className="text-center space-y-2 pt-2">
                            <p className="text-[11pt] font-bold text-gray-600 uppercase tracking-[0.4em]">Programa de Estudios</p>
                            <h2 className="text-[16pt] font-black uppercase px-12 leading-snug text-black">
                                {program?.name.toUpperCase()}
                            </h2>
                        </div>
                        
                        <div className="border-y-2 border-black py-8 w-full text-center my-4 bg-gray-50">
                            <h2 className="text-[20pt] font-black tracking-[0.1em] text-black px-4">
                                SÍLABO DE {unit.name.toUpperCase()}
                            </h2>
                        </div>
                    </div>

                    <div className="w-full max-w-3xl mx-auto px-12 grid grid-cols-2 gap-12 pt-8 border-t-2 border-black">
                        <div className="space-y-1">
                            <p className="text-[9pt] font-black text-gray-500 uppercase tracking-widest">Docente Responsable</p>
                            <p className="text-[12pt] font-bold uppercase text-black">{teacher?.fullName || 'Personal Asignado'}</p>
                        </div>
                        <div className="space-y-1 text-right">
                            <p className="text-[9pt] font-black text-gray-500 uppercase tracking-widest">Año Académico</p>
                            <p className="text-[14pt] font-black text-black">{currentYear}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- PÁGINA 2: INFO, SUMILLA, COMPETENCIA E INDICADORES --- */}
            <div className="page-break py-4">
                <PageHeader institute={institute} />
                
                <div className="mt-6 space-y-8 px-4">
                    <section>
                        <h3 className="text-[11pt] font-black border-b-2 border-black pb-1 mb-4 flex items-center gap-2 text-black">
                            <span className="bg-black text-white px-2 py-0.5 text-[8pt]">I</span>
                            INFORMACIÓN GENERAL
                        </h3>
                        <table className="w-full border-collapse border-2 border-black">
                            <tbody className="text-[8.5pt]">
                                <tr>
                                    <th className="w-[30%] text-left bg-gray-100 p-1.5 border border-black uppercase font-bold text-black">Sector Económico</th>
                                    <td className="p-1.5 border border-black font-medium uppercase text-black">{program?.economicSector || '---'}</td>
                                </tr>
                                <tr>
                                    <th className="text-left bg-gray-100 p-1.5 border border-black uppercase font-bold text-black">Familia Productiva</th>
                                    <td className="p-1.5 border border-black font-medium uppercase text-black">{program?.productiveFamily || '---'}</td>
                                </tr>
                                <tr>
                                    <th className="text-left bg-gray-100 p-1.5 border border-black uppercase font-bold text-black">Actividad Económica</th>
                                    <td className="p-1.5 border border-black font-medium uppercase text-black">{program?.economicActivity || '---'}</td>
                                </tr>
                                <tr>
                                    <th className="text-left bg-gray-100 p-1.5 border border-black uppercase font-bold text-black">Programa de Estudios</th>
                                    <td className="p-1.5 border border-black font-semibold uppercase text-black">{program?.name}</td>
                                </tr>
                                <tr>
                                    <th className="text-left bg-gray-100 p-1.5 border border-black uppercase font-bold text-black">Módulo Profesional</th>
                                    <td className="p-1.5 border border-black uppercase text-black">{currentModule?.name} ({currentModule?.code})</td>
                                </tr>
                                <tr>
                                    <th className="text-left bg-gray-100 p-1.5 border border-black uppercase font-bold text-black">Unidad Didáctica</th>
                                    <td className="p-1.5 border border-black font-black uppercase text-[9.5pt] text-black">{unit.name}</td>
                                </tr>
                                <tr>
                                    <th className="text-left bg-gray-100 p-1.5 border border-black uppercase font-bold text-black">Ciclo / Semestre</th>
                                    <td className="p-1.5 border border-black text-black">{unit.semester}° Semestre</td>
                                </tr>
                                <tr>
                                    <th className="text-left bg-gray-100 p-1.5 border border-black uppercase font-bold text-black">Créditos</th>
                                    <td className="p-1.5 border border-black text-black">
                                        Total: <span className="font-bold">{unit.credits}</span> | Teoría: {unit.theoreticalHours > 0 ? (unit.credits / 2).toFixed(1) : 0} | Práctica: {unit.practicalHours > 0 ? (unit.credits / 2).toFixed(1) : 0}
                                    </td>
                                </tr>
                                <tr>
                                    <th className="text-left bg-gray-100 p-1.5 border border-black uppercase font-bold text-black">Horas Semanales / Totales</th>
                                    <td className="p-1.5 border border-black text-black">
                                        {weeklyHours} h/s (T: {unit.theoreticalHours}h / P: {unit.practicalHours}h) | Total: <span className="font-bold">{unit.totalHours} horas</span>
                                    </td>
                                </tr>
                                <tr>
                                    <th className="text-left bg-gray-100 p-1.5 border border-black uppercase font-bold text-black">Turno / Periodo</th>
                                    <td className="p-1.5 border border-black font-bold uppercase text-black">{unit.turno} | {unit.period} {currentYear}</td>
                                </tr>
                                <tr>
                                    <th className="text-left bg-gray-100 p-1.5 border border-black uppercase font-bold text-black">Vigencia (Cronograma)</th>
                                    <td className="p-1.5 border border-black italic text-black">
                                        Desde: {academicDates?.start ? format(academicDates.start, 'dd/MM/yyyy') : '---'} hasta {academicDates?.end ? format(academicDates.end, 'dd/MM/yyyy') : '---'}
                                    </td>
                                </tr>
                                <tr>
                                    <th className="text-left bg-gray-100 p-1.5 border border-black uppercase font-bold text-black">Docente Responsable</th>
                                    <td className="p-1.5 border border-black font-bold uppercase text-black">{teacher?.fullName}</td>
                                </tr>
                            </tbody>
                        </table>
                    </section>

                    <section>
                        <h3 className="text-[11pt] font-black border-b-2 border-black pb-1 mb-3 flex items-center gap-2 text-black">
                            <span className="bg-black text-white px-2 py-0.5 text-[8pt]">II</span>
                            SUMILLA
                        </h3>
                        <div className="text-justify pl-6 text-[9pt] leading-relaxed border-l-4 border-gray-100 text-black">
                            {renderHtml(syllabus?.summary)}
                        </div>
                    </section>

                    <section>
                        <h3 className="text-[11pt] font-black border-b-2 border-black pb-1 mb-3 flex items-center gap-2 text-black">
                            <span className="bg-black text-white px-2 py-0.5 text-[8pt]">III</span>
                            COMPETENCIA DE LA UNIDAD DIDÁCTICA
                        </h3>
                        <div className="text-justify pl-6 text-[9pt] leading-relaxed border-l-4 border-gray-100 text-black">
                            {renderHtml(syllabus?.competence)}
                        </div>
                    </section>

                    <section>
                        <h3 className="text-[11pt] font-black border-b-2 border-black pb-1 mb-3 flex items-center gap-2 text-black">
                            <span className="bg-black text-white px-2 py-0.5 text-[8pt]">IV</span>
                            INDICADORES DE LOGRO
                        </h3>
                        <div className="pl-6 space-y-2">
                            {indicators.map((ind, idx) => (
                                <div key={ind.id} className="flex gap-4 items-center">
                                    <span className="font-bold text-[9pt] text-primary whitespace-nowrap">{(idx + 1).toString().padStart(2, '0')}.</span>
                                    <p className="text-[9pt] font-bold uppercase leading-tight text-black">{ind.name}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>

            {/* --- PÁGINA 3: ORGANIZACIÓN (AGRUPADA POR INDICADOR) --- */}
            <div className="page-break py-4">
                <PageHeader institute={institute} />
                <div className="px-4">
                    <h3 className="text-[11pt] font-black border-b-2 border-black pb-1 my-4 flex items-center gap-2 text-black">
                        <span className="bg-black text-white px-2 py-0.5 text-[8pt]">V</span>
                        ORGANIZACIÓN DE ACTIVIDADES Y CONTENIDOS
                    </h3>
                    <table className="w-full border-collapse border-2 border-black text-[7.5pt]">
                        <thead>
                            <tr className="bg-gray-100 font-bold uppercase text-black">
                                <th className="border-2 border-black p-1.5 w-[12%]">SEM. / FECHA</th>
                                <th className="border-2 border-black p-1.5 w-[33%]">ELEMENTOS DE CAPACIDAD</th>
                                <th className="border-2 border-black p-1.5 w-[25%]">ACTIVIDADES DE APRENDIZAJE</th>
                                <th className="border-2 border-black p-1.5 w-[22%]">CONTENIDOS BÁSICOS</th>
                                <th className="border-2 border-black p-1.5 w-[8%]">HORAS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {indicators.map((ind) => {
                                const weeksInIndicator = weeklyData.filter(w => w.weekNumber >= ind.startWeek && w.weekNumber <= ind.endWeek);
                                return (
                                    <React.Fragment key={ind.id}>
                                        {/* Encabezado del Indicador dentro de la tabla */}
                                        <tr className="bg-gray-50">
                                            <td colSpan={5} className="border-2 border-black p-2 font-black uppercase text-primary bg-blue-50/50 text-center">
                                                {ind.name}
                                            </td>
                                        </tr>
                                        {weeksInIndicator.map(week => (
                                            <tr key={week.weekNumber} className="border-black">
                                                <td className="border border-black p-1 text-center font-bold bg-white text-black leading-tight">
                                                    Sem. {week.weekNumber}
                                                    <br />
                                                    <span className="text-[6.5pt] font-normal text-gray-500">
                                                        ({getWeekDateRange(week.weekNumber)})
                                                    </span>
                                                </td>
                                                <td className="border border-black p-1.5 align-top text-black">{renderHtml(week.capacityElement)}</td>
                                                <td className="border border-black p-1.5 align-top text-black">{renderHtml(week.learningActivities)}</td>
                                                <td className="border border-black p-1.5 align-top font-medium italic text-black">{renderHtml(week.basicContents)}</td>
                                                <td className="border border-black p-1.5 text-center align-middle font-bold text-black">
                                                    {weeklyHours}h
                                                </td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- ÚLTIMA PÁGINA: METODOLOGÍA Y FIRMAS --- */}
            <div className="py-4">
                <PageHeader institute={institute} />
                <div className="mt-6 space-y-8 px-4">
                    <section>
                        <h3 className="text-[11pt] font-black border-b-2 border-black pb-1 mb-3 flex items-center gap-2 text-black">
                            <span className="bg-black text-white px-2 py-0.5 text-[8pt]">VI</span>
                            METODOLOGÍA
                        </h3>
                        <div className="text-justify pl-6 text-[9pt] leading-relaxed border-l-4 border-gray-100 text-black">
                            {renderHtml(syllabus?.methodology)}
                        </div>
                    </section>

                    <section>
                        <h3 className="text-[11pt] font-black border-b-2 border-black pb-1 mb-3 flex items-center gap-2 text-black">
                            <span className="bg-black text-white px-2 py-0.5 text-[8pt]">VII</span>
                            FUENTES DE INFORMACIÓN Y BIBLIOGRAFÍA
                        </h3>
                        <div className="text-justify pl-6 text-[9pt] leading-relaxed border-l-4 border-gray-100 text-black">
                            {renderHtml(syllabus?.bibliography)}
                        </div>
                    </section>

                    <section className="pt-24">
                        <div className="flex justify-around items-end">
                            <div className="text-center w-72 border-t-2 border-black pt-2">
                                <p className="font-black text-[10pt] uppercase text-black">{teacher?.fullName || 'Firma del Docente'}</p>
                                <p className="text-[8pt] font-bold text-gray-500 uppercase tracking-widest">Docente Responsable</p>
                            </div>
                            <div className="text-center w-72 border-t-2 border-black pt-2">
                                <p className="font-black text-[10pt] uppercase text-black">Secretaría Académica</p>
                                <p className="text-[8pt] font-bold text-gray-500 uppercase tracking-widest">V° B° Coordinación</p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
