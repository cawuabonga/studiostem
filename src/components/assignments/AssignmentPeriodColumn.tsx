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
    savingStatus: Record<string, boolean>;
    onAssignmentChange: (period: UnitPeriod, unitId: string, teacherId: string) => void;
}

type UnitsByModule = { [moduleId: string]: Unit[] };
type UnitsBySemester = { [semester: number]: UnitsByModule };

export function AssignmentPeriodColumn({
    period,
    units,
    program,
    teachers,
    assignments,
    savingStatus,
    onAssignmentChange
}: AssignmentPeriodColumnProps) {

  const unitsBySemesterAndModule = useMemo(() => {
    if (!units) return {};
    return units.reduce((acc, unit) => {
        const semester = unit.semester || 0;
        if (!acc[semester]) {
            acc[semester] = {};
        }
        const moduleId = unit.moduleId;
        if (!acc[semester][moduleId]) {
            acc[semester][moduleId] = [];
        }
        acc[semester][moduleId].push(unit);
        return acc;
    }, {} as UnitsBySemester);
  }, [units]);
  
  const sortedSemesters = Object.keys(unitsBySemesterAndModule).map(Number).sort((a,b) => a - b);

  return (
    <div className="space-y-4">
        <Card className="sticky top-16 z-10">
            <CardHeader className="p-4">
                <CardTitle>Período: {period}</CardTitle>
            </CardHeader>
        </Card>
        
        {sortedSemesters.length > 0 ? (
            sortedSemesters.map(semester => (
                <div key={semester} className="space-y-4">
                    <h3 className="font-bold text-xl text-center text-muted-foreground tracking-wider py-2 border-b-2 border-primary/20">
                        SEMESTRE {semester}
                    </h3>
                    {program?.modules.map(module => {
                        const unitsForModule = unitsBySemesterAndModule[semester]?.[module.code];
                        if (!unitsForModule || unitsForModule.length === 0) {
                            return null;
                        }
                        return (
                            <ModuleAssignmentGroup
                                key={`${period}-${semester}-${module.code}`}
                                module={module}
                                units={unitsForModule}
                                teachers={teachers}
                                assignments={assignments}
                                onAssignmentChange={onAssignmentChange}
                                period={period}
                                savingStatus={savingStatus}
                            />
                        )
                    })}
                </div>
            ))
        ) : (
             <div className="text-center text-muted-foreground p-4">
                No hay unidades para este período.
            </div>
        )}

    </div>
  );
}
