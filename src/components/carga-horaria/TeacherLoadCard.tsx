
"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Unit, Teacher, UnitPeriod, Program, NonTeachingAssignment } from '@/types';
import { Badge } from '../ui/badge';
import { Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TeacherLoadCardProps {
    teacher: Teacher;
    units: Unit[];
    nonTeachingAssignments: NonTeachingAssignment[];
    programMap: Map<string, Program>;
}

const getPeriodHoursColor = (hours: number): string => {
    if (hours > 40) return 'text-red-600 dark:text-red-500';
    if (hours === 40) return 'text-green-600 dark:text-green-500';
    return 'text-amber-600 dark:text-amber-500';
};

const PeriodColumn = ({ 
    period, 
    units, 
    nonTeaching, 
    programMap 
}: { 
    period: UnitPeriod, 
    units: Unit[], 
    nonTeaching: NonTeachingAssignment[], 
    programMap: Map<string, Program> 
}) => {
    const teachingHours = units.reduce((acc, unit) => acc + ((unit.theoreticalHours || 0) + (unit.practicalHours || 0)), 0);
    const nonTeachingHours = nonTeaching.reduce((acc, a) => acc + a.assignedHours, 0);
    const totalPeriodHours = teachingHours + nonTeachingHours;

    return (
        <div className="flex flex-col space-y-4 rounded-lg bg-background p-4 shadow-lg shadow-primary/10">
            <h3 className="font-bold text-center text-lg">{period}</h3>
            <div className="grid grid-cols-2 gap-4">
                {/* Teaching Load */}
                <div className="space-y-2">
                    <h4 className="font-semibold border-b pb-1">Carga Lectiva ({teachingHours}h)</h4>
                    {units.length > 0 ? (
                         <ul className="space-y-1 text-sm text-muted-foreground">
                            {units.map(unit => (
                                <li key={unit.id} className="flex justify-between items-center gap-1 text-xs">
                                    <span className="flex-1">{unit.name}</span>
                                    <Badge variant="outline">{programMap.get(unit.programId)?.abbreviation}</Badge>
                                    <Badge variant="secondary">{(unit.theoreticalHours || 0) + (unit.practicalHours || 0)}h</Badge>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-xs text-muted-foreground text-center py-2">Sin carga lectiva</p>}
                </div>
                {/* Non-Teaching Load */}
                 <div className="space-y-2">
                    <h4 className="font-semibold border-b pb-1">Carga No Lectiva ({nonTeachingHours}h)</h4>
                    {nonTeaching.length > 0 ? (
                         <ul className="space-y-1 text-sm text-muted-foreground">
                            {nonTeaching.map(a => (
                                <li key={a.id} className="flex justify-between items-center gap-1 text-xs">
                                    <span className="flex-1">{a.activityName}</span>
                                    <Badge variant="secondary">{a.assignedHours}h</Badge>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-xs text-muted-foreground text-center py-2">Sin carga no lectiva</p>}
                </div>
            </div>
             <Separator />
            <div className="flex items-center justify-end font-bold text-sm">
                <span className="mr-2">Total Horas Período:</span>
                 <div className={cn("flex items-center gap-2", getPeriodHoursColor(totalPeriodHours))}>
                    {totalPeriodHours > 40 && <AlertTriangle className="h-4 w-4"/>}
                    <Clock className="h-4 w-4"/>
                    <span>{totalPeriodHours}h</span>
                </div>
            </div>
        </div>
    )
}

export function TeacherLoadCard({ teacher, units, nonTeachingAssignments, programMap }: TeacherLoadCardProps) {

    const { marJulUnits, agoDicUnits, marJulNonTeaching, agoDicNonTeaching, totalAnnualHours } = useMemo(() => {
        const marJulUnits = units.filter(u => u.period === 'MAR-JUL');
        const agoDicUnits = units.filter(u => u.period === 'AGO-DIC');
        const marJulNonTeaching = nonTeachingAssignments.filter(a => a.period === 'MAR-JUL');
        const agoDicNonTeaching = nonTeachingAssignments.filter(a => a.period === 'AGO-DIC');

        const marJulHours = marJulUnits.reduce((acc, u) => acc + ((u.theoreticalHours || 0) + (u.practicalHours || 0)), 0) + marJulNonTeaching.reduce((acc, a) => acc + a.assignedHours, 0);
        const agoDicHours = agoDicUnits.reduce((acc, u) => acc + ((u.theoreticalHours || 0) + (u.practicalHours || 0)), 0) + agoDicNonTeaching.reduce((acc, a) => acc + a.assignedHours, 0);

        return { marJulUnits, agoDicUnits, marJulNonTeaching, agoDicNonTeaching, totalAnnualHours: marJulHours + agoDicHours };
    }, [units, nonTeachingAssignments]);


    return (
        <Card className="flex flex-col">
            <CardHeader>
                <CardTitle className="text-xl">{teacher.fullName}</CardTitle>
                <CardDescription>
                    {teacher.documentId} | {teacher.condition} | {teacher.programName}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
                 <div className="grid md:grid-cols-2 gap-6">
                    <PeriodColumn period="MAR-JUL" units={marJulUnits} nonTeaching={marJulNonTeaching} programMap={programMap} />
                    <PeriodColumn period="AGO-DIC" units={agoDicUnits} nonTeaching={agoDicNonTeaching} programMap={programMap} />
                 </div>
            </CardContent>
            <Separator />
            <CardFooter className="p-4 bg-muted/50">
                 <div className="flex items-center justify-end w-full font-bold text-base">
                    <span>Carga Horaria Anual Total:</span>
                    <div className={cn("flex items-center gap-2 ml-4")}>
                        <Clock className="h-5 w-5"/>
                        <span>{totalAnnualHours}h</span>
                    </div>
                </div>
            </CardFooter>
        </Card>
    );
}
