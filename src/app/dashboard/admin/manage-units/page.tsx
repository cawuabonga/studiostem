
"use client";

import { AddUnitForm } from "@/components/units/AddUnitForm";
import { UnitsList } from "@/components/units/UnitsList";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BulkUploadUnits } from "@/components/units/BulkUploadUnits";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { getStudyPrograms } from "@/config/firebase";
import type { StudyProgram, UnitFilters, UnitPeriod } from "@/types";
import { X } from "lucide-react";

const moduleOptions = Array.from({ length: 10 }, (_, i) => `Módulo ${String(i + 1).padStart(2, '0')}`);
const periodOptions: UnitPeriod[] = ['MAR-JUL', 'AGOS-DIC'];

export default function ManageUnitsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);
  const [filters, setFilters] = useState<UnitFilters>({});
  const [studyPrograms, setStudyPrograms] = useState<StudyProgram[]>([]);
  const [programsLoading, setProgramsLoading] = useState(true);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'Admin')) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    const fetchPrograms = async () => {
      setProgramsLoading(true);
      try {
        const programs = await getStudyPrograms();
        setStudyPrograms(programs);
      } catch (error) {
        console.error("Failed to fetch study programs:", error);
      } finally {
        setProgramsLoading(false);
      }
    };
    fetchPrograms();
  }, []);

  const handleDataChange = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };
  
  const handleFilterChange = (filterName: keyof UnitFilters, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value === 'ALL' ? undefined : value }));
  };

  const resetFilters = () => {
    setFilters({});
  };

  const isAnyFilterActive = useMemo(() => Object.values(filters).some(val => val !== undefined && val !== ''), [filters]);

  if (loading || !user || user.role !== 'Admin') {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Cargando o no autorizado...</p>
      </div>
    );
  }

  return (
    <Tabs defaultValue="list" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="register">Registrar Unidad</TabsTrigger>
        <TabsTrigger value="list">Listado de Unidades</TabsTrigger>
      </TabsList>
      <TabsContent value="register" className="mt-4">
        <div className="flex flex-col gap-4">
            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="text-base font-semibold py-3 px-4 rounded-md border bg-card text-card-foreground shadow-sm data-[state=closed]:rounded-md data-[state=open]:rounded-b-none">
                      Carga Masiva desde Excel
                  </AccordionTrigger>
                  <AccordionContent>
                      <Card className="rounded-t-none border-t-0">
                          <CardHeader className="pb-4">
                              <CardTitle className="text-lg">Subir Múltiples Unidades</CardTitle>
                              <CardDescription>
                                  Sube la plantilla de Excel para registrar varias unidades a la vez.
                              </CardDescription>
                          </CardHeader>
                          <CardContent>
                              <BulkUploadUnits onUploadComplete={handleDataChange} />
                          </CardContent>
                      </Card>
                  </AccordionContent>
                </AccordionItem>
            </Accordion>

            <Card className="flex-shrink-0">
                <CardHeader>
                <CardTitle>Registrar Nueva Unidad Didáctica</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                <AddUnitForm onUnitAdded={handleDataChange} />
                </CardContent>
            </Card>
        </div>
      </TabsContent>
      <TabsContent value="list" className="mt-4">
        <Card>
            <CardHeader>
                <CardTitle>Unidades Didácticas Registradas</CardTitle>
                <CardDescription>Filtra y gestiona las unidades existentes en el sistema.</CardDescription>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2 pt-4">
                    <Input 
                        placeholder="Buscar por nombre..."
                        value={filters.name || ''}
                        onChange={(e) => handleFilterChange('name', e.target.value)}
                    />
                     <Select value={filters.studyProgram || 'ALL'} onValueChange={(value) => handleFilterChange('studyProgram', value)} disabled={programsLoading}>
                        <SelectTrigger>
                            <SelectValue placeholder={programsLoading ? "Cargando..." : "Filtrar por Programa"} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Todos los Programas</SelectItem>
                            {studyPrograms.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                     <Select value={filters.period || 'ALL'} onValueChange={(value) => handleFilterChange('period', value)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Filtrar por Periodo" />
                        </SelectTrigger>
                        <SelectContent>
                             <SelectItem value="ALL">Todos los Periodos</SelectItem>
                             {periodOptions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        </SelectContent>
                    </Select>
                     <Select value={filters.module || 'ALL'} onValueChange={(value) => handleFilterChange('module', value)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Filtrar por Módulo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Todos los Módulos</SelectItem>
                            {moduleOptions.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Button variant="ghost" onClick={resetFilters} disabled={!isAnyFilterActive}>
                        <X className="mr-2 h-4 w-4" />
                        Limpiar
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <UnitsList key={refreshKey} onDataChange={handleDataChange} filters={filters} />
            </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
