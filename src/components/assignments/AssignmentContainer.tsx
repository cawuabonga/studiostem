
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { getUnits, getTeachers, getAssignments, saveAssignments } from '@/config/firebase';
import type { Unit, Teacher, Assignment, UnitPeriod } from '@/types';
import { UnitAssignmentCard } from './UnitAssignmentCard';
import { Save } from 'lucide-react';

interface AssignmentContainerProps {
  instituteId: string;
  programId: string;
  year: string;
}

export function AssignmentContainer({ instituteId, programId, year }: AssignmentContainerProps) {
  const [units, setUnits] = useState<Unit[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [assignments, setAssignments] = useState<{ 'MAR-JUL': Assignment; 'AGO-DIC': Assignment }>({ 'MAR-JUL': {}, 'AGO-DIC': {} });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const allUnits = await getUnits(instituteId);
      const programUnits = allUnits.filter(unit => unit.programId === programId);
      const fetchedTeachers = await getTeachers(instituteId);
      const existingAssignments = await getAssignments(instituteId, year, programId);
      
      setUnits(programUnits);
      setTeachers(fetchedTeachers);
      setAssignments(existingAssignments);
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
    setLoading(true);
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
      setLoading(false);
    }
  };
  
  const getUnitsByPeriod = (period: UnitPeriod) => {
      return units.filter(unit => unit.period === period);
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-6 w-1/4" />
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
                <CardTitle>Asignar Unidades para el Año {year}</CardTitle>
                <CardDescription>
                Asigne un docente a cada unidad didáctica para los dos períodos académicos.
                </CardDescription>
            </div>
            <Button onClick={handleSaveAssignments} disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                Guardar Cambios
            </Button>
        </div>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-primary">Período: MAR-JUL</h3>
          {getUnitsByPeriod('MAR-JUL').map(unit => (
            <UnitAssignmentCard
              key={unit.id}
              unit={unit}
              teachers={teachers}
              selectedTeacherId={assignments['MAR-JUL'][unit.id] || ''}
              onAssignmentChange={(teacherId) => handleAssignmentChange('MAR-JUL', unit.id, teacherId)}
            />
          ))}
           {getUnitsByPeriod('MAR-JUL').length === 0 && (
              <p className="text-muted-foreground text-sm">No hay unidades para este período.</p>
           )}
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-primary">Período: AGO-DIC</h3>
          {getUnitsByPeriod('AGO-DIC').map(unit => (
            <UnitAssignmentCard
              key={unit.id}
              unit={unit}
              teachers={teachers}
              selectedTeacherId={assignments['AGO-DIC'][unit.id] || ''}
              onAssignmentChange={(teacherId) => handleAssignmentChange('AGO-DIC', unit.id, teacherId)}
            />
          ))}
          {getUnitsByPeriod('AGO-DIC').length === 0 && (
              <p className="text-muted-foreground text-sm">No hay unidades para este período.</p>
           )}
        </div>
      </CardContent>
    </Card>
  );
}
