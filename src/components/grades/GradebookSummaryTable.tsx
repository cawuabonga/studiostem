
"use client";

import React from 'react';
import type { StudentProfile, AchievementIndicator, AcademicRecord } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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
        <Card>
            <CardHeader className="no-print">
                <CardTitle>Resumen de Calificaciones Finales</CardTitle>
                <CardDescription>
                    Promedio final por cada indicador y promedio general de la unidad didáctica.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[40px] sticky left-0 bg-background z-10">N°</TableHead>
                                <TableHead className="w-[100px] sticky left-[40px] bg-background z-10">DNI</TableHead>
                                <TableHead className="w-[250px] sticky left-[140px] bg-background z-10">Apellidos y Nombres</TableHead>
                                {indicators.map(indicator => (
                                    <TableHead key={indicator.id} className="text-center min-w-[150px]">{indicator.name}</TableHead>
                                ))}
                                <TableHead className="text-center font-bold bg-muted/50 min-w-[150px]">Promedio Final</TableHead>
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
                                    <TableRow key={student.documentId}>
                                        <TableCell className="text-center sticky left-0 bg-background z-10">{index + 1}</TableCell>
                                        <TableCell className="sticky left-[40px] bg-background z-10">{student.documentId}</TableCell>
                                        <TableCell className="font-medium sticky left-[140px] bg-background z-10">{student.fullName}</TableCell>
                                        {indicatorAverages.map((avg, index) => (
                                            <TableCell key={indicators[index].id} className={cn("text-center font-semibold", (avg ?? 0) < 11 ? 'text-destructive' : '')}>
                                                {avg ?? ''}
                                            </TableCell>
                                        ))}
                                        <TableCell className={cn("text-center font-bold text-lg bg-muted/50", (finalAverage ?? 0) < 11 ? 'text-destructive' : 'text-primary')}>
                                            {finalAverage ?? ''}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
