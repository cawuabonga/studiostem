
"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { EnrolledUnit, AcademicRecord } from "@/types";
import { Percent, Check, X, ArrowRight } from "lucide-react";
import { cn } from '@/lib/utils';

interface StudentUnitGradesCardProps {
    unit: EnrolledUnit;
    record: AcademicRecord | null;
    onSelect: () => void;
}

const calculateFinalGrade = (record: AcademicRecord | null): number | null => {
    if (!record || !record.grades) return null;
    
    const indicatorAverages = Object.values(record.grades).map(indicatorGrades => {
        const validGrades = indicatorGrades.map(g => g.grade).filter(g => typeof g === 'number') as number[];
        if (validGrades.length === 0) return null;
        const sum = validGrades.reduce((acc, grade) => acc + grade, 0);
        return Math.round(sum / validGrades.length);
    }).filter(avg => avg !== null) as number[];

    if (indicatorAverages.length === 0) return null;

    const totalSum = indicatorAverages.reduce((acc, avg) => acc + avg, 0);
    return Math.round(totalSum / indicatorAverages.length);
};


export function StudentUnitGradesCard({ unit, record, onSelect }: StudentUnitGradesCardProps) {
    const finalGrade = useMemo(() => calculateFinalGrade(record), [record]);
    
    const getStatus = (): { text: string; icon: React.ElementType; color: string } => {
        if (record?.status && record.status !== 'cursando') {
            switch(record.status) {
                case 'aprobado': return { text: "Aprobado", icon: Check, color: 'text-green-500' };
                case 'desaprobado': return { text: "Desaprobado", icon: X, color: 'text-destructive' };
                default: return { text: record.status, icon: Percent, color: 'text-muted-foreground' };
            }
        }
        if (finalGrade === null) {
            return { text: "En Curso", icon: Percent, color: 'text-muted-foreground' };
        }
        return finalGrade >= 11
            ? { text: "Aprobado (Parcial)", icon: Check, color: 'text-green-500' }
            : { text: "Desaprobado (Parcial)", icon: X, color: 'text-destructive' };
    }

    const { text, icon: StatusIcon, color } = getStatus();

    return (
        <Card className="flex flex-col h-full hover:border-primary transition-colors">
            <CardHeader>
                <Badge variant="secondary" className="w-fit mb-2">{unit.programName}</Badge>
                <CardTitle className="text-xl">{unit.name}</CardTitle>
                <CardDescription>{unit.period}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col items-center justify-center text-center">
                <div className="text-6xl font-bold text-primary">
                    {finalGrade ?? '--'}
                </div>
                <div className={cn("flex items-center gap-2 font-semibold mt-2", color)}>
                    <StatusIcon className="h-5 w-5" />
                    <span>{text}</span>
                </div>
            </CardContent>
            <CardFooter>
                 <Button className="w-full" onClick={onSelect}>
                    Ver Detalle de Calificaciones
                    <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
            </CardFooter>
        </Card>
    );
}
