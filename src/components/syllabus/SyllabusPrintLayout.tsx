
"use client";

import React from 'react';
import type { Institute, Program, Unit, Teacher, Syllabus, WeekData, AchievementIndicator, SyllabusDesignOptions } from '@/types';
import { format } from 'date-fns';
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
    
    const currentModule = program?.modules.find(m => m.code === unit.moduleId);

    return (
        <div className="bg-white text-black font-sans w-full">
            {/* --- PÁGINA 1: PORTADA INSTITUCIONAL --- */}
            <div className="page-break py-12 flex flex-col items-center">
                <div className="w-full flex flex-col items-center justify-between min-h-[250mm]">
                    <div className="w-full space-y-10 flex flex-col items-center">
                        <div className="text-center space-y-4">
                            <h1 className="text-[26pt] font-black tracking-tight leading-tight max-w-4xl text-black">
                                {institute?.name.toUpperCase()}
                            </h1>
                            <div className="h-2 w-64 bg-black mx-auto"></div>
                        </div>

                        <div className="text-center space-y-2 pt-4">
                            <p className="text-[12pt] font-bold text-gray-600 uppercase tracking-[0.4em]">Programa de Estudios</p>
                            <h2 className="text-[18pt] font-black uppercase px-12 leading-snug text-black">
                                {program?.name.toUpperCase()}
                            </h2>
                        </div>
                        
                        <div className="border-y-4 border-black py-8 w-full text-center my-6 bg-gray-50">
                            <h2 className="text-[24pt] font-black tracking-[0.1em] text-black px-4">
                                SÍLABO DE {unit.name.toUpperCase()}
                            </h2>
                        </div>

                        <div className="py-12">
                            {designOptions.showLogo && institute?.logoUrl && (
                                <img 
                                    src={institute.logoUrl} 
                                    alt="Logo Institucional" 
                                    className="w-[380px] h-[380px] object-contain" 
                                />
                            )}
                        </div>
                    </div>

                    <div className="w-full max-w-3xl mx-auto px-12 grid grid-cols-2 gap-12 pt-12 border-t-2 border-black">
                        <div className="space-y-2">
                            <p className="text-[10pt] font-black text-gray-500 uppercase tracking-widest">Docente Responsable</p>
                            <p className="text-[13pt] font-bold uppercase text-black">{teacher?.fullName || 'Personal Asignado'}</p>
                        </div>
                        <div className="space-y-2 text-right">
                            <p className="text-[10pt] font-black text-gray-500 uppercase tracking-widest">Año Académico</p>
                            <p className="text-[14pt] font-black text-black">{currentYear}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- PÁGINA 2: INFORMACIÓN GENERAL Y SUMILLA --- */}
            <div className="page-break py-4">
                <PageHeader institute={institute} />
                
                <div className="mt-8 space-y-10 px-4">
                    <section>
                        <h3 className="text-[13pt] font-black border-b-2 border-black pb-1 mb-6 flex items-center gap-2 text-black">
                            <span className="bg-black text-white px-3 py-0.5 text-[10pt]">I</span>
                            INFORMACIÓN GENERAL
                        </h3>
                        <table className="w-full border-collapse border-2 border-black">
                            <tbody className="text-[9.5pt]">
                                <tr>
                                    <th className="w-[30%] text-left bg-gray-100 p-3 border border-black uppercase font-bold text-black">Programa de Estudios</th>
                                    <td className="p-3 border border-black font-semibold uppercase text-black">{program?.name}</td>
                                </tr>
                                <tr>
                                    <th className="text-left bg-gray-100 p-3 border border-black uppercase font-bold text-black">Módulo Profesional</th>
                                    <td className="p-3 border border-black uppercase text-black">{currentModule?.name} ({currentModule?.code})</td>
                                </tr>
                                <tr>
                                    <th className="text-left bg-gray-100 p-3 border border-black uppercase font-bold text-black">Unidad Didáctica</th>
                                    <td className="p-3 border border-black font-black uppercase text-[11pt] text-black">{unit.name}</td>
                                </tr>
                                <tr>
                                    <th className="text-left bg-gray-100 p-3 border border-black uppercase font-bold text-black">Ciclo / Semestre</th>
                                    <td className="p-3 border border-black text-black">{unit.semester}° Semestre</td>
                                </tr>
                                <tr>
                                    <th className="text-left bg-gray-100 p-3 border border-black uppercase font-bold text-black">Créditos</th>
                                    <td className="p-3 border border-black text-black">
                                        Total: <span className="font-bold">{unit.credits}</span> | Teoría: {unit.theoreticalHours > 0 ? (unit.credits / 2).toFixed(1) : 0} | Práctica: {unit.practicalHours > 0 ? (unit.credits / 2).toFixed(1) : 0}
                                    </td>
                                </tr>
                                <tr>
                                    <th className="text-left bg-gray-100 p-3 border border-black uppercase font-bold text-black">Horas Semanales / Totales</th>
                                    <td className="p-3 border border-black text-black">
                                        {(unit.totalHours / (unit.totalWeeks || 16)).toFixed(0)} h/s (T: {unit.theoreticalHours}h / P: {unit.practicalHours}h) | Total: <span className="font-bold">{unit.totalHours} horas</span>
                                    </td>
                                </tr>
                                <tr>
                                    <th className="text-left bg-gray-100 p-3 border border-black uppercase font-bold text-black">Turno / Periodo</th>
                                    <td className="p-3 border border-black font-bold uppercase text-black">{unit.turno} | {unit.period} {currentYear}</td>
                                </tr>
                                <tr>
                                    <th className="text-left bg-gray-100 p-3 border border-black uppercase font-bold text-black">Vigencia (Cronograma)</th>
                                    <td className="p-3 border border-black italic text-black">
                                        Desde: {academicDates?.start ? format(academicDates.start, 'dd/MM/yyyy') : '---'} hasta {academicDates?.end ? format(academicDates.end, 'dd/MM/yyyy') : '---'}
                                    </td>
                                </tr>
                                <tr>
                                    <th className="text-left bg-gray-100 p-3 border border-black uppercase font-bold text-black">Docente Responsable</th>
                                    <td className="p-3 border border-black font-bold uppercase text-black">{teacher?.fullName} ({teacher?.email})</td>
                                </tr>
                            </tbody>
                        </table>
                    </section>

                    <section>
                        <h3 className="text-[13pt] font-black border-b-2 border-black pb-1 mb-4 flex items-center gap-2 text-black">
                            <span className="bg-black text-white px-3 py-0.5 text-[10pt]">II</span>
                            SUMILLA
                        </h3>
                        <div className="text-justify pl-6 text-[10pt] leading-relaxed border-l-4 border-gray-100 text-black">
                            {renderHtml(syllabus?.summary)}
                        </div>
                    </section>
                </div>
            </div>

            {/* --- PÁGINA 3+: ORGANIZACIÓN DE ACTIVIDADES --- */}
            <div className="page-break py-4">
                <PageHeader institute={institute} />
                <div className="px-4">
                    <h3 className="text-[13pt] font-black border-b-2 border-black pb-1 my-6 flex items-center gap-2 text-black">
                        <span className="bg-black text-white px-3 py-0.5 text-[10pt]">III</span>
                        ORGANIZACIÓN DE ACTIVIDADES Y CONTENIDOS
                    </h3>
                    <table className="w-full border-collapse border-2 border-black text-[8.5pt]">
                        <thead>
                            <tr className="bg-gray-100 font-bold uppercase text-black">
                                <th className="border-2 border-black p-2 w-[5%]">SEM.</th>
                                <th className="border-2 border-black p-2 w-[30%]">ELEMENTOS DE CAPACIDAD</th>
                                <th className="border-2 border-black p-2 w-[30%]">ACTIVIDADES DE APRENDIZAJE</th>
                                <th className="border-2 border-black p-2 w-[25%]">CONTENIDOS BÁSICOS</th>
                                <th className="border-2 border-black p-2 w-[10%]">TAREAS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {weeklyData.map(week => (
                                <tr key={week.weekNumber} className="border-black">
                                    <td className="border border-black text-center font-bold bg-gray-50 text-black">{week.weekNumber}</td>
                                    <td className="border border-black p-2 align-top text-black">{renderHtml(week.capacityElement)}</td>
                                    <td className="border border-black p-2 align-top text-black">{renderHtml(week.learningActivities)}</td>
                                    <td className="border border-black p-2 align-top font-medium italic text-black">{renderHtml(week.basicContents)}</td>
                                    <td className="border border-black p-2 text-center align-top text-black">
                                        {(week.tasks || []).length > 0 ? `${(week.tasks || []).length} ent.` : '--'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- ÚLTIMA PÁGINA: FIRMAS --- */}
            <div className="py-6 overflow-visible">
                <PageHeader institute={institute} />
                <section className="pt-24 px-4">
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
    );
}
