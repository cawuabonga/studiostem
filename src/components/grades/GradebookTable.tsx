

"use client";

import React, { useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { StudentProfile, AchievementIndicator, AcademicRecord, Task } from '@/types';
import { PlusCircle } from 'lucide-react';

interface GradebookTableProps {
    students: StudentProfile[];
    indicators: AchievementIndicator[];
    tasks: Task[];
    records: Record<string, AcademicRecord>;
    onGradeChange: (studentId: string, indicatorId: string, taskId: string, grade: number | null) => void;
}

const calculateAverage = (grades: number[]): number | null => {
    if (grades.length === 0) return null;
    const sum = grades.reduce((acc, grade) => acc + grade, 0);
    return Math.round(sum / grades.length);
};

export function GradebookTable({ students, indicators, tasks, records, onGradeChange }: GradebookTableProps) {

    const evaluationsByIndicator = useMemo(() => {
        const grouped: Record<string, Task[]> = {};
        
        indicators.forEach(indicator => {
            grouped[indicator.id] = tasks.filter(task => 
                task.weekNumber >= indicator.startWeek && task.weekNumber <= indicator.endWeek
            );
        });

        return grouped;
    }, [indicators, tasks]);

    if (students.length === 0) {
        return <p className="text-center text-muted-foreground py-8">No hay estudiantes matriculados en esta unidad para el período seleccionado.</p>;
    }

    if (indicators.length === 0) {
        return <p className="text-center text-muted-foreground py-8">No se han definido indicadores de logro para esta unidad. Por favor, añádalos en la pestaña 'Indicadores de Logro'.</p>;
    }
    
    return (
        <div className="rounded-md border overflow-x-auto">
            <Table className="min-w-full">
                <TableHeader>
                    <TableRow>
                        <TableHead rowSpan={2} className="sticky left-0 bg-background z-10 min-w-[200px]">Estudiante</TableHead>
                        {indicators.map(indicator => {
                            const evaluations = evaluationsByIndicator[indicator.id] || [];
                            // +2 for the "Add" button and the indicator average
                            const colSpan = evaluations.length + 2; 
                            return (
                                <TableHead key={indicator.id} colSpan={colSpan} className="text-center border-l border-r">
                                    {indicator.name}
                                </TableHead>
                            )
                        })}
                        <TableHead rowSpan={2} className="text-center min-w-[100px]">Promedio Final</TableHead>
                        <TableHead rowSpan={2} className="text-center min-w-[100px]">% Asistencias</TableHead>
                        <TableHead rowSpan={2} className="min-w-[120px]">Estado</TableHead>
                    </TableRow>
                    <TableRow>
                        {indicators.map(indicator => {
                             const evaluations = evaluationsByIndicator[indicator.id] || [];
                             return (
                                <React.Fragment key={`subhead-${indicator.id}`}>
                                    {evaluations.map(task => (
                                        <TableHead key={task.id} className="text-center text-xs font-normal border-l min-w-[120px]">{task.title}</TableHead>
                                    ))}
                                    <TableHead className="text-center border-l min-w-[50px]">
                                         <Button variant="ghost" size="sm" className="w-full h-full p-1">
                                            <PlusCircle className="h-4 w-4" />
                                        </Button>
                                    </TableHead>
                                    <TableHead className="text-center font-semibold border-l bg-muted/50 min-w-[100px]">Prom. Indicador</TableHead>
                                </React.Fragment>
                             )
                        })}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {students.map(student => {
                        const record = records[student.documentId];
                        const indicatorAverages: (number | null)[] = [];

                        return (
                             <TableRow key={student.documentId}>
                                <TableCell className="font-medium sticky left-0 bg-background z-10">{student.fullName}</TableCell>
                                {indicators.map(indicator => {
                                     const evaluations = evaluationsByIndicator[indicator.id] || [];
                                     const gradesForIndicator = record?.grades?.[indicator.id]?.map(g => g.grade).filter(g => g !== null) as number[] || [];
                                     const indicatorAverage = calculateAverage(gradesForIndicator);
                                     if(indicatorAverage !== null) indicatorAverages.push(indicatorAverage);

                                     return (
                                        <React.Fragment key={`${student.documentId}-${indicator.id}`}>
                                            {evaluations.map(task => {
                                                const gradeEntry = record?.grades?.[indicator.id]?.find(g => g.refId === task.id);
                                                return (
                                                    <TableCell key={task.id} className="text-center border-l">
                                                        <Input 
                                                            type="number" 
                                                            className="mx-auto max-w-[80px] text-center"
                                                            value={gradeEntry?.grade ?? ''}
                                                            onChange={(e) => onGradeChange(student.documentId, indicator.id, task.id, e.target.value === '' ? null : Number(e.target.value))}
                                                            min="0"
                                                            max="20"
                                                        />
                                                    </TableCell>
                                                )
                                            })}
                                             <TableCell className="text-center border-l">
                                                {/* Placeholder for manual grade input */}
                                             </TableCell>
                                             <TableCell className="text-center font-bold border-l bg-muted/50">
                                                {indicatorAverage ?? '-'}
                                             </TableCell>
                                        </React.Fragment>
                                     )
                                })}

                                <TableCell className="text-center font-bold">
                                    {calculateAverage(indicatorAverages as number[]) ?? '-'}
                                </TableCell>
                                <TableCell className="text-center">
                                    {record ? `${record.attendancePercentage}%` : '100%'}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={record?.status === 'aprobado' ? 'default' : 'secondary'}>
                                        {record?.status || 'cursando'}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
