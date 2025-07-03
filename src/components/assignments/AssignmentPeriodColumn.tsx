
"use client";

import type { DidacticUnit, Teacher, UnitAssignment } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { useMemo, useState } from "react";
import { Search, Trash2 } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import { TeacherAssignmentSelect } from "./TeacherAssignmentSelect";

interface AssignmentPeriodColumnProps {
  period: 'MAR-JUL' | 'AGOS-DIC';
  availableUnits: DidacticUnit[];
  allTeachers: Teacher[];
  assignments: UnitAssignment[];
  onAssign: (period: 'MAR-JUL' | 'AGOS-DIC', unitId: string, teacherId: string) => void;
  onUnassign: (assignmentId: string) => void;
}

export function AssignmentPeriodColumn({ period, availableUnits, allTeachers, assignments, onAssign, onUnassign }: AssignmentPeriodColumnProps) {
  const [filter, setFilter] = useState('');

  const filteredAvailableUnits = useMemo(() => {
    return availableUnits.filter(u => u.name.toLowerCase().includes(filter.toLowerCase()));
  }, [availableUnits, filter]);

  const sortedAssignments = useMemo(() => {
    return [...assignments].sort((a, b) => a.teacherName.localeCompare(b.teacherName));
  }, [assignments]);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Período: {period}</CardTitle>
        <CardDescription>Asigne docentes a las unidades disponibles.</CardDescription>
        <div className="relative pt-2">
            <Search className="absolute left-2.5 top-4.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar unidad disponible..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-8"
            />
          </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 max-h-[65vh] overflow-y-auto pr-2">
        {/* Available Units */}
        <div className="flex-1">
          <h4 className="text-sm font-semibold mb-2">Unidades Disponibles ({filteredAvailableUnits.length})</h4>
          <ScrollArea className="h-48 pr-4 border rounded-md">
            <div className="p-2 space-y-2">
                {filteredAvailableUnits.length > 0 ? (
                    filteredAvailableUnits.map(unit => (
                    <div key={unit.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-sm">
                        <span>{unit.name}</span>
                        <TeacherAssignmentSelect 
                            teachers={allTeachers} 
                            onAssign={(teacherId) => onAssign(period, unit.id, teacherId)} 
                        />
                    </div>
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No hay unidades disponibles para este período {filter ? 'con el filtro actual' : ''}.</p>
                )}
            </div>
          </ScrollArea>
        </div>
        
        <Separator />

        {/* Assigned Units */}
        <div className="flex-1">
           <h4 className="text-sm font-semibold mb-2">Asignaciones ({sortedAssignments.length})</h4>
           <ScrollArea className="h-48 pr-4 border rounded-md">
                <div className="p-2 space-y-2">
                    {sortedAssignments.length > 0 ? (
                        sortedAssignments.map(assignment => (
                        <div key={assignment.id} className="flex items-center justify-between p-2 rounded-md text-sm">
                            <div>
                                <p className="font-medium">{assignment.unitName}</p>
                                <p className="text-xs text-primary">{assignment.teacherName}</p>
                            </div>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive/80" onClick={() => onUnassign(assignment.id)}>
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Desasignar</span>
                            </Button>
                        </div>
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">Aún no hay asignaciones para este período.</p>
                    )}
                </div>
           </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
