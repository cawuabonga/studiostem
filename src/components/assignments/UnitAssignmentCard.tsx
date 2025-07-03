
"use client";

import type { DidacticUnit, Teacher, UnitAssignment, Shift } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Trash2 } from "lucide-react";
import { TeacherAssignmentSelect } from "./TeacherAssignmentSelect";

interface UnitAssignmentCardProps {
  unit: DidacticUnit;
  teachers: Teacher[];
  assignmentsForUnit: UnitAssignment[];
  onAssign: (teacherId: string, shift: Shift) => void;
  onUnassign: (assignmentId: string) => void;
}

const shifts: Shift[] = ['Mañana', 'Tarde', 'Noche'];

export function UnitAssignmentCard({ unit, teachers, assignmentsForUnit, onAssign, onUnassign }: UnitAssignmentCardProps) {
  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-base">{unit.name}</CardTitle>
        <CardDescription>Créditos: {unit.credits} | Horas por turno: {unit.totalHours}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-2">
        {shifts.map(shift => {
          const assignment = assignmentsForUnit.find(a => a.shift === shift);
          return (
            <div key={shift} className="flex items-center justify-between gap-2 p-2 border rounded-md bg-muted/30">
              <span className="font-medium text-sm flex-shrink-0">{shift}</span>
              {assignment ? (
                <div className="flex items-center gap-2 flex-grow justify-end">
                  <span className="text-sm text-primary text-right">{assignment.teacherName}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 text-destructive hover:text-destructive/80" 
                    onClick={() => onUnassign(assignment.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Desasignar</span>
                  </Button>
                </div>
              ) : (
                <TeacherAssignmentSelect
                  teachers={teachers}
                  onAssign={(teacherId) => onAssign(teacherId, shift)}
                />
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
