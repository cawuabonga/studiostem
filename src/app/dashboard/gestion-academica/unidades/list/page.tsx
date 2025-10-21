
"use client";

import { UnitsList } from "@/components/units/UnitsList";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useCallback } from "react";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { getPrograms, getStaffProfileByDocumentId } from "@/config/firebase";
import type { Program, UnitPeriod } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const periods: UnitPeriod[] = ['MAR-JUL', 'AGO-DIC'];

export default function ListUnitsPage() {
  const { user, instituteId, loading: authLoading, hasPermission } = useAuth();
  const router = useRouter();

  // State for filters, managed now in the parent page
  const [textFilter, setTextFilter] = useState('');
  const [programFilter, setProgramFilter] = useState('all');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState<UnitPeriod | 'all'>('all');
  
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isCoordinator, setIsCoordinator] = useState(false);
  const [coordinatorProgramId, setCoordinatorProgramId] = useState<string | null>(null);
  const [initialDataLoading, setInitialDataLoading] = useState(true);

  const [showUnits, setShowUnits] = useState(false);

  const isFullAdmin = hasPermission('academic:program:manage');

  // Effect to determine user role and fetch necessary initial data
  useEffect(() => {
    const setupPermissionsAndFilters = async () => {
      if (authLoading || !instituteId) return;

      const userIsCoordinator = hasPermission('academic:unit:manage:own') && !isFullAdmin;
      setIsCoordinator(userIsCoordinator);

      try {
        const fetchedPrograms = await getPrograms(instituteId);
        setPrograms(fetchedPrograms);

        if (userIsCoordinator && user?.documentId) {
          const profile = await getStaffProfileByDocumentId(instituteId, user.documentId);
          if (profile?.programId) {
            setProgramFilter(profile.programId);
            setCoordinatorProgramId(profile.programId);
          }
        }
      } catch (error) {
        console.error("Error setting up filters:", error);
      } finally {
        setInitialDataLoading(false);
      }
    };

    setupPermissionsAndFilters();
  }, [authLoading, instituteId, user, hasPermission, isFullAdmin]);
  
  const handleShowUnits = () => {
    setShowUnits(true);
  };
  
  // Reset showUnits state if filters change
  useEffect(() => {
      setShowUnits(false);
  }, [textFilter, programFilter, moduleFilter, periodFilter]);

  const availableModules = useMemo(() => {
      if(programFilter === 'all' || !programs) return [];
      const program = programs.find(p => p.id === programFilter);
      return program?.modules || [];
  }, [programFilter, programs]);

  if (initialDataLoading) {
      return <p>Cargando configuración...</p>
  }

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
            <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
              <Input 
                placeholder="Buscar por nombre, código..."
                value={textFilter}
                onChange={(e) => setTextFilter(e.target.value)}
                className="max-w-sm"
              />
              <Select value={programFilter} onValueChange={setProgramFilter} disabled={isCoordinator}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="Filtrar por programa..." />
                  </SelectTrigger>
                  <SelectContent>
                      {!isCoordinator && <SelectItem value="all">Todos los Programas</SelectItem>}
                      {programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
              </Select>
              <Select value={moduleFilter} onValueChange={setModuleFilter} disabled={availableModules.length === 0}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="Filtrar por módulo..." />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="all">Todos los Módulos</SelectItem>
                      {availableModules.map(m => <SelectItem key={m.code} value={m.code}>{m.name}</SelectItem>)}
                  </SelectContent>
              </Select>
              <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as any)}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Filtrar por período..." />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="all">Todos los Períodos</SelectItem>
                      {periods.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
              </Select>
            </div>
             <Button onClick={handleShowUnits}>Cargar Unidades</Button>
        </CardContent>
      </Card>
      
      {showUnits && instituteId && (
        <UnitsList
          key={`${programFilter}-${moduleFilter}-${periodFilter}-${textFilter}`}
          instituteId={instituteId}
          filters={{ programFilter, moduleFilter, periodFilter, textFilter }}
          isCoordinator={isCoordinator}
          onDataChange={() => setShowUnits(false)} // Force refilter on data change
        />
      )}
    </div>
  );
}
