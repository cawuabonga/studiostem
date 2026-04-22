
"use client";

import React from 'react';
import type { StudentProfile, AchievementIndicator, AcademicRecord } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from '@/lib/utils';
import { Calculator } from 'lucide-react';

interface GradebookSummaryTableProps {
    students: StudentProfile[];
    indicators: AchievementIndicator[];
    records: Record<string, AcademicRecord>;
}

const calculateAverage = (grades: (number | null)[]): number | null => {
    const validGrades = grades.filter(g => g !== null && g !== undefined && !isNaN(g)) as number[];
    if (validGrades.length === 0) return null;
    const sum = validGrades.reduce((acc, grade) => acc + grade, 0);
    return Math.round(sum / validGrades.length);
};

export function GradebookSummaryTable({ students, indicators, records }: GradebookSummaryTableProps) {
    return (
        <div className="space-y-4">
            <div className="relative w-full overflow-hidden rounded-xl border shadow-md bg-background print:shadow-none print:border-none">
                <div className="overflow-x-auto overflow-y-auto max-h-[70vh] print:max-h-none print:overflow-visible">
                    <Table className="border-separate border-spacing-0 table-auto w-full print:border-collapse">
                        <TableHeader className="sticky top-0 z-50 print:static">
                            <TableRow className="bg-slate-100 hover:bg-slate-100 print:bg-gray-100">
                                <TableHead className="w-[40px] sticky left-0 top-0 bg-slate-100 z-[60] text-center font-bold text-[10px] uppercase border-r border-b print:static print:border-black print:w-[30px]">N°</TableHead>
                                <TableHead className="w-auto sticky left-[40px] top-0 bg-slate-100 z-[60] font-bold text-[10px] uppercase border-r border-b shadow-[2px_0_5px_rgba(0,0,0,0.1)] print:static print:border-black print:shadow-none whitespace-nowrap">Apellidos y Nombres</TableHead>
                                {indicators.map(indicator => (
                                    <TableHead key={indicator.id} className="text-center p-2 min-w-[70px] border-r border-b bg-slate-50 print:border-black grade-col">
                                        <div className="flex flex-col items-center">
                                            <span className="text-[8px] uppercase text-muted-foreground font-black print:text-black">Ind.</span>
                                            <span className="text-[10px] font-bold text-primary print:text-black">{indicator.name.split(' ')[1] || indicator.name}</span>
                                        </div>
                                    </TableHead>
                                ))}
                                <TableHead className="text-center w-[80px] sticky right-0 top-0 bg-primary/10 text-primary z-[60] font-black text-[10px] uppercase border-l border-b shadow-[-2px_0_5px_rgba(0,0,0,0.1)] print:static print:border-black print:text-black print:shadow-none grade-col">PROM. FINAL</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {students.map((student, index) => {
                                const studentRecord = records[student.documentId];
                                const indicatorAverages = indicators.map(indicator => {
                                    const grades = studentRecord?.grades?.[indicator.id]?.map(g => g.grade) || [];
                                    return calculateAverage(grades);
                                });
                                const finalAverage = calculateAverage(indicatorAverages);

                                return (
                                    <TableRow key={student.documentId} className="h-10 hover:bg-slate-50 transition-colors print:h-auto">
                                        <TableCell className="text-center sticky left-0 bg-white z-10 font-mono text-[10px] text-muted-foreground border-r border-b print:static print:border-black">
                                            {index + 1}
                                        </TableCell>
                                        <TableCell className="sticky left-[40px] bg-white z-10 border-r border-b py-1 shadow-[2px_0_5px_rgba(0,0,0,0.05)] print:static print:border-black print:shadow-none whitespace-nowrap">
                                            <div className="flex flex-col leading-none">
                                                <span className="text-[13px] font-bold uppercase text-slate-700 print:text-black print:text-[9pt]">
                                                    {student.lastName}, {student.firstName}
                                                </span>
                                                <span className="text-[9px] font-mono text-muted-foreground mt-0.5 print:text-[6pt]">{student.documentId}</span>
                                            </div>
                                        </TableCell>
                                        {indicatorAverages.map((avg, i) => (
                                            <TableCell key={indicators[i].id} className={cn(
                                                "text-center font-bold text-[11px] border-r border-b grade-col print:border-black",
                                                avg !== null && avg < 13 ? 'text-destructive print:text-red-700' : 'text-slate-600 print:text-black'
                                            )}>
                                                {avg !== null ? avg : '--'}
                                            </TableCell>
                                        ))}
                                        <TableCell className={cn(
                                            "sticky right-0 bg-white z-10 text-center font-black text-xs border-l border-b shadow-[-2px_0_5px_rgba(0,0,0,0.05)] print:static print:border-black print:shadow-none grade-col",
                                            finalAverage !== null && finalAverage < 13 ? "text-red-600" : "text-primary print:text-black"
                                        )}>
                                            {finalAverage !== null ? finalAverage : '--'}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </div>
            <div className="screen-only flex justify-between items-center px-4 text-[11px] text-muted-foreground font-medium bg-slate-50 p-3 rounded-lg border border-dashed">
                <div className="flex gap-4">
                    <p>Nota aprobatoria: <span className="font-bold text-foreground">13</span></p>
                    <p className="italic">El promedio se calcula automáticamente sobre los promedios de cada indicador.</p>
                </div>
                <div className="flex items-center gap-1 text-primary font-bold">
                    <Calculator className="h-4 w-4" /> RESUMEN OFICIAL
                </div>
            </div>
        </div>
    );
}
