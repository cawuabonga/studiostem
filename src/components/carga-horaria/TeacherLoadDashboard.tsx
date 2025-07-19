
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { getUnits, getTeachers, getAssignments } from '@/config/firebase';
import type { Unit, Teacher, Assignment, UnitPeriod } from '@/types';
import { TeacherLoadCard } from './TeacherLoadCard';

interface TeacherLoadDashboardProps {
  instituteId: string;
  programId: string;
  year: string;
}

interface TeacherWithLoad {
    teacher: Teacher;
    units: Unit[];
}

export function TeacherLoadDashboard({ instituteId, programId, year }: TeacherLoadDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [teachersWithLoad, setTeachersWithLoad] = useState<TeacherWithLoad[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [allUnits, allTeachers, assignments] = await Promise.all([
          getUnits(instituteId),
          getTeachers(instituteId),
          getAssignments(instituteId, year, programId),
        ]);

        const programUnits = allUnits.filter(unit => unit.programId === programId);
        const unitMap = new Map(programUnits.map(unit => [unit.id, unit]));
        
        const assignedTeachers: { [teacherId: string]: TeacherWithLoad } = {};

        allTeachers.forEach(teacher => {
            assignedTeachers[teacher.id] = {
                teacher,
                units: [],
            };
        });
        
        const processAssignments = (periodAssignments: Assignment) => {
            for (const unitId in periodAssignments) {
                const teacherId = periodAssignments[unitId];
                const unit = unitMap.get(unitId);

                if (teacherId && unit && assignedTeachers[teacherId]) {
                    assignedTeachers[teacherId].units.push(unit);
                }
            }
        };

        processAssignments(assignments['MAR-JUL']);
        processAssignments(assignments['AGO-DIC']);
        
        const filteredAndSortedTeachers = Object.values(assignedTeachers)
            .filter(t => t.units.length > 0)
            .sort((a, b) => a.teacher.fullName.localeCompare(b.teacher.fullName));

        setTeachersWithLoad(filteredAndSortedTeachers);

      } catch (error) {
        console.error("Error fetching teacher load data:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos de carga horaria.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [instituteId, programId, year, toast]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
            <Skeleton className="h-8 w-3/4" />
        </CardHeader>
        <CardDescription className="px-6 pb-4">
             <Skeleton className="h-4 w-1/2" />
        </CardDescription>
        <div className="p-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      </Card>
    );
  }

  return (
    <Card>
        <CardHeader>
            <CardTitle>Resumen de Carga Horaria - {year}</CardTitle>
            <CardDescription>
                Listado de docentes y coordinadores con unidades didácticas asignadas para el programa seleccionado.
            </CardDescription>
        </CardHeader>
      <div className="p-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {teachersWithLoad.map(({ teacher, units }) => (
          <TeacherLoadCard key={teacher.id} teacher={teacher} units={units} />
        ))}
         {teachersWithLoad.length === 0 && (
            <div className="col-span-full text-center text-muted-foreground py-10">
                No se encontraron docentes con carga horaria asignada para este programa y año.
            </div>
        )}
      </div>
    </Card>
  );
}
