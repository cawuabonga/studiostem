
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
        
        // Fetch assignments for ALL programs for the given year
        const allAssignmentsPromises = allPrograms.map(p => getAssignments(instituteId, year, p.id));
        const allAssignmentsResults = await Promise.all(allAssignmentsPromises);

        const unitMap = new Map(allUnits.map(unit => [unit.id, unit]));
        
        const assignedTeachers: { [teacherId: string]: TeacherWithLoad } = {};

        // Initialize every teacher so they appear if they are in the program, even with 0 hours
        allTeachers.forEach(teacher => {
            assignedTeachers[teacher.id] = {
                teacher,
                units: [],
            };
        });
        
        // Process assignments from all programs
        allAssignmentsResults.forEach(programAssignments => {
            const processPeriod = (periodAssignments: Assignment) => {
                 for (const unitId in periodAssignments) {
                    const teacherId = periodAssignments[unitId];
                    const unit = unitMap.get(unitId);

                    if (teacherId && unit && assignedTeachers[teacherId]) {
                        // Check for duplicates before pushing
                        if (!assignedTeachers[teacherId].units.some(u => u.id === unit.id)) {
                           assignedTeachers[teacherId].units.push(unit);
                        }
                    }
                }
            };
            processPeriod(programAssignments['MAR-JUL']);
            processPeriod(programAssignments['AGO-DIC']);
        });
        
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
                Listado de docentes y coordinadores con su carga horaria total en el instituto para el año seleccionado.
            </CardDescription>
        </CardHeader>
      <div className="p-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {teachersWithLoad.map(({ teacher, units }) => (
          <TeacherLoadCard key={teacher.id} teacher={teacher} units={units} />
        ))}
         {teachersWithLoad.length === 0 && (
            <div className="col-span-full text-center text-muted-foreground py-10">
                No se encontraron docentes con carga horaria asignada para este año.
            </div>
        )}
      </div>
    </Card>
  );
}
