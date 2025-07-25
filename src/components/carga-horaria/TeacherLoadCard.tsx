
"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Unit, Teacher, UnitPeriod, Program } from '@/types';
import { Badge } from '../ui/badge';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TeacherLoadCardProps {
    teacher: Teacher;
    units: Unit[];
    programMap: Map<string, Program>;
}

const getHoursColor = (hours: number): string => {
    if (hours > 21) return 'text-red-600 dark:text-red-500';
    if (hours >= 18) return 'text-green-600 dark:text-green-500';
    return 'text-muted-foreground';
};

export function TeacherLoadCard({ teacher, units, programMap }: TeacherLoadCardProps) {

    const { unitsByPeriod, hoursByPeriod } = useMemo(() => {
        const unitsByPeriod: Record<UnitPeriod, Unit[]> = { 'MAR-JUL': [], 'AGO-DIC': [] };
        const hoursByPeriod: Record<UnitPeriod, number> = { 'MAR-JUL': 0, 'AGO-DIC': 0 };

        units.forEach(unit => {
            const period = unit.period;
            if (unitsByPeriod[period]) {
                unitsByPeriod[period].push(unit);
                hoursByPeriod[period] += unit.totalHours || 0;
            }
        });

        return { unitsByPeriod, hoursByPeriod };
    }, [units]);


    return (
        <Card className="flex flex-col">
            <CardHeader>
                <CardTitle className="text-xl">{teacher.fullName}</CardTitle>
                <CardDescription>
                    {teacher.documentId} | {teacher.condition} | {teacher.programName}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
                {(Object.keys(unitsByPeriod) as UnitPeriod[]).map(period => (
                    unitsByPeriod[period].length > 0 && (
                        <div key={period}>
                            <h4 className="font-semibold text-sm mb-2">Período: {period}</h4>
                            <ul className="space-y-1 text-sm text-muted-foreground">
                                {unitsByPeriod[period].map(unit => (
                                    <li key={unit.id} className="flex justify-between items-center gap-2">
                                        <span className="flex-1">{unit.name}</span>
                                        <Badge variant="outline">{programMap.get(unit.programId)?.abbreviation}</Badge>
                                        <Badge variant="secondary">{unit.totalHours} hrs</Badge>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )
                ))}
                 {units.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">Sin carga horaria asignada para este año.</p>
                )}
            </CardContent>
            <Separator />
            <CardFooter className="p-4 bg-muted/50 flex-col items-start space-y-2">
                 {(Object.keys(hoursByPeriod) as UnitPeriod[]).map(period => (
                     hoursByPeriod[period] > 0 && (
                        <div key={period} className="flex items-center justify-between w-full font-bold text-sm">
                            <span>Total Horas ({period})</span>
                            <div className={cn("flex items-center gap-2", getHoursColor(hoursByPeriod[period]))}>
                                <Clock className="h-4 w-4"/>
                                <span>{hoursByPeriod[period]}</span>
                            </div>
                        </div>
                     )
                 ))}
                 {units.length === 0 && (
                     <div className="flex items-center justify-between w-full font-bold text-sm text-muted-foreground">
                        <span>Total Horas</span>
                        <span>0</span>
                     </div>
                 )}
            </CardFooter>
        </Card>
    );
}
