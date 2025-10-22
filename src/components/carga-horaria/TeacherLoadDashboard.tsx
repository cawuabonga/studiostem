
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { getUnits, getStaffProfiles, getAssignments, getPrograms, getRoles, getAllNonTeachingAssignmentsForYear } from '@/config/firebase';
import type { Unit, Teacher, Assignment, UnitPeriod, StaffProfile, Program, Role, NonTeachingAssignment } from '@/types';
import { TeacherLoadCard } from './TeacherLoadCard';
import { useAuth } from '@/contexts/AuthContext';

interface TeacherLoadDashboardProps {
  programId: string;
  year: string;
}

interface TeacherWithLoad {
    teacher: Teacher;
    units: Unit[];
    nonTeachingAssignments: NonTeachingAssignment[];
}

export function TeacherLoadDashboard({ programId, year }: TeacherLoadDashboardProps) {
  const { instituteId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [teachersWithLoad, setTeachersWithLoad] = useState<TeacherWithLoad[]>([]);
  const [programMap, setProgramMap] = useState<Map<string, Program>>(new Map());
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    if (!instituteId) return;
    setLoading(true);
    try {
      const [
        allUnits,
        allStaffProfiles,
        allPrograms,
        allRoles,
        allNonTeachingAssignments
      ] = await Promise.all([
        getUnits(instituteId),
        getStaffProfiles(instituteId),
        getPrograms(instituteId),
        getRoles(instituteId),
        getAllNonTeachingAssignmentsForYear(instituteId, year)
      ]);

      const currentProgramMap = new Map(allPrograms.map(p => [p.id, p]));
      setProgramMap(currentProgramMap);

      const targetRoleIds = allRoles
        .filter(role => role.name.toLowerCase() === 'docente' || role.name.toLowerCase() === 'coordinador')
        .map(role => role.id);
      const legacyRoles = ['Teacher', 'Coordinator'];

      const staffInSelectedProgram = allStaffProfiles.filter(staff =>
        staff.programId === programId &&
        (targetRoleIds.includes(staff.roleId) || legacyRoles.includes(staff.role))
      );

      const allAssignmentsPromises = allPrograms.map(p => getAssignments(instituteId, year, p.id));
      const allAssignmentsResults = await Promise.all(allAssignmentsPromises);
      const unitMap = new Map(allUnits.map(unit => [unit.id, unit]));

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

      const nonTeachingAssignmentsByTeacher: { [teacherId: string]: NonTeachingAssignment[] } = {};
      allNonTeachingAssignments.forEach(assignment => {
          if (!nonTeachingAssignmentsByTeacher[assignment.teacherId]) {
              nonTeachingAssignmentsByTeacher[assignment.teacherId] = [];
          }
          nonTeachingAssignmentsByTeacher[assignment.teacherId].push(assignment);
      });

      const finalTeacherLoadList: TeacherWithLoad[] = staffInSelectedProgram.map(staff => {
        const teacher: Teacher = {
          id: staff.documentId,
          documentId: staff.documentId,
          fullName: staff.displayName,
          email: staff.email,
          phone: staff.phone || '',
          active: true,
          specialty: '',
          programName: currentProgramMap.get(staff.programId)?.name || 'N/A',
          condition: staff.condition,
        };
        return {
          teacher: teacher,
          units: allStaffTotalLoad[staff.documentId] || [],
          nonTeachingAssignments: nonTeachingAssignmentsByTeacher[staff.documentId] || [],
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
  }, [instituteId, programId, year, toast]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </CardContent>
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
      <CardContent className="space-y-6">
        {teachersWithLoad.length > 0 ? (
            teachersWithLoad.map(({ teacher, units, nonTeachingAssignments }) => (
                <TeacherLoadCard 
                    key={teacher.documentId} 
                    teacher={teacher} 
                    units={units}
                    nonTeachingAssignments={nonTeachingAssignments}
                    programMap={programMap}
                />
            ))
        ) : (
             <div className="col-span-full text-center text-muted-foreground py-10">
                No se encontraron docentes o coordinadores registrados en este programa de estudios.
            </div>
        )}
      </CardContent>
    </Card>
  );
}
