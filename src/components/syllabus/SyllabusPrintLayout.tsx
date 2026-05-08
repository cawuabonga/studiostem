
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
    <div className="inst-header">
        <div className="flex items-center gap-4">
            {institute?.logoUrl && (
                <img src={institute.logoUrl} alt="Logo" className="w-[50px] h-[50px] object-contain" />
            )}
            <div>
                <p className="font-bold text-[9pt] leading-tight">{institute?.name.toUpperCase()}</p>
                <p className="text-[6.5pt] tracking-widest text-gray-500 uppercase">Sistema Tecnológico de Educación Modular</p>
            </div>
        </div>
        <div className="text-right text-[6.5pt]">
            <p className="font-bold">SÍLABO ACADÉMICO</p>
            <p className="uppercase">{format(new Date(), 'MMMM yyyy', { locale: es })}</p>
        </div>
    </div>
);

const PageFooter = ({ unitName }: { unitName: string }) => (
    <div className="inst-footer">
        <div className="flex justify-between items-center w-full px-4">
            <span>SÍLABO: {unitName.toUpperCase()}</span>
            <span>STEM PLATFORM</span>
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
        <div className="printable-area">
            {/* --- PÁGINA 1: PORTADA INSTITUCIONAL --- */}
            <div className="cover-page page-break flex flex-col justify-between py-12">
                <div className="space-y-12 flex flex-col items-center w-full">
                    {/* 1. Nombre del Instituto */}
                    <div className="text-center space-y-4">
                        <h1 className="text-[22pt] font-black tracking-tight leading-tight max-w-3xl">
                            {institute?.name.toUpperCase()}
                        </h1>
                        <div className="h-1.5 w-48 bg-black mx-auto"></div>
                    </div>

                    {/* 2. Programa de Estudios */}
                    <div className="text-center space-y-2">
                        <p className="text-[10pt] font-bold text-gray-500 uppercase tracking-[0.3em]">Programa de Estudios</p>
                        <h2 className="text-[16pt] font-black uppercase px-12 leading-snug">
                            {program?.name.toUpperCase()}
                        </h2>
                    </div>
                    
                    {/* 3. Título del Sílabo */}
                    <div className="border-y-4 border-black py-6 w-full text-center my-4">
                        <h2 className="text-[20pt] font-black tracking-widest">
                            SÍLABO DE {unit.name.toUpperCase()}
                        </h2>
                    </div>

                    {/* 4. Logo Grande */}
                    <div className="py-8">
                        {designOptions.showLogo && institute?.logoUrl && (
                            <img 
                                src={institute.logoUrl} 
                                alt="Logo Institucional" 
                                className="w-[280px] h-[280px] object-contain" 
                            />
                        )}
                    </div>
                </div>

                {/* 5. Datos de Pie de Portada */}
                <div className="w-full max-w-2xl mx-auto px-12 grid grid-cols-2 gap-8 pt-10 border-t border-gray-200">
                    <div className="space-y-1">
                        <p className="text-[9pt] font-black text-gray-400 uppercase tracking-widest">Docente Responsable</p>
                        <p className="text-[11pt] font-bold uppercase">{teacher?.fullName || 'Personal Asignado'}</p>
                    </div>
                    <div className="space-y-1 text-right">
                        <p className="text-[9pt] font-black text-gray-400 uppercase tracking-widest">Año Académico</p>
                        <p className="text-[11pt] font-bold">{currentYear}</p>
                    </div>
                </div>
            </div>

            {/* --- PÁGINA 2: INFORMACIÓN GENERAL Y CONTENIDO --- */}
            <div className="p-2">
                <PageHeader institute={institute} />
                <PageFooter unitName={unit.name} />

                <div className="space-y-8">
                    <section>
                        <h3 className="text-[11pt] font-black border-b-2 border-black pb-1 mb-4 flex items-center gap-2">
                            <span className="bg-black text-white px-2 py-0.5 text-[9pt]">I</span>
                            INFORMACIÓN GENERAL
                        </h3>
                        <table className="w-full border-collapse border border-black shadow-sm">
                            <tbody className="text-[8.5pt]">
                                <tr>
                                    <th className="w-[30%] text-left bg-gray-100 p-2 border border-black uppercase font-bold">Programa de Estudios</th>
                                    <td className="p-2 border border-black font-semibold uppercase">{program?.name}</td>
                                </tr>
                                <tr>
                                    <th className="text-left bg-gray-100 p-2 border border-black uppercase font-bold">Módulo Profesional</th>
                                    <td className="p-2 border border-black uppercase">{currentModule?.name} ({currentModule?.code})</td>
                                </tr>
                                <tr>
                                    <th className="text-left bg-gray-100 p-2 border border-black uppercase font-bold">Unidad Didáctica</th>
                                    <td className="p-2 border border-black font-black uppercase text-[10pt]">{unit.name}</td>
                                </tr>
                                <tr>
                                    <th className="text-left bg-gray-100 p-2 border border-black uppercase font-bold">Ciclo / Semestre</th>
                                    <td className="p-2 border border-black">{unit.semester}° Semestre</td>
                                </tr>
                                <tr>
                                    <th className="text-left bg-gray-100 p-2 border border-black uppercase font-bold">Créditos</th>
                                    <td className="p-2 border border-black">
                                        Total: <span className="font-bold">{unit.credits}</span> | 
                                        Teoría: {unit.theoreticalHours > 0 ? (unit.credits / 2).toFixed(1) : 0} | 
                                        Práctica: {unit.practicalHours > 0 ? (unit.credits / 2).toFixed(1) : 0}
                                    </td>
                                </tr>
                                <tr>
                                    <th className="text-left bg-gray-100 p-2 border border-black uppercase font-bold">Horas Semanales / Totales</th>
                                    <td className="p-2 border border-black">
                                        {(unit.totalHours / (unit.totalWeeks || 16)).toFixed(0)} horas sem. (T: {unit.theoreticalHours}h / P: {unit.practicalHours}h) | 
                                        Total: <span className="font-bold">{unit.totalHours} horas</span>
                                    </td>
                                </tr>
                                <tr>
                                    <th className="text-left bg-gray-100 p-2 border border-black uppercase font-bold">Turno / Periodo</th>
                                    <td className="p-2 border border-black font-bold uppercase">{unit.turno} | {unit.period} {currentYear}</td>
                                </tr>
                                <tr>
                                    <th className="text-left bg-gray-100 p-2 border border-black uppercase font-bold">Vigencia (Cronograma)</th>
                                    <td className="p-2 border border-black italic">
                                        Desde: {academicDates?.start ? format(academicDates.start, 'dd/MM/yyyy') : '---'} hasta {academicDates?.end ? format(academicDates.end, 'dd/MM/yyyy') : '---'}
                                    </td>
                                </tr>
                                <tr>
                                    <th className="text-left bg-gray-100 p-2 border border-black uppercase font-bold">Docente Responsable</th>
                                    <td className="p-2 border border-black font-bold uppercase">{teacher?.fullName} ({teacher?.email})</td>
                                </tr>
                            </tbody>
                        </table>
                    </section>

                    <section>
                        <h3 className="text-[11pt] font-black border-b-2 border-black pb-1 mb-3 flex items-center gap-2">
                            <span className="bg-black text-white px-2 py-0.5 text-[9pt]">II</span>
                            SUMILLA
                        </h3>
                        <div className="text-justify pl-4 text-[9pt] leading-relaxed border-l-2 border-gray-200">
                            {renderHtml(syllabus?.summary)}
                        </div>
                    </section>

                    <section>
                        <h3 className="text-[11pt] font-black border-b-2 border-black pb-1 mb-3 flex items-center gap-2">
                            <span className="bg-black text-white px-2 py-0.5 text-[9pt]">III</span>
                            COMPETENCIA DE LA UNIDAD DIDÁCTICA
                        </h3>
                        <div className="text-justify pl-4 text-[9pt] leading-relaxed border-l-2 border-gray-200">
                            {renderHtml(syllabus?.competence)}
                        </div>
                    </section>

                    <section className="page-break-before pt-8">
                        <PageHeader institute={institute} />
                        <h3 className="text-[11pt] font-black border-b-2 border-black pb-1 mb-4 flex items-center gap-2">
                            <span className="bg-black text-white px-2 py-0.5 text-[9pt]">IV</span>
                            ORGANIZACIÓN DE ACTIVIDADES Y CONTENIDOS
                        </h3>
                        <table className="w-full border-collapse border border-black text-[7.5pt]">
                            <thead>
                                <tr className="bg-gray-100 font-bold uppercase">
                                    <th className="border border-black p-1 w-[5%]">SEM.</th>
                                    <th className="border border-black p-1 w-[30%]">ELEMENTOS DE CAPACIDAD</th>
                                    <th className="border border-black p-1 w-[30%]">ACTIVIDADES DE APRENDIZAJE</th>
                                    <th className="border border-black p-1 w-[25%]">CONTENIDOS BÁSICOS</th>
                                    <th className="border border-black p-1 w-[10%]">TAREAS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {weeklyData.map(week => (
                                    <tr key={week.weekNumber}>
                                        <td className="border border-black text-center font-bold bg-gray-50">{week.weekNumber}</td>
                                        <td className="border border-black p-1.5 align-top">{renderHtml(week.capacityElement)}</td>
                                        <td className="border border-black p-1.5 align-top">{renderHtml(week.learningActivities)}</td>
                                        <td className="border border-black p-1.5 align-top font-medium italic">{renderHtml(week.basicContents)}</td>
                                        <td className="border border-black p-1 text-center align-top">{(week.tasks || []).length} ent.</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>

                    <section className="page-break-before pt-8">
                         <PageHeader institute={institute} />
                        <h3 className="text-[11pt] font-black border-b-2 border-black pb-1 mb-4 flex items-center gap-2">
                            <span className="bg-black text-white px-2 py-0.5 text-[9pt]">V</span>
                            METODOLOGÍA Y EVALUACIÓN
                        </h3>
                        <div className="space-y-6 text-[9pt]">
                            <div>
                                <h4 className="font-black mb-2 uppercase text-gray-700">5.1 Estrategias Metodológicas:</h4>
                                <div className="pl-4 text-justify leading-relaxed">
                                    {renderHtml(syllabus?.methodology)}
                                </div>
                            </div>
                            <div>
                                <h4 className="font-black mb-3 uppercase text-gray-700">5.2 Evaluación por Indicadores de Logro:</h4>
                                <table className="w-full border-collapse border border-black">
                                    <thead>
                                        <tr className="bg-gray-100 uppercase">
                                            <th className="border border-black p-2 text-left w-[60%]">INDICADOR DE LOGRO</th>
                                            <th className="border border-black p-2 text-center w-[20%]">TÉCNICA</th>
                                            <th className="border border-black p-2 text-center w-[20%]">INSTRUMENTO</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {indicators.map(indicator => (
                                            <tr key={indicator.id}>
                                                <td className="border border-black p-2 italic leading-tight">{indicator.description}</td>
                                                <td className="border border-black p-2 text-center">Observación / Ejercicios</td>
                                                <td className="border border-black p-2 text-center">Rúbrica / Cuestionario</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="mt-4 p-3 bg-gray-50 border-l-4 border-black text-[8pt] italic">
                                    * El sistema de calificación es vigesimal (0 a 20). La nota mínima aprobatoria para las unidades didácticas es de trece (13).
                                </div>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-[11pt] font-black border-b-2 border-black pb-1 mb-3 flex items-center gap-2">
                            <span className="bg-black text-white px-2 py-0.5 text-[9pt]">VI</span>
                            RECURSOS Y BIBLIOGRAFÍA
                        </h3>
                        <div className="pl-4 space-y-4 text-[8.5pt]">
                            <div className="bg-gray-50 p-4 border border-dashed border-black font-mono">
                                {renderHtml(syllabus?.bibliography)}
                            </div>
                        </div>
                    </section>

                    {designOptions.showSignature && (
                        <section className="pt-24 no-print-break">
                            <div className="flex justify-around items-end">
                                <div className="text-center w-64 border-t-2 border-black pt-2">
                                    <p className="font-black text-[9pt] uppercase">{teacher?.fullName || 'Firma del Docente'}</p>
                                    <p className="text-[7pt] font-bold text-gray-500 uppercase tracking-widest">Docente Responsable</p>
                                </div>
                                <div className="text-center w-64 border-t-2 border-black pt-2">
                                    <p className="font-black text-[9pt] uppercase">Secretaría Académica</p>
                                    <p className="text-[7pt] font-bold text-gray-500 uppercase tracking-widest">V° B° Coordinación</p>
                                </div>
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
}
