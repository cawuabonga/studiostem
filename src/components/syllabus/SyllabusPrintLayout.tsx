
"use client";

import React from 'react';
import Image from 'next/image';
import type { Institute, Program, Unit, Teacher, Syllabus, WeekData, AchievementIndicator, SyllabusDesignOptions } from '@/types';
import { format } from 'date-fns';

interface SyllabusPrintLayoutProps {
    institute: Institute | null;
    program: Program | null;
    unit: Unit;
    teacher: Teacher | null;
    syllabus: Syllabus | null;
    weeklyData: WeekData[];
    indicators: AchievementIndicator[];
    designOptions?: SyllabusDesignOptions;
}

const defaultOptions: SyllabusDesignOptions = {
    showLogo: true,
    showInfoTable: true,
    showSignature: true,
};

/**
 * Componente que renderiza la cabecera institucional para las páginas internas.
 */
const PageHeader = ({ institute }: { institute: Institute | null }) => (
    <div className="inst-header">
        <div className="flex items-center gap-4">
            {institute?.logoUrl && (
                <img src={institute.logoUrl} alt="Logo" className="w-[60px] h-[60px] object-contain" />
            )}
            <div>
                <p className="font-bold text-[10pt] leading-tight">{institute?.name.toUpperCase()}</p>
                <p className="text-[7pt] tracking-widest text-gray-600">SISTEMA TECNOLÓGICO DE EDUCACIÓN MODULAR (STEM)</p>
            </div>
        </div>
        <div className="text-right text-[7pt]">
            <p className="font-bold">DOCUMENTO OFICIAL</p>
            <p>SÍLABO ACADÉMICO</p>
            <p>{format(new Date(), 'yyyy')}</p>
        </div>
    </div>
);

/**
 * Pie de página institucional.
 */
const PageFooter = ({ unitName }: { unitName: string }) => (
    <div className="inst-footer">
        <div className="flex justify-between items-center w-full px-4">
            <span>SÍLABO: {unitName.toUpperCase()}</span>
            <span>PROPIEDAD INTELECTUAL - USO EXCLUSIVO ACADÉMICO</span>
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
    designOptions = defaultOptions 
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
            {/* --- PÁGINA 1: CARÁTULA --- */}
            <div className="cover-page page-break">
                <div className="space-y-8 flex flex-col items-center">
                    {designOptions.showLogo && institute?.logoUrl && (
                        <img src={institute.logoUrl} alt="Logo Carátula" className="w-[120px] h-[120px] object-contain mb-4" />
                    )}
                    
                    <div className="space-y-2">
                        <h1 className="text-[18pt] font-black tracking-tight">{institute?.name.toUpperCase()}</h1>
                        <div className="h-1 w-32 bg-black mx-auto"></div>
                    </div>

                    <div className="pt-10 space-y-4">
                        <p className="text-[11pt] font-bold text-gray-700 uppercase tracking-widest">Programa de Estudios</p>
                        <h2 className="text-[14pt] font-black uppercase px-12 italic">"{program?.name}"</h2>
                    </div>
                    
                    <div className="border-[3px] border-black p-6 my-12 inline-block">
                        <h2 className="text-[24pt] font-black tracking-[0.5em] ml-[0.5em]">SÍLABO</h2>
                    </div>

                    <div className="w-full text-left max-w-2xl px-12 space-y-3 pt-10">
                        <p className="text-[11pt]"><span className="font-black w-48 inline-block">UNIDAD DIDÁCTICA:</span> {unit.name.toUpperCase()}</p>
                        <p className="text-[11pt]"><span className="font-black w-48 inline-block">MÓDULO:</span> {currentModule?.name.toUpperCase()}</p>
                        <p className="text-[11pt]"><span className="font-black w-48 inline-block">DOCENTE:</span> {teacher?.fullName.toUpperCase() || 'PERSONAL ASIGNADO'}</p>
                        <p className="text-[11pt]"><span className="font-black w-48 inline-block">AÑO ACADÉMICO:</span> {currentYear}</p>
                    </div>
                </div>
            </div>

            {/* --- PÁGINA 2 EN ADELANTE: CONTENIDO --- */}
            <div className="p-2">
                <PageHeader institute={institute} />
                <PageFooter unitName={unit.name} />

                <div className="space-y-6">
                    <section>
                        <h3 className="text-[10pt] font-bold border-b border-black pb-1 mb-3">I. INFORMACIÓN GENERAL</h3>
                        <table className="w-full">
                            <tbody>
                                <tr>
                                    <th className="w-[25%] text-left bg-gray-50 px-3">Programa de Estudios</th>
                                    <td className="px-3">{program?.name}</td>
                                </tr>
                                <tr>
                                    <th className="text-left bg-gray-50 px-3">Módulo Profesional</th>
                                    <td className="px-3">{currentModule?.name}</td>
                                </tr>
                                <tr>
                                    <th className="text-left bg-gray-50 px-3">Unidad Didáctica</th>
                                    <td className="px-3 font-bold">{unit.name}</td>
                                </tr>
                                <tr>
                                    <th className="text-left bg-gray-50 px-3">Semestre / Créditos</th>
                                    <td className="px-3">{unit.semester}° Semestre - {unit.credits} Créditos</td>
                                </tr>
                                <tr>
                                    <th className="text-left bg-gray-50 px-3">Horas Semanales / Totales</th>
                                    <td className="px-3">{(unit.totalHours / (unit.totalWeeks || 16)).toFixed(0)} horas / {unit.totalHours} totales</td>
                                </tr>
                                <tr>
                                    <th className="text-left bg-gray-50 px-3">Docente Responsable</th>
                                    <td className="px-3">{teacher?.fullName} ({teacher?.email})</td>
                                </tr>
                            </tbody>
                        </table>
                    </section>

                    <section>
                        <h3 className="text-[10pt] font-bold border-b border-black pb-1 mb-3">II. SUMILLA</h3>
                        <p className="text-justify pl-2 leading-relaxed">{renderHtml(syllabus?.summary)}</p>
                    </section>

                    <section>
                        <h3 className="text-[10pt] font-bold border-b border-black pb-1 mb-3">III. COMPETENCIA DE LA UNIDAD DIDÁCTICA</h3>
                        <p className="text-justify pl-2 leading-relaxed">{renderHtml(syllabus?.competence)}</p>
                    </section>

                    <section>
                        <h3 className="text-[10pt] font-bold border-b border-black pb-1 mb-3">IV. ORGANIZACIÓN DE ACTIVIDADES Y CONTENIDOS</h3>
                        <table className="w-full border-black border">
                            <thead>
                                <tr>
                                    <th className="w-[6%]">SEM.</th>
                                    <th className="w-[28%]">ELEMENTOS DE CAPACIDAD</th>
                                    <th className="w-[30%]">ACTIVIDADES DE APRENDIZAJE</th>
                                    <th className="w-[28%]">CONTENIDOS BÁSICOS</th>
                                    <th className="w-[8%]">TAREAS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {weeklyData.map(week => (
                                    <tr key={week.weekNumber}>
                                        <td className="text-center font-bold">{week.weekNumber}</td>
                                        <td className="text-[7.5pt]">{renderHtml(week.capacityElement)}</td>
                                        <td className="text-[7.5pt]">{renderHtml(week.learningActivities)}</td>
                                        <td className="text-[7.5pt]">{renderHtml(week.basicContents)}</td>
                                        <td className="text-center text-[7pt]">{(week.tasks || []).length}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>

                    <section className="page-break-before">
                        <h3 className="text-[10pt] font-bold border-b border-black pb-1 mb-3">V. METODOLOGÍA Y EVALUACIÓN</h3>
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-[8.5pt] font-bold mb-1">5.1 Estrategias Metodológicas:</h4>
                                <p className="text-justify pl-2">{renderHtml(syllabus?.methodology)}</p>
                            </div>
                            <div>
                                <h4 className="text-[8.5pt] font-bold mb-2">5.2 Evaluación por Indicadores:</h4>
                                <table className="w-full">
                                    <thead>
                                        <tr>
                                            <th className="text-left w-[60%] px-3">INDICADOR DE LOGRO</th>
                                            <th className="w-[20%]">TÉCNICA</th>
                                            <th className="w-[20%]">INSTRUMENTO</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {indicators.map(indicator => (
                                            <tr key={indicator.id}>
                                                <td className="text-[7.5pt] italic px-3">{indicator.description}</td>
                                                <td className="text-center text-[7.5pt]">Observación</td>
                                                <td className="text-center text-[7.5pt]">Lista de Cotejo</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <p className="text-[7.5pt] italic mt-2">* La nota mínima aprobatoria es de 13 (trece). El sistema de calificación es vigesimal (0-20).</p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-[10pt] font-bold border-b border-black pb-1 mb-3">VI. RECURSOS Y BIBLIOGRAFÍA</h3>
                        <div className="pl-2 space-y-4">
                            <div>
                                <h4 className="text-[8.5pt] font-bold mb-1">Fuentes de Información:</h4>
                                <div className="text-[7.5pt] font-mono bg-gray-50 p-2 border border-dashed">
                                    {renderHtml(syllabus?.bibliography)}
                                </div>
                            </div>
                        </div>
                    </section>

                    {designOptions.showSignature && (
                        <section className="pt-24">
                            <div className="flex justify-around items-end">
                                <div className="text-center w-64 border-t border-black pt-2">
                                    <p className="font-bold text-[9pt] uppercase">{teacher?.fullName || 'Firma del Docente'}</p>
                                    <p className="text-[7.5pt]">Docente Responsable</p>
                                </div>
                                <div className="text-center w-64 border-t border-black pt-2">
                                    <p className="font-bold text-[9pt] uppercase">Secretaría Académica</p>
                                    <p className="text-[7.5pt]">V° B° Coordinación</p>
                                </div>
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
}
