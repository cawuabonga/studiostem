
"use client";

import React from 'react';
import Image from 'next/image';
import type { Institute, Program, Unit, Teacher, Syllabus, WeekData, AchievementIndicator } from '@/types';
import { format } from 'date-fns';

interface SyllabusPrintLayoutProps {
    institute: Institute | null;
    program: Program | null;
    unit: Unit;
    teacher: Teacher | null;
    syllabus: Syllabus | null;
    weeklyData: WeekData[];
    indicators: AchievementIndicator[];
}

export function SyllabusPrintLayout({ institute, program, unit, teacher, syllabus, weeklyData, indicators }: SyllabusPrintLayoutProps) {
    const today = new Date();
    const currentYear = today.getFullYear();

    const renderHtml = (text?: string) => {
        if (!text) return null;
        return text.split('\n').map((item, index) => (
            <React.Fragment key={index}>
                {item}
                <br />
            </React.Fragment>
        ));
    };

    return (
        <div className="printable-area space-y-2 text-xs">
            {/* Página 1: Carátula */}
            <div className="page-break flex flex-col items-center justify-center text-center h-[90vh]">
                <div className="flex items-center gap-6 mb-8">
                     {institute?.logoUrl && (
                        <Image src={institute.logoUrl} alt={`${institute.name} Logo`} width={120} height={120} className="object-contain" />
                    )}
                     <Image src="https://istjaq.edu.pe/wp-content/uploads/2024/05/logo-minedu-2024.png" alt="Ministerio de Educación" width={220} height={80} className="object-contain" data-ai-hint="education ministry" />
                </div>
                <h1 className="text-2xl font-bold mb-4">{institute?.name}</h1>
                <h2 className="text-xl font-semibold mb-12">"{program?.name}"</h2>
                
                <div className="border-2 border-black p-4 rounded-lg">
                    <h3 className="text-3xl font-bold tracking-wider">SÍLABO</h3>
                </div>

                <div className="mt-auto w-full text-left p-4">
                    <p><strong>UNIDAD DIDÁCTICA:</strong> {unit.name.toUpperCase()}</p>
                    <p><strong>DOCENTE:</strong> {teacher?.fullName || 'No Asignado'}</p>
                    <p><strong>PERIODO ACADÉMICO:</strong> {currentYear}</p>
                </div>
            </div>

            {/* Página 2: Información General */}
             <div className="page-break space-y-4">
                 <h2 className="text-center font-bold text-base underline">SÍLABO DE LA UNIDAD DIDÁCTICA "{unit.name.toUpperCase()}"</h2>
                 
                 <h3 className="font-bold">I. INFORMACIÓN GENERAL</h3>
                 <table className="print-info-table w-full">
                     <tbody>
                        <tr><td className="label w-[30%]">Programa de Estudios</td><td>{program?.name}</td></tr>
                        <tr><td className="label">Módulo Profesional</td><td>{program?.modules.find(m => m.code === unit.moduleId)?.name}</td></tr>
                        <tr><td className="label">Unidad Didáctica</td><td>{unit.name}</td></tr>
                        <tr><td className="label">Créditos</td><td>{unit.credits}</td></tr>
                        <tr><td className="label">Semestre</td><td>{unit.semester}</td></tr>
                        <tr><td className="label">Horas Semanales</td><td>{unit.totalHours / unit.totalWeeks}</td></tr>
                        <tr><td className="label">Horas Semestrales</td><td>{unit.totalHours}</td></tr>
                        <tr><td className="label">Docente</td><td>{teacher?.fullName || 'No Asignado'}</td></tr>
                        <tr><td className="label">Email Institucional</td><td>{teacher?.email || 'No Asignado'}</td></tr>
                     </tbody>
                 </table>

                 <h3 className="font-bold">II. SUMILLA</h3>
                 <p className="text-justify text-xs pl-4">{renderHtml(syllabus?.summary)}</p>

                 <h3 className="font-bold">III. COMPETENCIA DE LA UNIDAD DIDÁCTICA</h3>
                 <p className="text-justify text-xs pl-4">{renderHtml(syllabus?.competence)}</p>
             </div>

             {/* Página 3 & 4: Organización de Actividades */}
            <div className="page-break space-y-4">
                <h3 className="font-bold">IV. ORGANIZACIÓN DE ACTIVIDADES Y CONTENIDOS BÁSICOS</h3>
                <table className="print-info-table w-full">
                    <thead>
                        <tr>
                            <th className="w-[5%]">Semana / Fecha</th>
                            <th className="w-[25%]">Elementos de Capacidad</th>
                            <th className="w-[30%]">Actividades de Aprendizaje</th>
                            <th className="w-[30%]">Contenidos Básicos</th>
                            <th className="w-[10%]">Tareas Previas</th>
                        </tr>
                    </thead>
                    <tbody>
                        {weeklyData.map(week => (
                            <tr key={week.weekNumber}>
                                <td className="text-center">{week.weekNumber}</td>
                                <td>{renderHtml(week.capacityElement)}</td>
                                <td>{renderHtml(week.learningActivities)}</td>
                                <td>{renderHtml(week.basicContents)}</td>
                                <td>{week.tasks.map(t => t.title).join(', ')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {/* Página 5: Metodología y Evaluación */}
            <div className="page-break space-y-4">
                <h3 className="font-bold">V. METODOLOGÍA</h3>
                <p className="text-justify text-xs pl-4">{renderHtml(syllabus?.methodology)}</p>

                <h3 className="font-bold">VI. EVALUACIÓN</h3>
                <p className="text-justify text-xs pl-4">
                   La evaluación será permanente e integral. Se aplicará la evaluación de entrada (diagnóstica), de proceso (formativa) y de salida (sumativa). Se emplearán instrumentos de evaluación como fichas de observación, guías de práctica, listas de cotejo, etc., para evaluar los indicadores de logro. El sistema de calificación es vigesimal (0-20), y la nota mínima aprobatoria es 13.
                </p>
                 <table className="print-info-table w-full">
                    <thead>
                        <tr>
                            <th>Indicadores de Evaluación</th>
                            <th>Técnicas</th>
                            <th>Instrumentos</th>
                        </tr>
                    </thead>
                    <tbody>
                        {indicators.map(indicator => (
                             <tr key={indicator.id}>
                                <td>{indicator.description}</td>
                                <td>Observación, Pruebas</td>
                                <td>Guía de Práctica, Lista de Cotejo</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Página 6: Bibliografía */}
             <div className="page-break space-y-4">
                <h3 className="font-bold">VII. FUENTES DE INFORMACIÓN Y REFERENCIAS BIBLIOGRÁFICAS</h3>
                <div className="pl-4">{renderHtml(syllabus?.bibliography)}</div>

                <div className="text-center pt-20">
                    <div className="inline-block border-t border-black px-12 py-2">
                        <p>{teacher?.fullName || '____________________________'}</p>
                        <p>Docente</p>
                    </div>
                </div>
            </div>

        </div>
    );
}
