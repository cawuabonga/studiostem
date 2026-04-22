
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
        <div className="space-y-4 print:space-y-2">
            <div className="relative w-full overflow-hidden rounded-xl border shadow-md bg-background print:shadow-none print:border-none print:overflow-visible">
                <div className="overflow-x-auto overflow-y-auto max-h-[70vh] min-w-0 print:max-h-none print:overflow-visible">
                    <Table className="border-separate border-spacing-0 table-auto w-full print:border-collapse">
                        <TableHeader className="sticky top-0 z-50 print:relative print:z-0">
                            <TableRow className="bg-slate-100 hover:bg-slate-100 print:bg-gray-100">
                                <TableHead className="w-[40px] sticky left-0 top-0 bg-slate-100 z-[60] text-center font-bold text-[10px] uppercase border-r border-b print:relative print:border-black print:w-[30px]">N°</TableHead>
                                <TableHead className="w-full sticky left-[40px] top-0 bg-slate-100 z-[60] font-bold text-[10px] uppercase border-r border-b shadow-[2px_0_5px_rgba(0,0,0,0.1)] print:relative print:border-black print:shadow-none min-w-[200px] print:min-w-[150px]">Apellidos y Nombres</TableHead>
                                {indicators.map(indicator => (
                                    <TableHead key={indicator.id} className="text-center p-2 w-[45px] print:w-[30px] border-r border-b bg-slate-50 print:relative print:border-black print:bg-gray-50 grade-col">
                                        <div className="flex flex-col items-center">
                                            <span className="text-[8px] uppercase text-muted-foreground font-black tracking-tight print:text-black">Ind.</span>
                                            <span className="text-[10px] font-bold leading-tight line-clamp-1 max-w-[40px] text-primary print:text-black">{indicator.name}</span>
                                        </div>
                                    </TableHead>
                                ))}
                                <TableHead className="text-center w-[60px] print:w-[45px] sticky right-0 top-0 bg-primary/10 text-primary z-[60] font-black text-[10px] uppercase border-l border-b shadow-[-2px_0_5px_rgba(0,0,0,0.1)] print:relative print:border-black print:text-black print:shadow-none grade-col">PROM. FINAL</TableHead>
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
                                    <TableRow key={student.documentId} className="h-10 hover:bg-slate-50 transition-colors print:h-8 print:bg-white">
                                        <TableCell className="text-center sticky left-0 bg-white z-10 font-mono text-[10px] text-muted-foreground border-r border-b print:relative print:border-black">
                                            {index + 1}
                                        </TableCell>
                                        <TableCell className="sticky left-[40px] bg-white z-10 border-r border-b py-1 shadow-[2px_0_5px_rgba(0,0,0,0.05)] print:relative print:border-black print:shadow-none">
                                            <div className="flex flex-col leading-none">
                                                <span className="text-[10px] font-bold uppercase whitespace-nowrap text-slate-700 print:text-black print:whitespace-normal print:leading-tight">
                                                    {student.lastName}, {student.firstName}
                                                </span>
                                                <span className="text-[8px] font-mono text-muted-foreground mt-0.5 print:text-gray-600">{student.documentId}</span>
                                            </div>
                                        </TableCell>
                                        {indicatorAverages.map((avg, i) => (
                                            <TableCell key={indicators[i].id} className={cn(
                                                "text-center font-bold text-[10px] border-r border-b print:border-black grade-col w-[45px] print:w-[30px]",
                                                avg !== null && avg < 13 ? 'text-destructive print:text-red-700' : 'text-slate-600 print:text-black'
                                            )}>
                                                {avg !== null ? avg : '--'}
                                            </TableCell>
                                        ))}
                                        <TableCell className={cn(
                                            "sticky right-0 bg-primary/5 z-10 text-center font-black text-xs border-l border-b shadow-[-2px_0_5px_rgba(0,0,0,0.05)] print:relative print:border-black print:bg-transparent print:shadow-none grade-col w-[60px] print:w-[45px]",
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
            
            <div className="flex justify-between items-center px-2 text-[10px] text-muted-foreground font-medium bg-slate-50 p-2 rounded-lg border border-dashed print:bg-white print:text-black print:border-solid">
                <div className="flex gap-4">
                    <p>Nota aprobatoria: 13</p>
                    <p className="italic">El promedio final es el redondeo del promedio de los indicadores.</p>
                </div>
                <div className="flex items-center gap-1 text-primary font-bold print:text-black">
                    <Calculator className="h-3 w-3" /> Resumen consolidado oficial
                </div>
            </div>
        </div>
    );
}
