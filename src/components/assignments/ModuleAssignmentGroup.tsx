
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Unit, Teacher, Assignment, ProgramModule, UnitPeriod } from "@/types";
import { UnitAssignmentRow } from "./UnitAssignmentRow";

interface ModuleAssignmentGroupProps {
    module: ProgramModule;
    units: Unit[];
    teachers: Teacher[];
    assignments: Assignment;
    period: UnitPeriod;
    onAssignmentChange: (period: UnitPeriod, unitId: string, teacherId: string) => void;
}

export function ModuleAssignmentGroup({ module, units, teachers, assignments, period, onAssignmentChange }: ModuleAssignmentGroupProps) {
    if (units.length === 0) {
        return null; // Don't render anything if there are no units for this module in this period
    }

    return (
        <Card className="bg-muted/30">
            <CardHeader>
                <CardTitle className="text-xl">{module.name}</CardTitle>
                <CardDescription>{module.code}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                {units.map(unit => (
                    <UnitAssignmentRow
                        key={unit.id}
                        unit={unit}
                        teachers={teachers}
                        period={period}
                        selectedTeacherId={assignments[unit.id] || ''}
                        onAssignmentChange={(teacherId) => onAssignmentChange(period, unit.id, teacherId)}
                    />
                ))}
            </CardContent>
        </Card>
    );
}
