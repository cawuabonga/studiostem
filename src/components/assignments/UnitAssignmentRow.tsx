
"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Unit, Teacher } from "@/types";

interface UnitAssignmentRowProps {
  unit: Unit;
  teachers: Teacher[];
  selectedTeacherId: string;
  onAssignmentChange: (teacherId: string) => void;
}

export function UnitAssignmentRow({ unit, teachers, selectedTeacherId, onAssignmentChange }: UnitAssignmentRowProps) {
  
  const handleValueChange = (value: string) => {
    onAssignmentChange(value === 'unassigned' ? '' : value);
  };
  
  return (
    <div className="flex items-center justify-between rounded-md border bg-card p-3 shadow-sm">
      <span className="text-sm font-medium pr-4 flex-1">{unit.name}</span>
      <div className="w-56">
        <Select value={selectedTeacherId || 'unassigned'} onValueChange={handleValueChange}>
            <SelectTrigger id={`teacher-select-${unit.id}`} className="h-8 text-xs">
                <SelectValue placeholder="Sin asignar" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="unassigned">Sin asignar</SelectItem>
                {teachers.map(teacher => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.fullName}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
      </div>
    </div>
  );
}
