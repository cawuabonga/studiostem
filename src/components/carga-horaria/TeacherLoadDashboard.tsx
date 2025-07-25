
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { getUnits, getStaffProfiles, getAssignments, getPrograms } from '@/config/firebase';
import type { Unit, Teacher, Assignment, UnitPeriod, StaffProfile, Program } from '@/types';
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
  const [programMap, setProgramMap] = useState<Map<string, Program>>(new Map());
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [allUnits, allStaffProfiles, allPrograms] = await Promise.all([
          getUnits(instituteId),
          getStaffProfiles(instituteId),
          getPrograms(instituteId),
        ]);
        
        const currentProgramMap = new Map(allPrograms.map(p => [p.id, p]));
        setProgramMap(currentProgramMap);

        // Filter staff (teachers and coordinators) that belong to the selected program.
        const staffInSelectedProgram = allStaffProfiles.filter(
            staff => (staff.role === 'Teacher' || staff.role === 'Coordinator') && staff.programId === programId
        );

        // Then, fetch all assignments for the selected year to calculate their total load.
        const allAssignmentsPromises = allPrograms.map(p => getAssignments(instituteId, year, p.id));
        const allAssignmentsResults = await Promise.all(allAssignmentsPromises);

        const unitMap = new Map(allUnits.map(unit => [unit.id, unit]));
        
        // Calculate load for ALL staff in the institute.
        const allStaffTotalLoad: { [staffId: string]: Unit[] } = {};
        allStaffProfiles.forEach(staff => {
            allStaffTotalLoad[staff.documentId] = [];
        });

        allAssignmentsResults.forEach(programAssignments => {
            const processPeriod = (periodAssignments: Assignment) => {
                 for (const unitId in periodAssignments) {
                    const staffDocumentId = periodAssignments[unitId];
                    const unit = unitMap.get(unitId);

                    if (staffDocumentId && unit && allStaffTotalLoad[staffDocumentId]) {
                        if (!allStaffTotalLoad[staffDocumentId].some(u => u.id === unit.id)) {
                           allStaffTotalLoad[staffDocumentId].push(unit);
                        }
                    }
                }
            };
            processPeriod(programAssignments['MAR-JUL']);
            processPeriod(programAssignments['AGO-DIC']);
        });

        // Now, build the final list based on the staff from the selected program.
        const finalTeacherLoadList: TeacherWithLoad[] = staffInSelectedProgram.map(staff => {
            const teacher: Teacher = {
                id: staff.documentId,
                documentId: staff.documentId,
                fullName: staff.displayName,
                email: staff.email,
                phone: staff.phone || '',
                active: true, // Assuming active, can be refined
                specialty: '', // Placeholder
                programName: currentProgramMap.get(staff.programId)?.name || 'N/A'
            };

            return {
                teacher: teacher,
                units: allStaffTotalLoad[staff.documentId] || [], // Get their total load, which might be empty.
            };
        });

        const sortedTeachers = finalTeacherLoadList.sort((a, b) => a.teacher.fullName.localeCompare(b.teacher.fullName));

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
                Listado del personal del programa seleccionado. La carga horaria mostrada es su total en todo el instituto para el año consultado.
            </CardDescription>
        </CardHeader>
      <div className="p-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {teachersWithLoad.map(({ teacher, units }) => (
          <TeacherLoadCard key={`${teacher.fullName}-${teacher.programName}`} teacher={teacher} units={units} programMap={programMap} />
        ))}
         {teachersWithLoad.length === 0 && (
            <div className="col-span-full text-center text-muted-foreground py-10">
                No se encontraron docentes o coordinadores registrados en este programa de estudios.
            </div>
        )}
      </div>
    </Card>
  );
}
