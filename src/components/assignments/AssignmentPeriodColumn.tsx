
"use client";

import type { DidacticUnit, Teacher, UnitAssignment } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { useMemo, useState } from "react";
import { Button } from "../ui/button";
import { Trash2, User, BookOpen, Search } from "lucide-react";
import { Input } from "../ui/input";
import { TeacherAssignmentSelect } from "./TeacherAssignmentSelect";

interface AssignmentPeriodColumnProps {
  period: 'MAR-JUL' | 'AGOS-DIC';
  allUnits: DidacticUnit[];
  allTeachers: Teacher[];
  assignments: UnitAssignment[];
  onAssign: (period: 'MAR-JUL' | 'AGOS-DIC', unitId: string, teacherId: string) => void;
  onUnassign: (assignmentId: string) => void;
}

export function AssignmentPeriodColumn({ period, allUnits, allTeachers, assignments, onAssign, onUnassign }: AssignmentPeriodColumnProps) {
  const [filter, setFilter] = useState('');

  const availableUnits = useMemo(() => {
    const assignedUnitIds = new Set(assignments.map(a => a.unitId));
    return allUnits
      .filter(u => !assignedUnitIds.has(u.id))
      .filter(u => u.name.toLowerCase().includes(filter.toLowerCase()));
  }, [allUnits, assignments, filter]);

  const assignmentsByTeacher = useMemo(() => {
    return assignments.reduce((acc, assignment) => {
      if (!acc[assignment.teacherId]) {
        acc[assignment.teacherId] = {
          teacherName: assignment.teacherName,
          assignedUnits: [],
        };
      }
      acc[assignment.teacherId].assignedUnits.push(assignment);
      return acc;
    }, {} as Record<string, { teacherName: string; assignedUnits: UnitAssignment[] }>);
  }, [assignments]);
  
  const handleAssign = (unitId: string, teacherId: string) => {
    if (teacherId) {
      onAssign(period, unitId, teacherId);
    }
  };

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Período: {period}</CardTitle>
        <CardDescription>Asigne unidades a los docentes para este período.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Unidades Disponibles */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center"><BookOpen className="mr-2 h-5 w-5"/> Unidades Disponibles</h3>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar unidad..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {availableUnits.length > 0 ? (
              availableUnits.map(unit => (
                <div key={unit.id} className="flex items-center gap-2 p-2 border rounded-md">
                  <span className="flex-grow text-sm">{unit.name}</span>
                  <TeacherAssignmentSelect 
                    teachers={allTeachers}
                    onAssign={(teacherId) => handleAssign(unit.id, teacherId)}
                  />
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No hay más unidades disponibles.</p>
            )}
          </div>
        </div>
        
        {/* Asignaciones por Docente */}
        <div className="space-y-3">
           <h3 className="text-lg font-semibold flex items-center"><User className="mr-2 h-5 w-5" /> Asignaciones por Docente</h3>
           <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
            {Object.entries(assignmentsByTeacher).length > 0 ? (
              Object.entries(assignmentsByTeacher).map(([teacherId, data]) => (
                <div key={teacherId} className="p-3 border rounded-lg">
                  <p className="font-semibold text-primary mb-2">{data.teacherName}</p>
                  <div className="space-y-2">
                    {data.assignedUnits.map(assignment => (
                      <div key={assignment.id} className="flex items-center justify-between text-sm bg-muted/50 p-2 rounded-md">
                          <span>{assignment.unitName}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => onUnassign(assignment.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Aún no hay asignaciones para este período.</p>
            )}
           </div>
        </div>
      </CardContent>
    </Card>
  );
}
