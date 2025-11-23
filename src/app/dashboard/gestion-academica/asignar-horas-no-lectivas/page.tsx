
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getTeachers, getPrograms, getUnits, getAllAssignmentsForYear } from "@/config/firebase";
import type { Teacher, UnitPeriod, Program, Unit, Assignment } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { NonTeachingAssignmentManager } from "@/components/carga-horaria/NonTeachingAssignmentManager";
import { Input } from "@/components/ui/input";

const periods: UnitPeriod[] = ['MAR-JUL', 'AGO-DIC'];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString());

export default function AsignarHorasNoLectivasPage() {
  const { user, instituteId, hasPermission } = useAuth();
  const { toast } = useToast();
  
  const isCoordinator = hasPermission('academic:assignment:manage') && !hasPermission('academic:program:manage');

  const [programs, setPrograms] = useState<Program[]>([]);
  const [allTeachers, setAllTeachers] = useState<Teacher[]>([]);
  const [allUnits, setAllUnits] = useState<Unit[]>([]);
  const [allAssignments, setAllAssignments] = useState<{ 'MAR-JUL': Assignment; 'AGO-DIC': Assignment }>({ 'MAR-JUL': {}, 'AGO-DIC': {} });
  const [loading, setLoading] = useState(true);

  const [selectedProgramId, setSelectedProgramId] = useState(() => isCoordinator ? user?.programId || '' : '');
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  const [selectedPeriod, setSelectedPeriod] = useState<UnitPeriod | ''>('');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  
  const canManage = hasPermission('academic:assignment:manage');

  const fetchData = useCallback(async () => {
    if (!instituteId) return;
    setLoading(true);
    try {
      const [fetchedTeachers, fetchedPrograms, fetchedUnits, fetchedAssignments] = await Promise.all([
        getTeachers(instituteId),
        getPrograms(instituteId),
        getUnits(instituteId),
        getAllAssignmentsForYear(instituteId, selectedYear),
      ]);

      if (isCoordinator && user?.programId) {
        setPrograms(fetchedPrograms.filter(p => p.id === user.programId));
      } else {
        setPrograms(fetchedPrograms);
      }
      
      setAllTeachers(fetchedTeachers);
      setAllUnits(fetchedUnits);
      setAllAssignments(fetchedAssignments);

    } catch (error) {
      toast({ title: "Error", description: "No se pudieron cargar los datos iniciales.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [instituteId, toast, isCoordinator, user?.programId, selectedYear]);
  
  useEffect(() => {
    if (canManage) {
        fetchData();
    } else {
        setLoading(false);
    }
  }, [canManage, fetchData]);

  useEffect(() => {
    if (isCoordinator && user?.programId) {
        setSelectedProgramId(user.programId);
    }
  }, [isCoordinator, user?.programId]);

  const filteredTeachers = useMemo(() => {
    if (!selectedProgramId) return [];
    return allTeachers.filter(teacher => teacher.programId === selectedProgramId);
  }, [selectedProgramId, allTeachers]);

  useEffect(() => {
    // Reset teacher selection when program changes
    setSelectedTeacherId('');
  }, [selectedProgramId]);
  
  const coordinatorProgramName = isCoordinator ? programs.find(p => p.id === user?.programId)?.name : '';


  if (!canManage && !loading) {
      return <p>No tienes permiso para acceder a este módulo.</p>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Asignar Horas No Lectivas</CardTitle>
          <CardDescription>
            Selecciona un programa, docente, año y período para asignar o gestionar sus actividades y horas no lectivas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
               <div className="space-y-2">
                <Label htmlFor="program-select">Programa de Estudios</Label>
                 {isCoordinator ? (
                    <Input value={coordinatorProgramName || 'Cargando...'} disabled />
                ) : (
                    <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
                        <SelectTrigger id="program-select"><SelectValue placeholder="Seleccione un programa" /></SelectTrigger>
                        <SelectContent>
                            {programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="teacher-select">Docente</Label>
                <Select 
                    value={selectedTeacherId} 
                    onValueChange={setSelectedTeacherId} 
                    disabled={!selectedProgramId}
                >
                  <SelectTrigger id="teacher-select"><SelectValue placeholder="Seleccione un docente" /></SelectTrigger>
                  <SelectContent>
                    {filteredTeachers.map(t => <SelectItem key={t.documentId} value={t.documentId}>{t.fullName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="year-select">Año</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger id="year-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="period-select">Período</Label>
                <Select value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as UnitPeriod)}>
                  <SelectTrigger id="period-select"><SelectValue placeholder="Seleccione un período" /></SelectTrigger>
                  <SelectContent>
                    {periods.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {instituteId && selectedTeacherId && selectedYear && selectedPeriod && (
        <NonTeachingAssignmentManager 
            key={`${selectedTeacherId}-${selectedYear}-${selectedPeriod}`}
            instituteId={instituteId}
            teacherId={selectedTeacherId}
            year={selectedYear}
            period={selectedPeriod}
            allUnits={allUnits}
            allAssignments={allAssignments}
        />
      )}
    </div>
  );
}
