
"use client";

import type { Unit, Teacher, Assignment, UnitPeriod } from "@/types";
import { UnitAssignmentRow } from "./UnitAssignmentRow";

interface AssignmentColumnProps {
    period: UnitPeriod;
    units: Unit[];
    teachers: Teacher[];
    assignments: Assignment;
    onAssignmentChange: (period: UnitPeriod, unitId: string, teacherId: string) => void;
}

export function AssignmentColumn({ period, units, teachers, assignments, onAssignmentChange }: AssignmentColumnProps) {
    return (
        <div className="space-y-3 rounded-lg bg-muted/50 p-4">
            <h3 className="text-lg font-semibold text-primary sticky top-0 bg-muted/50 py-2">{`Período: ${period}`}</h3>
            <div className="space-y-2">
                {units.map(unit => (
                    <UnitAssignmentRow
                        key={unit.id}
                        unit={unit}
                        teachers={teachers}
                        selectedTeacherId={assignments[unit.id] || ''}
                        onAssignmentChange={(teacherId) => onAssignmentChange(period, unit.id, teacherId)}
                    />
                ))}
                {units.length === 0 && (
                    <p className="text-muted-foreground text-sm p-2 text-center">No hay unidades para este período.</p>
                )}
            </div>
        </div>
    );
}
