"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { getPrograms, getUnits, getAllAssignmentsForYear, getStaffProfiles, getRoles, getAllNonTeachingAssignmentsForYear } from '@/config/firebase';
import type { Program, Unit, UnitPeriod, Assignment, StaffProfile, Teacher, NonTeachingAssignment } from '@/types';
import { Input } from '@/components/ui/input';
import { Skeleton } from '../ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { UnassignedUnitsList } from './UnassignedUnitsList';
import { AssignedUnitsList } from './AssignedUnitsList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AvailableTeachersList } from './AvailableTeachersList';
import { FullTeachersList } from './FullTeachersList';
import { TeacherLoadCard } from '../carga-horaria/TeacherLoadCard';
import { TeacherWorkloadList } from './TeacherWorkloadList';

export function AcademicLoadDashboard() {
  const { user, hasPermission, instituteId } = useAuth();
  const { toast } = useToast();
  
  const isFullAdmin = hasPermission('academic:program:manage');
  const isCoordinator = hasPermission('academic:load:view') && !isFullAdmin;

  const [programs, setPrograms] = useState<Program[]>([]);
  const [allUnits, setAllUnits] = useState<Unit[]>([]);
  const [allAssignments, setAllAssignments] = useState<Record<UnitPeriod, Assignment>>({ 'MAR-JUL': {}, 'AGO-DIC': {} });
  const [allStaff, setAllStaff] = useState<StaffProfile[]>([]);
  const [allRoles, setAllRoles] = useState<any[]>([]);
  const [nonTeachingAssignments, setNonTeachingAssignments] = useState<NonTeachingAssignment[]>([]);
  
  const [selectedProgramId, setSelectedProgramId] = useState(() => isCoordinator ? user?.programId || '' : '');
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedPeriod, setSelectedPeriod] = useState<UnitPeriod>('MAR-JUL');
  
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!instituteId) return;
    setLoading(true);
    try {
      const [fetchedPrograms, fetchedUnits, fetchedStaff, fetchedRoles, fetchedNonTeaching] = await Promise.all([
        getPrograms(instituteId),
        getUnits(instituteId),
        getStaffProfiles(instituteId),
        getRoles(instituteId),
        getAllNonTeachingAssignmentsForYear(instituteId, selectedYear)
      ]);
      
      const assignments = await getAllAssignmentsForYear(instituteId, selectedYear);

      if (isCoordinator && user?.programId) {
        setPrograms(fetchedPrograms.filter(p => p.id === user.programId));
      } else {
        setPrograms(fetchedPrograms);
      }
      setAllUnits(fetchedUnits);
      setAllStaff(fetchedStaff);
      setAllRoles(fetchedRoles);
      setAllAssignments(assignments);
      setNonTeachingAssignments(fetchedNonTeaching);

    } catch (error) {
      toast({ title: "Error", description: "No se pudieron cargar los datos iniciales.", variant: "destructive" });
    } finally {
        setLoading(false);
    }
  }, [instituteId, isCoordinator, user?.programId, toast, selectedYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (isCoordinator && user?.programId) {
        setSelectedProgramId(user.programId);
    }
  }, [isCoordinator, user?.programId]);
  
  const { assignedUnits, unassignedUnits } = useMemo(() => {
    if (!selectedProgramId) return { assignedUnits: [], unassignedUnits: [] };
    const periodAssignments = allAssignments[selectedPeriod] || {};
    const unitsInPeriod = allUnits.filter(u => u.period === selectedPeriod && u.programId === selectedProgramId);
    const assigned: Unit[] = [];
    const unassigned: Unit[] = [];
    unitsInPeriod.forEach(unit => {
        if (periodAssignments[unit.id]) {
            assigned.push(unit);
        } else {
            unassigned.push(unit);
        }
    });
    return { assignedUnits: assigned, unassignedUnits: unassigned };
  }, [selectedProgramId, selectedPeriod, allUnits, allAssignments]);
  
  const staffMap = useMemo(() => new Map(allStaff.map(s => [s.documentId, s.displayName])), [allStaff]);
  
  const teacherWorkloads = useMemo(() => {
    const teacherRoleId = allRoles.find(r => r.name.toLowerCase() === 'docente')?.id;
    const coordinatorRoleId = allRoles.find(r => r.name.toLowerCase() === 'coordinador')?.id;

    const teachersInProgram = allStaff.filter(s => 
        s.programId === selectedProgramId && 
        (s.roleId === teacherRoleId || s.roleId === coordinatorRoleId || s.role === 'Teacher' || s.role === 'Coordinator')
    );

    const unitMap = new Map(allUnits.map(u => [u.id, u]));
    
    const teacherWorkload: Record<string, { teacher: Teacher, teachingHours: number, nonTeachingHours: number }> = {};

    teachersInProgram.forEach(t => {
      teacherWorkload[t.documentId] = {
        teacher: { documentId: t.documentId, fullName: t.displayName } as Teacher,
        teachingHours: 0,
        nonTeachingHours: 0,
      };
    });

    const periodAssignments = allAssignments[selectedPeriod] || {};
    for(const unitId in periodAssignments) {
        const teacherId = periodAssignments[unitId];
        const unit = unitMap.get(unitId);
        if (teacherId && unit && teacherWorkload[teacherId] && unit.period === selectedPeriod) {
            const weeklyHours = unit.totalHours / unit.totalWeeks;
            teacherWorkload[teacherId].teachingHours += weeklyHours;
        }
    }
    
    nonTeachingAssignments
      .filter(nta => nta.period === selectedPeriod)
      .forEach(nta => {
        if(teacherWorkload[nta.teacherId]) {
          teacherWorkload[nta.teacherId].nonTeachingHours += nta.assignedHours;
        }
      });
    
    return Object.values(teacherWorkload).map(load => ({
        ...load,
        teachingHours: Math.round(load.teachingHours),
        nonTeachingHours: Math.round(load.nonTeachingHours),
        totalHours: Math.round(load.teachingHours + load.nonTeachingHours)
    })).sort((a,b) => b.totalHours - a.totalHours);

  }, [selectedProgramId, selectedPeriod, allStaff, allRoles, allAssignments, nonTeachingAssignments, allUnits]);


  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString());
  const coordinatorProgramName = isCoordinator ? programs.find(p => p.id === user?.programId)?.name : '';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dashboard de Carga Académica</CardTitle>
          <CardDescription>
            Visualiza en tiempo real el estado de las asignaciones de unidades y la carga horaria de los docentes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-4">
                 <div className="space-y-2">
                    <Label htmlFor="program-select">Programa de Estudios</Label>
                    {isCoordinator ? (
                        <Input value={coordinatorProgramName || 'Cargando...'} disabled />
                    ) : (
                         <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
                            <SelectTrigger id="program-select">
                                <SelectValue placeholder="Seleccione un programa" />
                            </SelectTrigger>
                            <SelectContent>
                                {programs.map(program => <SelectItem key={program.id} value={program.id}>{program.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    )}
                 </div>
                  <div className="space-y-2">
                    <Label htmlFor="year-select">Año</Label>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger id="year-select">
                            <SelectValue placeholder="Seleccione un año" />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="period-select">Período</Label>
                    <Select value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as UnitPeriod)}>
                        <SelectTrigger id="period-select">
                            <SelectValue placeholder="Seleccione un período" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="MAR-JUL">MAR-JUL</SelectItem>
                            <SelectItem value="AGO-DIC">AGO-DIC</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="units" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="units">Vista por Unidades</TabsTrigger>
            <TabsTrigger value="teachers">Vista por Docentes</TabsTrigger>
        </TabsList>
        <TabsContent value="units">
             {loading ? (
                <div className="grid md:grid-cols-2 gap-6 items-start mt-6">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            ) : selectedProgramId ? (
                <div className="grid md:grid-cols-2 gap-6 items-start mt-6">
                    <UnassignedUnitsList units={unassignedUnits} />
                    <AssignedUnitsList units={assignedUnits} assignments={allAssignments[selectedPeriod] || {}} staffMap={staffMap} />
                </div>
            ) : (
                <p className="text-center text-muted-foreground py-8">Por favor, selecciona un programa para ver la carga académica.</p>
            )}
        </TabsContent>
         <TabsContent value="teachers">
            {loading ? (
                <div className="grid md:grid-cols-2 gap-6 items-start mt-6">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            ) : selectedProgramId ? (
                <TeacherWorkloadList teacherWorkloads={teacherWorkloads} />
            ) : (
                <p className="text-center text-muted-foreground py-8">Por favor, selecciona un programa para ver la carga de docentes.</p>
            )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
