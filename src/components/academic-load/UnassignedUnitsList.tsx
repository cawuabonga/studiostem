"use client";

import React, { useMemo } from 'react';
import type { Unit } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Badge } from '../ui/badge';

interface UnassignedUnitsListProps {
    units: Unit[];
}

export function UnassignedUnitsList({ units }: UnassignedUnitsListProps) {
    const unitsBySemester = useMemo(() => {
        return units.reduce((acc, unit) => {
            const semester = unit.semester || 0;
            if (!acc[semester]) {
                acc[semester] = [];
            }
            acc[semester].push(unit);
            return acc;
        }, {} as Record<number, Unit[]>);
    }, [units]);

    const sortedSemesters = Object.keys(unitsBySemester).map(Number).sort((a, b) => a - b);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <AlertCircle className="h-6 w-6 text-destructive" />
                    <CardTitle>Unidades No Asignadas ({units.length})</CardTitle>
                </div>
                <CardDescription>
                    Estas unidades necesitan que se les asigne un docente.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[60vh] overflow-y-auto">
                {units.length > 0 ? sortedSemesters.map(semester => (
                    <div key={semester}>
                        <h3 className="font-semibold text-md mb-2 border-b pb-1">Semestre {semester}</h3>
                        <div className="space-y-2">
                            {unitsBySemester[semester].map(unit => (
                                <div key={unit.id} className="p-3 border rounded-md bg-muted/50 flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-sm">{unit.name}</p>
                                        <p className="text-xs text-muted-foreground">{unit.code}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline">{unit.turno}</Badge>
                                        <Badge variant={unit.unitType === 'Especifica' ? 'default' : 'secondary'}>{unit.unitType}</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )) : (
                     <p className="text-sm text-center text-muted-foreground py-10">
                        ¡Felicidades! Todas las unidades de este período y programa están asignadas.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
