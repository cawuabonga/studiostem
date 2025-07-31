
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { getPrograms } from "@/config/firebase";
import { useAuth } from "@/contexts/AuthContext";
import type { Program, ProgramModule } from "@/types";
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Construction } from 'lucide-react';

export default function MatriculaPage() {
  const { instituteId } = useAuth();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [modules, setModules] = useState<ProgramModule[]>([]);
  
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('');

  const [showDashboard, setShowDashboard] = useState(false);
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString());
  const periods = ['MAR-JUL', 'AGO-DIC'];
  const semesters = Array.from({ length: 10 }, (_, i) => (i + 1).toString());

  useEffect(() => {
    if (instituteId) {
      getPrograms(instituteId).then(setPrograms).catch(console.error);
    }
  }, [instituteId]);

   useEffect(() => {
    if (selectedProgramId) {
      const selectedProgram = programs.find(p => p.id === selectedProgramId);
      setModules(selectedProgram?.modules || []);
      setSelectedModuleId(''); // Reset module when program changes
    } else {
      setModules([]);
    }
  }, [selectedProgramId, programs]);

  const handleLoad = () => {
    if (selectedProgramId && selectedYear && selectedPeriod && selectedModuleId && selectedSemester) {
      setShowDashboard(true);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Módulo de Matrícula de Estudiantes</CardTitle>
          <CardDescription>
            Selecciona los parámetros para cargar las unidades didácticas y los estudiantes elegibles para la matrícula.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
                <Label htmlFor="program-select">Programa de Estudio</Label>
                <Select value={selectedProgramId} onValueChange={(value) => { setSelectedProgramId(value); setShowDashboard(false); }} disabled={!programs.length}>
                    <SelectTrigger id="program-select">
                        <SelectValue placeholder="Seleccione un programa" />
                    </SelectTrigger>
                    <SelectContent>
                        {programs.map(program => (
                            <SelectItem key={program.id} value={program.id}>
                                {program.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
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
                <Label htmlFor="period-select">Período Académico</Label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger id="period-select">
                        <SelectValue placeholder="Seleccione período" />
                    </SelectTrigger>
                    <SelectContent>
                        {periods.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
             <div className="space-y-2">
                <Label htmlFor="module-select">Módulo</Label>
                <Select value={selectedModuleId} onValueChange={setSelectedModuleId} disabled={!modules.length}>
                    <SelectTrigger id="module-select">
                        <SelectValue placeholder="Seleccione un módulo" />
                    </SelectTrigger>
                    <SelectContent>
                        {modules.map(module => <SelectItem key={module.code} value={module.code}>{module.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
             <div className="space-y-2">
                <Label htmlFor="semester-select">Semestre</Label>
                <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                    <SelectTrigger id="semester-select">
                        <SelectValue placeholder="Seleccione semestre" />
                    </SelectTrigger>
                    <SelectContent>
                        {semesters.map(s => <SelectItem key={s} value={s}>Semestre {s}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
          </div>
          <Button 
            onClick={handleLoad} 
            disabled={!selectedProgramId || !selectedYear || !selectedPeriod || !selectedModuleId || !selectedSemester}
            className="mt-4"
          >
            Cargar Alumnos y Unidades
          </Button>
        </CardContent>
      </Card>

      {showDashboard && (
        <Card>
            <CardContent className="pt-6">
                <Alert>
                    <Construction className="h-4 w-4" />
                    <AlertTitle>¡Funcionalidad en Desarrollo!</AlertTitle>
                    <AlertDescription>
                        La capacidad para cargar y matricular estudiantes estará disponible próximamente.
                    </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
