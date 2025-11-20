
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { getUnits, getTeachers, getAssignments, getPrograms, saveSingleAssignment } from '@/config/firebase';
import type { Unit, Teacher, Assignment, Program, UnitPeriod } from '@/types';
import { AssignmentPeriodColumn } from './AssignmentPeriodColumn';
import { useAuth } from '@/contexts/AuthContext';

interface AssignmentBoardProps {
  programId: string;
  year: string;
}

export function AssignmentBoard({ programId, year }: AssignmentBoardProps) {
  const { instituteId } = useAuth();
  const [units, setUnits] = useState<Unit[]>([]);
  const [program, setProgram] = useState<Program | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [assignments, setAssignments] = useState<{ 'MAR-JUL': Assignment; 'AGO-DIC': Assignment }>({ 'MAR-JUL': {}, 'AGO-DIC': {} });
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    if (!instituteId) return;
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
       console.error("Error fetching assignment data:", error);
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

  const handleAssignmentChange = async (period: UnitPeriod, unitId: string, teacherId: string) => {
    // Optimistic UI update
    setAssignments(prev => ({
      ...prev,
      [period]: {
        ...prev[period],
        [unitId]: teacherId,
      },
    }));

    setSavingStatus(prev => ({ ...prev, [unitId]: true }));
    
    try {
      await saveSingleAssignment(instituteId!, year, programId, period, unitId, teacherId || null);
      // Success, just remove the saving indicator
      setTimeout(() => {
        setSavingStatus(prev => {
            const newStatus = { ...prev };
            delete newStatus[unitId];
            return newStatus;
        });
      }, 1000);

    } catch (error) {
        console.error("Error saving single assignment:", error);
        toast({ title: 'Error al Guardar', description: 'No se pudo guardar la asignación. Revirtiendo cambio.', variant: 'destructive'});
        // Revert UI on error
        fetchData(); 
        setSavingStatus(prev => {
            const newStatus = { ...prev };
            delete newStatus[unitId];
            return newStatus;
        });
    }
  };
  
  const unitsByPeriod = useMemo(() => {
    const grouped: { [key in UnitPeriod]: Unit[] } = {
        'MAR-JUL': [],
        'AGO-DIC': [],
    };

    units.forEach(unit => {
        if (grouped[unit.period]) {
            grouped[unit.period].push(unit);
        }
    });

    return grouped;
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
                    {`Asigne un docente a cada unidad didáctica del programa ${program?.name || '...'}. Los cambios se guardan automáticamente.`}
                </CardDescription>
            </div>
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
            savingStatus={savingStatus}
          />
          <AssignmentPeriodColumn
            period="AGO-DIC"
            units={unitsByPeriod['AGO-DIC']}
            program={program}
            teachers={teachers}
            assignments={assignments['AGO-DIC']}
            onAssignmentChange={handleAssignmentChange}
            savingStatus={savingStatus}
          />
      </CardContent>
    </Card>
  );
}
