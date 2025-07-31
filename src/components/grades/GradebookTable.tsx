
"use client";

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { StudentProfile, AchievementIndicator, AcademicRecord } from '@/types';

interface GradebookTableProps {
    students: StudentProfile[];
    indicators: AchievementIndicator[];
    records: Record<string, AcademicRecord>;
    onGradeChange: (studentId: string, indicatorId: string, grade: number | null) => void;
}

export function GradebookTable({ students, indicators, records, onGradeChange }: GradebookTableProps) {

    if (students.length === 0) {
        return <p className="text-center text-muted-foreground py-8">No hay estudiantes matriculados en esta unidad para el período seleccionado.</p>;
    }

    if (indicators.length === 0) {
        return <p className="text-center text-muted-foreground py-8">No se han definido indicadores de logro para esta unidad. Por favor, añádalos en la pestaña 'Indicadores de Logro'.</p>;
    }
    
    return (
        <div className="rounded-md border overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="sticky left-0 bg-background z-10">Estudiante</TableHead>
                        {indicators.map(indicator => (
                            <TableHead key={indicator.id} className="text-center">{indicator.name}</TableHead>
                        ))}
                        <TableHead className="text-center">Promedio Final</TableHead>
                        <TableHead className="text-center">% Asistencias</TableHead>
                        <TableHead>Estado</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {students.map(student => {
                        const record = records[student.documentId];
                        return (
                             <TableRow key={student.documentId}>
                                <TableCell className="font-medium sticky left-0 bg-background z-10">{student.fullName}</TableCell>
                                {indicators.map(indicator => (
                                    <TableCell key={indicator.id} className="text-center">
                                        <Input 
                                            type="number" 
                                            className="mx-auto max-w-[80px] text-center"
                                            defaultValue={record?.grades?.[indicator.id] ?? ''}
                                            onChange={(e) => onGradeChange(student.documentId, indicator.id, e.target.value === '' ? null : Number(e.target.value))}
                                            min="0"
                                            max="20"
                                        />
                                    </TableCell>
                                ))}
                                 <TableCell className="text-center font-bold">
                                    {record?.finalGrade ?? '-'}
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

