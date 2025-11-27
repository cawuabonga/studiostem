
"use client";

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Unit, Teacher, Assignment, ProgramModule, UnitPeriod, UnitTurno } from "@/types";
import { UnitAssignmentRow } from "./UnitAssignmentRow";
import { Separator } from '../ui/separator';

interface ModuleAssignmentGroupProps {
    module: ProgramModule;
    units: Unit[];
    teachers: Teacher[];
    assignments: Assignment;
    period: UnitPeriod;
    savingStatus: Record<string, boolean>;
    onAssignmentChange: (period: UnitPeriod, unitId: string, teacherId: string) => void;
}

const turnosOrder: UnitTurno[] = ['Mañana', 'Tarde', 'Noche'];

export function ModuleAssignmentGroup({ module, units, teachers, assignments, period, savingStatus, onAssignmentChange }: ModuleAssignmentGroupProps) {
    
    const unitsByTurno = useMemo(() => {
        const grouped: Record<string, Unit[]> = {};
        units.forEach(unit => {
            const turno = unit.turno || 'Sin turno';
            if (!grouped[turno]) {
                grouped[turno] = [];
            }
            grouped[turno].push(unit);
        });
        return Object.entries(grouped).sort(([turnoA], [turnoB]) => {
            const indexA = turnosOrder.indexOf(turnoA as UnitTurno);
            const indexB = turnosOrder.indexOf(turnoB as UnitTurno);
            return indexA - indexB;
        });
    }, [units]);

    if (units.length === 0) {
        return null;
    }

    return (
        <Card className="bg-muted/30">
            <CardHeader>
                <CardTitle className="text-xl">{module.name}</CardTitle>
                <CardDescription>{module.code}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {unitsByTurno.map(([turno, turnoUnits], index) => (
                    <div key={turno}>
                        {index > 0 && <Separator className="my-4" />}
                        <h4 className="font-semibold text-md text-muted-foreground mb-2">{turno}</h4>
                        <div className="space-y-2">
                             {turnoUnits.map(unit => (
                                <UnitAssignmentRow
                                    key={unit.id}
                                    unit={unit}
                                    teachers={teachers}
                                    period={period}
                                    selectedTeacherId={assignments[unit.id] || ''}
                                    isSaving={savingStatus[unit.id] || false}
                                    onAssignmentChange={(teacherId) => onAssignmentChange(period, unit.id, teacherId)}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
