
"use client";

import type { DidacticUnit, Teacher, UnitAssignment, Shift } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "../ui/input";
import { UnitAssignmentCard } from "./UnitAssignmentCard";

interface AssignmentPeriodColumnProps {
  period: 'MAR-JUL' | 'AGOS-DIC';
  allUnits: DidacticUnit[];
  allTeachers: Teacher[];
  assignments: UnitAssignment[];
  onAssign: (period: 'MAR-JUL' | 'AGOS-DIC', unitId: string, teacherId: string, shift: Shift) => void;
  onUnassign: (assignmentId: string) => void;
}

export function AssignmentPeriodColumn({ period, allUnits, allTeachers, assignments, onAssign, onUnassign }: AssignmentPeriodColumnProps) {
  const [filter, setFilter] = useState('');

  const filteredUnits = useMemo(() => {
    return allUnits.filter(u => u.name.toLowerCase().includes(filter.toLowerCase()));
  }, [allUnits, filter]);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Período: {period}</CardTitle>
        <CardDescription>Asigne turnos y docentes a cada unidad didáctica.</CardDescription>
        <div className="relative pt-2">
            <Search className="absolute left-2 top-4.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar unidad..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-8"
            />
          </div>
      </CardHeader>
      <CardContent className="space-y-3 max-h-[65vh] overflow-y-auto pr-2">
        {filteredUnits.length > 0 ? (
            filteredUnits.map(unit => (
                <UnitAssignmentCard
                    key={unit.id}
                    unit={unit}
                    teachers={allTeachers}
                    assignmentsForUnit={assignments.filter(a => a.unitId === unit.id)}
                    onAssign={(teacherId, shift) => onAssign(period, unit.id, teacherId, shift)}
                    onUnassign={onUnassign}
                />
            ))
        ) : (
             <p className="text-sm text-muted-foreground text-center py-4">
                No se encontraron unidades para este período {filter && 'con el filtro actual'}.
            </p>
        )}
      </CardContent>
    </Card>
  );
}
