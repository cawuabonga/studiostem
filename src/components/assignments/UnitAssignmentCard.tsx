
"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Unit, Teacher } from "@/types";

interface UnitAssignmentCardProps {
  unit: Unit;
  teachers: Teacher[];
  selectedTeacherId: string;
  onAssignmentChange: (teacherId: string) => void;
}

export function UnitAssignmentCard({ unit, teachers, selectedTeacherId, onAssignmentChange }: UnitAssignmentCardProps) {
  return (
    <Card className="bg-muted/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{unit.name}</CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
         <div className="space-y-2">
            <Label htmlFor={`teacher-select-${unit.id}`}>Docente Asignado</Label>
            <Select value={selectedTeacherId} onValueChange={onAssignmentChange}>
                <SelectTrigger id={`teacher-select-${unit.id}`}>
                    <SelectValue placeholder="Sin asignar" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="">Sin asignar</SelectItem>
                    {teachers.map(teacher => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                            {teacher.fullName}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
      </CardContent>
    </Card>
  );
}
