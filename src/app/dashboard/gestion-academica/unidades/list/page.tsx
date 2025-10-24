
"use client";

import { UnitsList } from "@/components/units/UnitsList";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useMemo, useEffect } from "react";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { UnitPeriod, Program, ProgramModule } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPrograms } from "@/config/firebase";


const periods: UnitPeriod[] = ['MAR-JUL', 'AGO-DIC'];
const semesters = Array.from({ length: 10 }, (_, i) => i + 1);

export default function ListUnitsPage() {
  const { instituteId, loading: authLoading, user, hasPermission } = useAuth();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [modules, setModules] = useState<ProgramModule[]>([]);

  const isFullAdmin = hasPermission('academic:program:manage');
  const isCoordinator = hasPermission('academic:unit:manage:own') && !isFullAdmin;

  const [programFilter, setProgramFilter] = useState(() => isCoordinator ? user?.programId || 'all' : 'all');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [semesterFilter, setSemesterFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState<UnitPeriod | 'all'>('all');
  const [textFilter, setTextFilter] = useState('');
  
  useEffect(() => {
    if (instituteId) {
        getPrograms(instituteId).then(setPrograms);
    }
  }, [instituteId]);

  useEffect(() => {
    if (user?.programId && isCoordinator) {
      setProgramFilter(user.programId);
    }
  }, [user, isCoordinator]);
  
  useEffect(() => {
    const selectedProgram = programs.find(p => p.id === programFilter);
    setModules(selectedProgram?.modules || []);
    setModuleFilter('all'); // Reset module filter when program changes
  }, [programFilter, programs]);

  const handleProgramFilterChange = (value: string) => {
    setProgramFilter(value);
  }
  
  if (authLoading) {
      return (
          <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
      )
  }

  const coordinatorProgram = isCoordinator ? programs.find(p => p.id === user?.programId) : null;
  const showUnits = programFilter !== 'all';

  return (
    <div className="space-y-6">
        <Button variant="ghost" asChild>
            <Link href="/dashboard/gestion-academica/unidades">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al Menú de Unidades
            </Link>
        </Button>
      <Card>
        <CardHeader>
          <CardTitle>Unidades Didácticas Registradas</CardTitle>
          <CardDescription>
            Utilice los filtros para refinar su búsqueda. La tabla se actualizará automáticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end pt-4">
                <div className="space-y-2">
                    <Label htmlFor="program-filter">Programa de Estudios</Label>
                    {isCoordinator && coordinatorProgram ? (
                        <Input value={coordinatorProgram.name} disabled />
                    ) : (
                        <Select value={programFilter} onValueChange={handleProgramFilterChange}>
                            <SelectTrigger id="program-filter">
                                <SelectValue placeholder="Filtrar por programa..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">-- Seleccione un Programa --</SelectItem>
                                {programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="module-filter">Módulo Formativo</Label>
                    <Select value={moduleFilter} onValueChange={setModuleFilter} disabled={!showUnits || modules.length === 0}>
                        <SelectTrigger id="module-filter">
                            <SelectValue placeholder="Filtrar por módulo..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los Módulos</SelectItem>
                            {modules.map(m => <SelectItem key={m.code} value={m.code}>{m.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="semester-filter">Semestre</Label>
                    <Select value={semesterFilter} onValueChange={setSemesterFilter} disabled={!showUnits}>
                        <SelectTrigger id="semester-filter">
                            <SelectValue placeholder="Filtrar por semestre..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los Semestres</SelectItem>
                            {semesters.map(s => <SelectItem key={s} value={String(s)}>Semestre {s}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="period-filter">Período</Label>
                    <Select value={periodFilter} onValueChange={(v) => {setPeriodFilter(v as any);}}>
                        <SelectTrigger id="period-filter">
                            <SelectValue placeholder="Filtrar por período..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los Períodos</SelectItem>
                            {periods.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                
                 <div className="space-y-2">
                    <Label htmlFor="text-filter">Búsqueda por texto</Label>
                    <Input 
                    id="text-filter"
                    placeholder="Buscar por nombre, código..."
                    value={textFilter}
                    onChange={(e) => {setTextFilter(e.target.value);}}
                    />
                </div>
                 
                 {showUnits && instituteId && (
                    <div className="col-span-1 md:col-span-2 lg:col-span-5 pt-4">
                        <UnitsList
                            key={`${programFilter}-${moduleFilter}-${semesterFilter}-${periodFilter}-${textFilter}`}
                            instituteId={instituteId}
                            filters={{ programFilter, moduleFilter, periodFilter, semesterFilter, textFilter }}
                            onDataChange={() => {}}
                        />
                    </div>
                )}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
