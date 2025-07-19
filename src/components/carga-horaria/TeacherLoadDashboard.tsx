
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { getUnits, getTeachers, getAssignments, getPrograms } from '@/config/firebase';
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
        const [allUnits, allTeachers, allPrograms] = await Promise.all([
          getUnits(instituteId),
          getTeachers(instituteId),
          getPrograms(instituteId),
        ]);
        
        const allAssignmentsPromises = allPrograms.map(p => getAssignments(instituteId, year, p.id));
        const allAssignmentsResults = await Promise.all(allAssignmentsPromises);

        const unitMap = new Map(allUnits.map(unit => [unit.id, unit]));
        
        const teacherTotalLoad: { [teacherId: string]: TeacherWithLoad } = {};

        allTeachers.forEach(teacher => {
            teacherTotalLoad[teacher.id] = {
                teacher,
                units: [],
            };
        });
        
        allAssignmentsResults.forEach(programAssignments => {
            const processPeriod = (periodAssignments: Assignment) => {
                 for (const unitId in periodAssignments) {
                    const teacherId = periodAssignments[unitId];
                    const unit = unitMap.get(unitId);

                    if (teacherId && unit && teacherTotalLoad[teacherId]) {
                        if (!teacherTotalLoad[teacherId].units.some(u => u.id === unit.id)) {
                           teacherTotalLoad[teacherId].units.push(unit);
                        }
                    }
                }
            };
            processPeriod(programAssignments['MAR-JUL']);
            processPeriod(programAssignments['AGO-DIC']);
        });
        
        const allAssignedTeachers = Object.values(teacherTotalLoad).filter(t => t.units.length > 0);
        
        const teachersInSelectedProgram = allAssignedTeachers.filter(t => 
            t.units.some(unit => unit.programId === programId)
        );

        const sortedTeachers = teachersInSelectedProgram.sort((a, b) => a.teacher.fullName.localeCompare(b.teacher.fullName));

        setTeachersWithLoad(sortedTeachers);

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
                Listado de docentes y coordinadores con asignaciones en este programa. La carga horaria mostrada es su total en todo el instituto.
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
