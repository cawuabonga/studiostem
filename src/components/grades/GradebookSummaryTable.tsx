
"use client";

import React from 'react';
import type { StudentProfile, AchievementIndicator, AcademicRecord } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from '@/lib/utils';
import { Calculator, LayoutDashboard } from 'lucide-react';

interface GradebookSummaryTableProps {
    students: StudentProfile[];
    indicators: AchievementIndicator[];
    records: Record<string, AcademicRecord>;
}

const calculateAverage = (grades: (number | null)[]): number | null => {
    const validGrades = grades.filter(g => typeof g === 'number' && !isNaN(g)) as number[];
    if (validGrades.length === 0) return null;
    const sum = validGrades.reduce((acc, grade) => acc + grade, 0);
    return Math.round(sum / validGrades.length);
};

export function GradebookSummaryTable({ students, indicators, records }: GradebookSummaryTableProps) {
    return (
        <div className="space-y-4 animate-in fade-in duration-500">
             <div className="flex items-center gap-3 bg-muted/40 p-4 rounded-lg border border-primary/10">
                <div className="p-2 bg-primary/10 rounded-md">
                    <LayoutDashboard className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h3 className="font-bold text-lg leading-none">Resumen Consolidado de Calificaciones</h3>
                    <p className="text-xs text-muted-foreground mt-1">Visión general de los promedios por indicador y nota final de la unidad.</p>
                </div>
            </div>

            <div className="relative w-full overflow-hidden rounded-xl border shadow-md bg-background">
                <div className="overflow-x-auto overflow-y-auto max-h-[70vh] min-w-0">
                    <Table className="border-separate border-spacing-0 table-auto w-full">
                        <TableHeader className="sticky top-0 z-50">
                            <TableRow className="bg-slate-100 hover:bg-slate-100">
                                <TableHead className="w-[40px] sticky left-0 top-0 bg-slate-100 z-[60] text-center font-bold text-[10px] uppercase border-r border-b">N°</TableHead>
                                <TableHead className="w-[280px] sticky left-[40px] top-0 bg-slate-100 z-[60] font-bold text-[10px] uppercase border-r border-b shadow-[2px_0_5px_rgba(0,0,0,0.1)]">Apellidos y Nombres</TableHead>
                                {indicators.map(indicator => (
                                    <TableHead key={indicator.id} className="text-center p-2 min-w-[150px] border-r border-b bg-slate-50">
                                        <div className="flex flex-col items-center">
                                            <span className="text-[9px] uppercase text-muted-foreground font-black tracking-tight">Indicador</span>
                                            <span className="text-[10px] font-bold leading-tight line-clamp-1 max-w-[130px] text-primary">{indicator.name}</span>
                                        </div>
                                    </TableHead>
                                ))}
                                <TableHead className="text-center w-[120px] sticky right-0 top-0 bg-primary/10 text-primary z-[60] font-black text-[10px] uppercase border-l border-b shadow-[-2px_0_5px_rgba(0,0,0,0.1)]">PROMEDIO FINAL</TableHead>
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
                                    <TableRow key={student.documentId} className="h-10 hover:bg-slate-50 transition-colors">
                                        <TableCell className="text-center sticky left-0 bg-white z-10 font-mono text-[10px] text-muted-foreground border-r border-b">
                                            {index + 1}
                                        </TableCell>
                                        <TableCell className="sticky left-[40px] bg-white z-10 border-r border-b py-1 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                                            <div className="flex flex-col leading-none">
                                                <span className="text-[11px] font-bold uppercase whitespace-nowrap text-slate-700">
                                                    {student.lastName}, {student.firstName}
                                                </span>
                                                <span className="text-[9px] font-mono text-muted-foreground mt-0.5">{student.documentId}</span>
                                            </div>
                                        </TableCell>
                                        {indicatorAverages.map((avg, i) => (
                                            <TableCell key={indicators[i].id} className={cn(
                                                "text-center font-bold text-[11px] border-r border-b",
                                                avg !== null && avg < 13 ? 'text-destructive' : 'text-slate-600'
                                            )}>
                                                {avg !== null ? avg : '--'}
                                            </TableCell>
                                        ))}
                                        <TableCell className={cn(
                                            "sticky right-0 bg-primary/5 z-10 text-center font-black text-sm border-l border-b shadow-[-2px_0_5px_rgba(0,0,0,0.05)]",
                                            finalAverage !== null && finalAverage < 13 ? "text-red-600" : "text-primary"
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
            
            <div className="flex justify-between items-center px-2 text-[10px] text-muted-foreground font-medium bg-slate-50 p-2 rounded-lg border border-dashed">
                <div className="flex gap-4">
                    <p>Nota aprobatoria: 13</p>
                    <p className="italic">El promedio final es el redondeo del promedio de los indicadores.</p>
                </div>
                <div className="flex items-center gap-1 text-primary font-bold">
                    <Calculator className="h-3 w-3" /> Resumen consolidado oficial
                </div>
            </div>
        </div>
    );
}
