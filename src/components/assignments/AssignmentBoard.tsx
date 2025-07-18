
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { getUnits, getTeachers, getAssignments, getPrograms } from '@/config/firebase';
import type { Unit, Teacher, Assignment, Program, ProgramModule, UnitPeriod } from '@/types';
import { Save } from 'lucide-react';
import { AssignmentPeriodColumn } from './AssignmentPeriodColumn';

interface AssignmentBoardProps {
  instituteId: string;
  programId: string;
  year: string;
}

export function AssignmentBoard({ instituteId, programId, year }: AssignmentBoardProps) {
  const [units, setUnits] = useState<Unit[]>([]);
  const [program, setProgram] = useState<Program | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [assignments, setAssignments] = useState<{ 'MAR-JUL': Assignment; 'AGO-DIC': Assignment }>({ 'MAR-JUL': {}, 'AGO-DIC': {} });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [allUnits, fetchedTeachers, existingAssignments, allPrograms] = await Promise.all([
        getUnits(instituteId),
        getTeachers(instituteId),
        getAssignments(instituteId, year, programId),
        getPrograms(instituteId)
      ]);
      
      const programUnits = allUnits.filter(unit => unit.programId === programId);
      const currentProgram = allPrograms.find(p => p.id === programId) || null;

      setUnits(programUnits);
      setTeachers(fetchedTeachers);
      setAssignments(existingAssignments);
      setProgram(currentProgram);

    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos para la asignación.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [instituteId, programId, year, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAssignmentChange = (period: UnitPeriod, unitId: string, teacherId: string) => {
    setAssignments(prev => ({
      ...prev,
      [period]: {
        ...prev[period],
        [unitId]: teacherId,
      },
    }));
  };

  const handleSaveAssignments = async () => {
    setIsSaving(true);
    try {
      await saveAssignments(instituteId, year, programId, assignments);
      toast({
        title: "¡Éxito!",
        description: "Las asignaciones se han guardado correctamente.",
      });
    } catch (error) {
      toast({
        title: "Error al Guardar",
        description: "No se pudieron guardar las asignaciones.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const unitsByPeriod = useMemo(() => {
    return {
      'MAR-JUL': units.filter(u => u.period === 'MAR-JUL'),
      'AGO-DIC': units.filter(u => u.period === 'AGO-DIC'),
    }
  }, [units]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>Tablero de Asignaciones del Año {year}</CardTitle>
                <CardDescription>
                    {`Asigne un docente a cada unidad didáctica del programa ${program?.name || '...'} para ambos períodos.`}
                </CardDescription>
            </div>
            <Button onClick={handleSaveAssignments} disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
        </div>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-6 items-start">
          <AssignmentPeriodColumn
            period="MAR-JUL"
            units={unitsByPeriod['MAR-JUL']}
            program={program}
            teachers={teachers}
            assignments={assignments['MAR-JUL']}
            onAssignmentChange={handleAssignmentChange}
          />
          <AssignmentPeriodColumn
            period="AGO-DIC"
            units={unitsByPeriod['AGO-DIC']}
            program={program}
            teachers={teachers}
            assignments={assignments['AGO-DIC']}
            onAssignmentChange={handleAssignmentChange}
          />
      </CardContent>
    </Card>
  );
}
