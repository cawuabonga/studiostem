
"use client";

import { getDidacticUnits, getTeachers, getUnitAssignments, addUnitAssignment, deleteUnitAssignment } from "@/config/firebase";
import type { DidacticUnit, Teacher, UnitAssignment } from "@/types";
import { useEffect, useMemo, useState, useCallback } from "react";
import { AssignmentPeriodColumn } from "./AssignmentPeriodColumn";
import { Skeleton } from "../ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface AssignmentContainerProps {
  year: number;
  studyProgram: string;
}

export function AssignmentContainer({ year, studyProgram }: AssignmentContainerProps) {
  const [units, setUnits] = useState<DidacticUnit[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [assignments, setAssignments] = useState<UnitAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [fetchedUnits, fetchedTeachers, fetchedAssignments] = await Promise.all([
        getDidacticUnits(),
        getTeachers(),
        getUnitAssignments(year, studyProgram),
      ]);

      setUnits(fetchedUnits.filter(u => u.studyProgram === studyProgram));
      setTeachers(fetchedTeachers.filter(t => t.studyProgram === studyProgram));
      setAssignments(fetchedAssignments);

    } catch (error) {
      console.error("Failed to fetch assignment data:", error);
      toast({ title: 'Error', description: 'No se pudieron cargar los datos para la asignación.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [year, studyProgram, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAssign = async (period: 'MAR-JUL' | 'AGOS-DIC', unitId: string, teacherId: string) => {
    const unit = units.find(u => u.id === unitId);
    const teacher = teachers.find(t => t.id === teacherId);

    if (!unit || !teacher) return;
    
    const newAssignment: Omit<UnitAssignment, 'id'> = {
      year,
      period,
      unitId,
      unitName: unit.name,
      teacherId,
      teacherName: teacher.fullName,
      studyProgram,
    };
    
    try {
      const newId = await addUnitAssignment(newAssignment);
      setAssignments(prev => [...prev, { ...newAssignment, id: newId }]);
      toast({ title: '¡Éxito!', description: `Unidad "${unit.name}" asignada a ${teacher.fullName}.` });
    } catch (error) {
      console.error("Failed to assign unit:", error);
      toast({ title: 'Error', description: 'No se pudo realizar la asignación.', variant: 'destructive' });
    }
  };

  const handleUnassign = async (assignmentId: string) => {
     const assignment = assignments.find(a => a.id === assignmentId);
     if (!assignment) return;

    try {
      await deleteUnitAssignment(assignmentId);
      setAssignments(prev => prev.filter(a => a.id !== assignmentId));
      toast({ title: '¡Éxito!', description: `Asignación de "${assignment.unitName}" eliminada.` });
    } catch (error) {
       console.error("Failed to unassign unit:", error);
       toast({ title: 'Error', description: 'No se pudo eliminar la asignación.', variant: 'destructive' });
    }
  };
  
  const assignmentsByPeriod = useMemo(() => {
    return assignments.reduce((acc, curr) => {
      (acc[curr.period] = acc[curr.period] || []).push(curr);
      return acc;
    }, {} as Record<'MAR-JUL' | 'AGOS-DIC', UnitAssignment[]>);
  }, [assignments]);
  
  const unitsByPeriod = useMemo(() => {
    return {
      'MAR-JUL': units.filter(u => u.period === 'MAR-JUL'),
      'AGOS-DIC': units.filter(u => u.period === 'AGOS-DIC'),
    };
  }, [units]);
  
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (teachers.length === 0 || units.length === 0) {
      return (
          <div className="text-center text-muted-foreground py-12">
              <p>No hay suficientes datos para realizar asignaciones.</p>
              <p className="text-sm">Asegúrese de que haya docentes y unidades didácticas registradas para este programa de estudios.</p>
          </div>
      );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      <AssignmentPeriodColumn
        period="MAR-JUL"
        allUnits={unitsByPeriod['MAR-JUL']}
        allTeachers={teachers}
        assignments={assignmentsByPeriod['MAR-JUL'] || []}
        onAssign={handleAssign}
        onUnassign={handleUnassign}
      />
      <AssignmentPeriodColumn
        period="AGOS-DIC"
        allUnits={unitsByPeriod['AGOS-DIC']}
        allTeachers={teachers}
        assignments={assignmentsByPeriod['AGOS-DIC'] || []}
        onAssign={handleAssign}
        onUnassign={handleUnassign}
      />
    </div>
  );
}
