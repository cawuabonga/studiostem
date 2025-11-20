"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { getPrograms, getUnits, getAssignments, getStaffProfiles } from '@/config/firebase';
import type { Program, Unit, UnitPeriod, Assignment, StaffProfile } from '@/types';
import { Input } from '@/components/ui/input';
import { Skeleton } from '../ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { onSnapshot, collection } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { UnassignedUnitsList } from './UnassignedUnitsList';
import { AssignedUnitsList } from './AssignedUnitsList';

export function AcademicLoadDashboard() {
  const { user, hasPermission, instituteId } = useAuth();
  const { toast } = useToast();
  
  const isFullAdmin = hasPermission('academic:program:manage');
  const isCoordinator = hasPermission('academic:load:view') && !isFullAdmin;

  const [programs, setPrograms] = useState<Program[]>([]);
  const [allUnits, setAllUnits] = useState<Unit[]>([]);
  const [allAssignments, setAllAssignments] = useState<Record<string, Assignment>>({});
  const [allStaff, setAllStaff] = useState<StaffProfile[]>([]);
  
  const [selectedProgramId, setSelectedProgramId] = useState(() => isCoordinator ? user?.programId || '' : '');
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedPeriod, setSelectedPeriod] = useState<UnitPeriod>('MAR-JUL');
  
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!instituteId) return;
    setLoading(true);
    try {
      const [fetchedPrograms, fetchedUnits, fetchedStaff] = await Promise.all([
        getPrograms(instituteId),
        getUnits(instituteId),
        getStaffProfiles(instituteId),
      ]);

      if (isCoordinator && user?.programId) {
        setPrograms(fetchedPrograms.filter(p => p.id === user.programId));
      } else {
        setPrograms(fetchedPrograms);
      }
      setAllUnits(fetchedUnits);
      setAllStaff(fetchedStaff);

    } catch (error) {
      toast({ title: "Error", description: "No se pudieron cargar los datos iniciales.", variant: "destructive" });
    } finally {
        setLoading(false);
    }
  }, [instituteId, isCoordinator, user?.programId, toast]);

  useEffect(() => {
    fetchData();

    if (!instituteId) return;

    const assignmentsCol = collection(db, 'institutes', instituteId, 'assignments');
    const unsubscribe = onSnapshot(assignmentsCol, (snapshot) => {
        const assignmentsData: Record<string, Assignment> = {};
        snapshot.forEach(doc => {
            assignmentsData[doc.id] = doc.data() as Assignment;
        });
        
        const flattenedAssignments: Assignment = {};
        Object.values(assignmentsData).forEach(programAssignment => {
            const periodAssignments = (programAssignment as any)[selectedPeriod];
            if(periodAssignments) {
                Object.assign(flattenedAssignments, periodAssignments);
            }
        });
        setAllAssignments({ [selectedPeriod]: flattenedAssignments });
    });

    return () => unsubscribe();

  }, [fetchData, instituteId, selectedPeriod]);

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
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString());
  const coordinatorProgramName = isCoordinator ? programs.find(p => p.id === user?.programId)?.name : '';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dashboard de Carga Académica</CardTitle>
          <CardDescription>
            Visualiza en tiempo real el estado de las asignaciones de unidades didácticas a los docentes.
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
      
      {loading ? (
        <div className="grid md:grid-cols-2 gap-6 items-start">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
      ) : selectedProgramId ? (
        <div className="grid md:grid-cols-2 gap-6 items-start">
            <UnassignedUnitsList units={unassignedUnits} />
            <AssignedUnitsList units={assignedUnits} assignments={allAssignments[selectedPeriod] || {}} staffMap={staffMap} />
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-8">Por favor, selecciona un programa para ver la carga académica.</p>
      )}

    </div>
  );
}
