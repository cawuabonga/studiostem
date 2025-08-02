
"use client";

import React from 'react';
import type { EnrolledUnit, AcademicRecord, AchievementIndicator, GradeEntry } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface UnitWithGrades extends EnrolledUnit {
    record: AcademicRecord | null;
    indicators: AchievementIndicator[];
}

interface StudentGradesDetailViewProps {
    unit: UnitWithGrades;
}

const calculateIndicatorAverage = (grades: GradeEntry[] | undefined): number | null => {
    if (!grades || grades.length === 0) return null;
    const validGrades = grades.map(g => g.grade).filter(g => typeof g === 'number') as number[];
    if (validGrades.length === 0) return null;
    const sum = validGrades.reduce((acc, grade) => acc + grade, 0);
    return Math.round(sum / validGrades.length);
};

export function StudentGradesDetailView({ unit }: StudentGradesDetailViewProps) {
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl">Detalle de Calificaciones: {unit.name}</CardTitle>
                <CardDescription>
                    Aquí puedes ver el desglose de tus notas por cada indicador de logro.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {unit.indicators.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full space-y-4">
                        {unit.indicators.map(indicator => {
                            const indicatorGrades = unit.record?.grades?.[indicator.id];
                            const indicatorAverage = calculateIndicatorAverage(indicatorGrades);
                            return (
                                <AccordionItem key={indicator.id} value={indicator.id} className="border rounded-lg shadow-sm">
                                    <AccordionTrigger className="text-lg font-medium px-6 py-4 hover:no-underline">
                                        <div className="flex justify-between items-center w-full pr-4">
                                            <span className="text-left flex-1">{indicator.name}</span>
                                            <Badge className={cn(
                                                "text-lg",
                                                indicatorAverage === null ? "bg-muted text-muted-foreground" :
                                                indicatorAverage < 11 ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"
                                            )}>
                                                Prom: {indicatorAverage ?? '--'}
                                            </Badge>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-6 pb-6">
                                        <p className="text-sm text-muted-foreground mb-4">{indicator.description}</p>
                                        <div className="rounded-md border">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Evaluación</TableHead>
                                                        <TableHead>Semana</TableHead>
                                                        <TableHead className="text-right">Nota</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {indicatorGrades && indicatorGrades.length > 0 ? (
                                                        indicatorGrades.map(grade => (
                                                            <TableRow key={grade.refId}>
                                                                <TableCell className="font-medium">{grade.label}</TableCell>
                                                                <TableCell>{grade.weekNumber}</TableCell>
                                                                <TableCell className={cn("text-right font-bold", (grade.grade ?? 0) < 11 ? 'text-destructive' : 'text-primary' )}>
                                                                    {grade.grade ?? 'S.N.'}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))
                                                    ) : (
                                                        <TableRow>
                                                            <TableCell colSpan={3} className="text-center text-muted-foreground">
                                                                Aún no hay calificaciones registradas para este indicador.
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            )
                        })}
                    </Accordion>
                ) : (
                    <p className="text-center text-muted-foreground py-10">
                        No se han definido indicadores de logro para esta unidad.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
