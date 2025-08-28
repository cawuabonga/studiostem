
"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getTeachers } from "@/config/firebase";
import type { Teacher, UnitPeriod } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { NonTeachingAssignmentManager } from "@/components/carga-horaria/NonTeachingAssignmentManager";

const periods: UnitPeriod[] = ['MAR-JUL', 'AGO-DIC'];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString());

export default function AsignarHorasNoLectivasPage() {
  const { instituteId, hasPermission } = useAuth();
  const { toast } = useToast();
  
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  const [selectedPeriod, setSelectedPeriod] = useState<UnitPeriod | ''>('');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  
  const canManage = hasPermission('academic:assignment:manage');

  const fetchTeachersData = useCallback(async () => {
    if (!instituteId) return;
    setLoading(true);
    try {
      const fetchedTeachers = await getTeachers(instituteId);
      setTeachers(fetchedTeachers);
    } catch (error) {
      toast({ title: "Error", description: "No se pudieron cargar los docentes.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [instituteId, toast]);
  
  useEffect(() => {
    if (canManage) {
        fetchTeachersData();
    }
  }, [canManage, fetchTeachersData]);

  const handleSelectionChange = () => {
    // This could be used to reset views if needed when a selector changes
  };

  if (!canManage) {
      return <p>No tienes permiso para acceder a este módulo.</p>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Asignar Horas No Lectivas</CardTitle>
          <CardDescription>
            Selecciona un docente, año y período para asignar o gestionar sus actividades y horas no lectivas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="teacher-select">Docente</Label>
                <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                  <SelectTrigger id="teacher-select"><SelectValue placeholder="Seleccione un docente" /></SelectTrigger>
                  <SelectContent>
                    {teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.fullName}</SelectItem>)}
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
        />
      )}
    </div>
  );
}

