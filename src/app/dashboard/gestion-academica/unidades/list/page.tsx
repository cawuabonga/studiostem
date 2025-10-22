"use client";

import { UnitsList } from "@/components/units/UnitsList";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { getPrograms } from "@/config/firebase";
import type { Program, UnitPeriod, ProgramModule } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const periods: UnitPeriod[] = ['MAR-JUL', 'AGO-DIC'];

export default function ListUnitsPage() {
  const { user, instituteId, loading: authLoading, hasPermission } = useAuth();
  const router = useRouter();

  const isCoordinator = hasPermission('academic:unit:manage:own') && !hasPermission('academic:program:manage');

  const [textFilter, setTextFilter] = useState('');
  // For Admin, this is controlled by the Select. For Coordinator, it's set from their profile.
  const [programFilter, setProgramFilter] = useState('all'); 
  const [moduleFilter, setModuleFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState<UnitPeriod | 'all'>('all');
  
  const [programs, setPrograms] = useState<Program[]>([]);
  const [initialDataLoading, setInitialDataLoading] = useState(true);

  const [showUnits, setShowUnits] = useState(false);
  
  useEffect(() => {
    const fetchInitialData = async () => {
      if (authLoading || !instituteId) return;

      try {
        const fetchedPrograms = await getPrograms(instituteId);
        setPrograms(fetchedPrograms);

        // If the user is a coordinator, pre-set their program filter
        if (isCoordinator && user?.programId) {
            setProgramFilter(user.programId);
        }

      } catch (error) {
        console.error("Error fetching programs:", error);
      } finally {
        setInitialDataLoading(false);
      }
    };

    fetchInitialData();
  }, [authLoading, instituteId, isCoordinator, user?.programId]);
  
  const handleShowUnits = () => {
    setShowUnits(true);
  };
  
  useEffect(() => {
      setShowUnits(false);
  }, [textFilter, programFilter, moduleFilter, periodFilter]);

  const availableModules = useMemo(() => {
      if(programFilter === 'all' || !programs.length) return [];
      const program = programs.find(p => p.id === programFilter);
      return program?.modules || [];
  }, [programFilter, programs]);

  // Reset module filter when available modules change
  useEffect(() => {
      setModuleFilter('all');
  }, [availableModules]);


  if (initialDataLoading || authLoading) {
      return (
          <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
      )
  }

  const coordinatorProgramName = isCoordinator ? programs.find(p => p.id === programFilter)?.name : '';


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
            Utilice los filtros para refinar su búsqueda y luego haga clic en "Cargar Unidades" para ver los resultados.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="text-filter">Búsqueda por texto</Label>
                <Input 
                  id="text-filter"
                  placeholder="Buscar por nombre, código..."
                  value={textFilter}
                  onChange={(e) => setTextFilter(e.target.value)}
                />
              </div>

            {isCoordinator ? (
                <div className="space-y-2">
                  <Label>Programa de Estudio</Label>
                  <Input value={coordinatorProgramName || 'Cargando...'} disabled />
                </div>
              ) : (
                <div className="space-y-2">
                   <Label htmlFor="program-filter">Programa de Estudio</Label>
                  <Select value={programFilter} onValueChange={setProgramFilter}>
                      <SelectTrigger id="program-filter">
                          <SelectValue placeholder="Filtrar por programa..." />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="all">Todos los Programas</SelectItem>
                          {programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                  </Select>
                </div>
            )}
              
            <div className="space-y-2">
              <Label htmlFor="module-filter">Módulo</Label>
              <Select value={moduleFilter} onValueChange={setModuleFilter} disabled={availableModules.length === 0}>
                  <SelectTrigger id="module-filter">
                      <SelectValue placeholder="Filtrar por módulo..." />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="all">Todos los Módulos</SelectItem>
                      {availableModules.map(m => <SelectItem key={m.code} value={m.code}>{m.name}</SelectItem>)}
                  </SelectContent>
              </Select>
            </div>
             
            <div className="space-y-2">
              <Label htmlFor="period-filter">Período</Label>
              <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as any)}>
                  <SelectTrigger id="period-filter">
                      <SelectValue placeholder="Filtrar por período..." />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="all">Todos los Períodos</SelectItem>
                      {periods.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
              </Select>
            </div>
            </div>
             <Button onClick={handleShowUnits}>Cargar Unidades</Button>
        </CardContent>
      </Card>
      
      {showUnits && instituteId && (
        <UnitsList
          key={`${programFilter}-${moduleFilter}-${periodFilter}-${textFilter}`}
          instituteId={instituteId}
          filters={{ programFilter, moduleFilter, periodFilter, textFilter }}
          onDataChange={() => setShowUnits(false)} // Force refilter on data change
        />
      )}
    </div>
  );
}
