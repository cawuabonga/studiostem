
"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Unit, Teacher, UnitPeriod } from '@/types';
import { Badge } from '../ui/badge';
import { Clock } from 'lucide-react';

interface TeacherLoadCardProps {
    teacher: Teacher;
    units: Unit[];
    totalHours: number;
}

export function TeacherLoadCard({ teacher, units, totalHours }: TeacherLoadCardProps) {

    const unitsByPeriod = units.reduce((acc, unit) => {
        const period = unit.period;
        if (!acc[period]) {
            acc[period] = [];
        }
        acc[period].push(unit);
        return acc;
    }, {} as Record<UnitPeriod, Unit[]>);


    return (
        <Card className="flex flex-col">
            <CardHeader>
                <CardTitle className="text-xl">{teacher.fullName}</CardTitle>
                <CardDescription>{teacher.dni}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
                {Object.entries(unitsByPeriod).map(([period, periodUnits]) => (
                    <div key={period}>
                        <h4 className="font-semibold text-sm mb-2">Período: {period}</h4>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                            {periodUnits.map(unit => (
                                <li key={unit.id} className="flex justify-between items-center">
                                    <span>{unit.name}</span>
                                    <Badge variant="secondary">{unit.totalHours} hrs</Badge>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </CardContent>
            <Separator />
            <CardFooter className="p-4 bg-muted/50">
                <div className="flex items-center justify-between w-full font-bold">
                    <span>Total de Horas</span>
                    <div className="flex items-center gap-2">
                         <Clock className="h-4 w-4"/>
                        <span>{totalHours}</span>
                    </div>
                </div>
            </CardFooter>
        </Card>
    );
}
