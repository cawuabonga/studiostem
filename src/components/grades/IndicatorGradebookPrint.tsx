
"use client";

import React, { useMemo } from 'react';
import type { StudentProfile, AchievementIndicator, AcademicRecord, Task } from '@/types';
import { cn } from '@/lib/utils';

interface IndicatorGradebookPrintProps {
    students: StudentProfile[];
    indicator: AchievementIndicator;
    records: Record<string, AcademicRecord>;
    tasks: (Task & { weekNumber: number })[];
}

const calculateAverage = (grades: (number | null)[]): number | null => {
    const validGrades = grades.filter(g => g !== null && g !== undefined && !isNaN(g)) as number[];
    if (validGrades.length === 0) return null;
    const sum = validGrades.reduce((acc, grade) => acc + grade, 0);
    return Math.round(sum / validGrades.length);
};

export function IndicatorGradebookPrint({ students, indicator, records, tasks }: IndicatorGradebookPrintProps) {
    const flattenedEvaluations = useMemo(() => {
        const firstRecord = Object.values(records)[0];
        const list: { id: string, label: string, type: 'task' | 'manual', weekNumber: number }[] = [];

        tasks.filter(t => t.indicatorId === indicator.id).forEach(t => {
            list.push({ id: t.id, label: t.title, type: 'task', weekNumber: t.weekNumber });
        });

        if (firstRecord && firstRecord.evaluations && firstRecord.evaluations[indicator.id]) {
            firstRecord.evaluations[indicator.id].forEach(e => {
                if (!list.some(x => x.id === e.id)) {
                    list.push({ id: e.id, label: e.label, type: 'manual', weekNumber: e.weekNumber });
                }
            });
        }

        return list.sort((a, b) => a.weekNumber - b.weekNumber);
    }, [records, indicator.id, tasks]);

    return (
        <div className="w-full overflow-visible">
            <table className="w-full border-collapse border border-black text-[8pt]">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border border-black p-1 text-center w-[30px]">N°</th>
                        <th className="border border-black p-1 text-left w-[220px]">APELLIDOS Y NOMBRES</th>
                        {flattenedEvaluations.map(ev => (
                            <th key={ev.id} className="border border-black p-1 text-center grade-col">
                                <div className="flex flex-col leading-tight">
                                    <span className="text-[6pt] uppercase font-normal">Sem {ev.weekNumber}</span>
                                    <span className="font-bold text-[7pt] truncate max-w-[60px]">{ev.label}</span>
                                </div>
                            </th>
                        ))}
                        <th className="border border-black p-1 text-center w-[50px] bg-gray-50">PROM.</th>
                    </tr>
                </thead>
                <tbody>
                    {students.map((student, index) => {
                        const studentRecord = records[student.documentId];
                        const allGrades = studentRecord?.grades?.[indicator.id]?.map(g => g.grade) || [];
                        const avg = calculateAverage(allGrades);

                        return (
                            <tr key={student.documentId}>
                                <td className="border border-black text-center p-1">{index + 1}</td>
                                <td className="border border-black p-1 uppercase font-semibold text-[7pt]">
                                    {student.lastName}, {student.firstName}
                                    <span className="block text-[6pt] font-normal text-gray-500">{student.documentId}</span>
                                </td>
                                {flattenedEvaluations.map(ev => {
                                    const gradeEntry = studentRecord?.grades?.[indicator.id]?.find(g => g.refId === ev.id);
                                    const grade = gradeEntry?.grade;
                                    return (
                                        <td key={ev.id} className={cn(
                                            "border border-black text-center p-1 font-bold grade-col",
                                            grade !== null && grade !== undefined && grade < 13 && "text-red-600"
                                        )}>
                                            {grade !== null && grade !== undefined ? grade : '--'}
                                        </td>
                                    );
                                })}
                                <td className={cn(
                                    "border border-black text-center p-1 font-black bg-gray-50 text-[9pt] grade-col",
                                    avg !== null && avg < 13 ? "text-red-700" : "text-black"
                                )}>
                                    {avg !== null ? avg : '--'}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            
            <div className="mt-8 flex justify-around no-print-break">
                <div className="border-t border-black px-12 pt-1 text-center">
                    <p className="font-bold uppercase text-[8pt]">Firma del Docente</p>
                </div>
                <div className="border-t border-black px-12 pt-1 text-center">
                    <p className="font-bold uppercase text-[8pt]">Secretaría Académica</p>
                </div>
            </div>
        </div>
    );
}
