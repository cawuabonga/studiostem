
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { getUnits, getTeachers, getAssignments, getPrograms, saveSingleAssignment, getAllAssignmentsForYear } from '@/config/firebase';
import type { Unit, Teacher, Assignment, Program, UnitPeriod } from '@/types';
import { AssignmentPeriodColumn } from './AssignmentPeriodColumn';
import { useAuth } from '@/contexts/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AssignmentBoardProps {
  programId: string;
  year: string;
}

interface PendingAssignment {
    period: UnitPeriod;
    unitId: string;
    teacherId: string;
    teacherName: string;
    newTotalHours: number;
    previousTotalHours: number;
}


export function AssignmentBoard({ programId, year }: AssignmentBoardProps) {
  const { instituteId } = useAuth();
  const [units, setUnits] = useState<Unit[]>([]);
  const [allUnits, setAllUnits] = useState<Unit[]>([]);
  const [program, setProgram] = useState<Program | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [assignments, setAssignments] = useState<{ 'MAR-JUL': Assignment; 'AGO-DIC': Assignment }>({ 'MAR-JUL': {}, 'AGO-DIC': {} });
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState<Record<string, boolean>>({});
  const [pendingAssignment, setPendingAssignment] = useState<PendingAssignment | null>(null);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    if (!instituteId) return;
    setLoading(true);
    try {
      const [fetchedUnits, fetchedTeachers, existingAssignments, allPrograms, allAssignmentsForYear] = await Promise.all([
        getUnits(instituteId),
        getTeachers(instituteId),
        getAssignments(instituteId, year, programId),
        getPrograms(instituteId),
        getAllAssignmentsForYear(instituteId, year)
      ]);
      
      const programUnits = fetchedUnits.filter(unit => unit.programId === programId);
      const currentProgram = allPrograms.find(p => p.id === programId) || null;

      setUnits(programUnits);
      setAllUnits(fetchedUnits); // Store all units
      setTeachers(fetchedTeachers);
      // Combine all assignments for the year for accurate workload calculation
      setAssignments({
          'MAR-JUL': { ...existingAssignments['MAR-JUL'], ...allAssignmentsForYear['MAR-JUL'] },
          'AGO-DIC': { ...existingAssignments['AGO-DIC'], ...allAssignmentsForYear['AGO-DIC'] }
      });
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

  const teacherWorkloadMap = useMemo(() => {
    const workload: Map<string, number> = new Map();
    const unitMap = new Map(allUnits.map(u => [u.id, u.totalHours]));

    const processAssignments = (periodAssignments: Assignment) => {
        for (const unitId in periodAssignments) {
            const teacherId = periodAssignments[unitId];
            const unitHours = unitMap.get(unitId) || 0;
            if (teacherId && unitHours > 0) {
                workload.set(teacherId, (workload.get(teacherId) || 0) + unitHours);
            }
        }
    };
    
    processAssignments(assignments['MAR-JUL']);
    processAssignments(assignments['AGO-DIC']);
    
    return workload;
  }, [allUnits, assignments]);


  const handleAssignmentChange = (period: UnitPeriod, unitId: string, teacherId: string) => {
    const unitToAssign = allUnits.find(u => u.id === unitId);
    if (!teacherId || !unitToAssign) { // Handle un-assigning
        saveAssignment(period, unitId, '');
        return;
    }

    const currentHours = teacherWorkloadMap.get(teacherId) || 0;
    const newTotalHours = currentHours + unitToAssign.totalHours;

    if (newTotalHours > 18) {
        const teacher = teachers.find(t => t.documentId === teacherId);
        setPendingAssignment({
            period,
            unitId,
            teacherId,
            teacherName: teacher?.fullName || 'Desconocido',
            newTotalHours,
            previousTotalHours: currentHours
        });
    } else {
        saveAssignment(period, unitId, teacherId);
    }
  };

  const saveAssignment = async (period: UnitPeriod, unitId: string, teacherId: string | null) => {
    // Optimistic UI update
    setAssignments(prev => ({
      ...prev,
      [period]: {
        ...prev[period],
        [unitId]: teacherId || '',
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

  const handleConfirmAssignment = () => {
    if (pendingAssignment) {
        saveAssignment(pendingAssignment.period, pendingAssignment.unitId, pendingAssignment.teacherId);
    }
    setPendingAssignment(null);
  };
  
  const handleCancelAssignment = () => {
    // Important: We need to revert the UI change made by the Select component.
    // The easiest way is a soft-re-fetch of assignments which are already in memory.
    // This forces the component to re-render with the original data.
    setAssignments(current => ({...current}));
    setPendingAssignment(null);
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
    <>
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

        <AlertDialog open={!!pendingAssignment} onOpenChange={(isOpen) => !isOpen && setPendingAssignment(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Advertencia de Carga Horaria</AlertDialogTitle>
                <AlertDialogDescription>
                    El docente <span className="font-bold">{pendingAssignment?.teacherName}</span> ya tiene{' '}
                    <span className="font-bold">{pendingAssignment?.previousTotalHours}</span> horas asignadas. Con esta nueva unidad,
                    su carga horaria total será de <span className="font-bold text-destructive">{pendingAssignment?.newTotalHours}</span> horas.
                    <br/><br/>
                    ¿Estás seguro de que deseas continuar con esta asignación?
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={handleCancelAssignment}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmAssignment}>Sí, asignar</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}
