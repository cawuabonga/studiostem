
"use client";

import { UnitsList } from "@/components/units/UnitsList";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useMemo, useEffect } from "react";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { UnitPeriod, Program } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPrograms } from "@/config/firebase";


const periods: UnitPeriod[] = ['MAR-JUL', 'AGO-DIC'];

export default function ListUnitsPage() {
  const { instituteId, loading: authLoading, user, hasPermission } = useAuth();
  const [programs, setPrograms] = useState<Program[]>([]);

  const isFullAdmin = hasPermission('academic:program:manage');
  const isCoordinator = hasPermission('academic:unit:manage:own') && !isFullAdmin;

  const [programFilter, setProgramFilter] = useState(() => isCoordinator ? user?.programId || 'all' : 'all');
  
  const [textFilter, setTextFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState<UnitPeriod | 'all'>('all');
  
  const [showUnits, setShowUnits] = useState(isCoordinator); // Show immediately for coordinators

  useEffect(() => {
    if (instituteId) {
        getPrograms(instituteId).then(setPrograms);
    }
  }, [instituteId]);

  useEffect(() => {
    // If user changes, and they are a coordinator, lock the filter
    if (isCoordinator && user?.programId) {
      setProgramFilter(user.programId);
      setShowUnits(true);
    }
  }, [user, isCoordinator]);


  const handleShowUnits = () => {
    if (programFilter !== 'all') {
      setShowUnits(true);
    } else {
        alert("Por favor, seleccione un programa de estudios para cargar las unidades.")
    }
  };
  
  const handleProgramFilterChange = (value: string) => {
    setProgramFilter(value);
    setShowUnits(false);
  }
  
  if (authLoading) {
      return (
          <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
      )
  }

  const coordinatorProgram = isCoordinator ? programs.find(p => p.id === user?.programId) : null;

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
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end pt-4">
                <div className="space-y-2 lg:col-span-2">
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
                    <Label htmlFor="text-filter">Búsqueda por texto</Label>
                    <Input 
                    id="text-filter"
                    placeholder="Buscar por nombre, código..."
                    value={textFilter}
                    onChange={(e) => {setTextFilter(e.target.value); setShowUnits(false);}}
                    />
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="period-filter">Período</Label>
                    <Select value={periodFilter} onValueChange={(v) => {setPeriodFilter(v); setShowUnits(false);}}>
                        <SelectTrigger id="period-filter">
                            <SelectValue placeholder="Filtrar por período..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los Períodos</SelectItem>
                            {periods.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                
                {!isCoordinator && (
                    <div className="col-span-1 md:col-span-2 lg:col-span-4">
                        <Button onClick={handleShowUnits}>Cargar Unidades</Button>
                    </div>
                )}

                 {showUnits && instituteId && (
                    <div className="col-span-1 md:col-span-2 lg:col-span-4 pt-4">
                        <UnitsList
                            key={`${programFilter}-${moduleFilter}-${periodFilter}-${textFilter}`}
                            instituteId={instituteId}
                            filters={{ programFilter, moduleFilter, periodFilter, textFilter }}
                            onDataChange={() => setShowUnits(false)}
                        />
                    </div>
                )}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
