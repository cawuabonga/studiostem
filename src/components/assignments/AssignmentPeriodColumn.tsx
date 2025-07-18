
"use client"

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Unit, Teacher, Assignment, Program, UnitPeriod, ProgramModule } from '@/types';
import { ModuleAssignmentGroup } from './ModuleAssignmentGroup';

interface AssignmentPeriodColumnProps {
    period: UnitPeriod;
    units: Unit[];
    program: Program | null;
    teachers: Teacher[];
    assignments: Assignment;
    onAssignmentChange: (period: UnitPeriod, unitId: string, teacherId: string) => void;
}

type UnitsByModule = { [moduleId: string]: Unit[] };

export function AssignmentPeriodColumn({
    period,
    units,
    program,
    teachers,
    assignments,
    onAssignmentChange
}: AssignmentPeriodColumnProps) {

  const unitsByModule = useMemo(() => {
    if (!units) return {};
    return units.reduce((acc, unit) => {
      const moduleId = unit.moduleId;
      if (!acc[moduleId]) {
        acc[moduleId] = [];
      }
      acc[moduleId].push(unit);
      return acc;
    }, {} as UnitsByModule);
  }, [units]);

  return (
    <div className="space-y-4">
        <Card className="sticky top-16 z-10">
            <CardHeader className="p-4">
                <CardTitle>Período: {period}</CardTitle>
            </CardHeader>
        </Card>

        {program?.modules.map(module => (
          <ModuleAssignmentGroup
            key={`${period}-${module.code}`}
            module={module}
            units={unitsByModule[module.code] || []}
            teachers={teachers}
            assignments={assignments}
            onAssignmentChange={onAssignmentChange}
            period={period}
          />
        ))}

        {(!units || units.length === 0) && (
            <div className="text-center text-muted-foreground p-4">
                No hay unidades para este período.
            </div>
        )}
    </div>
  );
}
