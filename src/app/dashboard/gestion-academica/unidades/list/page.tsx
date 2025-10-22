
"use client";

import { UnitsList } from "@/components/units/UnitsList";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useMemo } from "react";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { UnitPeriod } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProgramSelector } from "@/components/common/ProgramSelector";

const periods: UnitPeriod[] = ['MAR-JUL', 'AGO-DIC'];

export default function ListUnitsPage() {
  const { instituteId, loading: authLoading } = useAuth();
  
  const [textFilter, setTextFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState<UnitPeriod | 'all'>('all');
  
  const [showUnits, setShowUnits] = useState(false);

  const handleShowUnits = () => {
    setShowUnits(true);
  };
  
  const resetAndSearch = (setter: React.Dispatch<React.SetStateAction<any>>) => (value: any) => {
      setter(value);
      setShowUnits(false);
  };
  
  if (authLoading) {
      return (
          <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
      )
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
            <ProgramSelector onSelectionChange={() => setShowUnits(false)}>
                {(activeProgramId) => (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="text-filter">Búsqueda por texto</Label>
                            <Input 
                            id="text-filter"
                            placeholder="Buscar por nombre, código..."
                            value={textFilter}
                            onChange={resetAndSearch(setTextFilter)}
                            />
                        </div>
                        
                        {/* Module and Period filters could be adapted to be children too, or remain here */}
                        <div className="space-y-2">
                            <Label htmlFor="period-filter">Período</Label>
                            <Select value={periodFilter} onValueChange={resetAndSearch(setPeriodFilter)}>
                                <SelectTrigger id="period-filter">
                                    <SelectValue placeholder="Filtrar por período..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los Períodos</SelectItem>
                                    {periods.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="col-span-1 md:col-span-2 lg:col-span-4">
                            <Button onClick={handleShowUnits}>Cargar Unidades</Button>
                        </div>

                         {showUnits && instituteId && (
                            <div className="col-span-1 md:col-span-2 lg:col-span-4 pt-4">
                                <UnitsList
                                    key={`${activeProgramId}-${moduleFilter}-${periodFilter}-${textFilter}`}
                                    instituteId={instituteId}
                                    filters={{ programFilter: activeProgramId || 'all', moduleFilter, periodFilter, textFilter }}
                                    onDataChange={() => setShowUnits(false)}
                                />
                            </div>
                        )}
                    </div>
                )}
            </ProgramSelector>
        </CardContent>
      </Card>
    </div>
  );
}
