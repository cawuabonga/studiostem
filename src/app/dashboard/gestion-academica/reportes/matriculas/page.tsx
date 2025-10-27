
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { getPrograms } from '@/config/firebase';
import type { Program } from '@/types';
import { Input } from '@/components/ui/input';
import { MatriculationReportView } from '@/components/reports/MatriculationReportView';
import { Loader2 } from 'lucide-react';

const semesters = Array.from({ length: 10 }, (_, i) => i + 1);
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString());

export default function MatriculaReportPage() {
  const { user, hasPermission, instituteId } = useAuth();
  
  const isFullAdmin = hasPermission('academic:program:manage');
  const isCoordinator = hasPermission('academic:enrollment:manage') && !isFullAdmin;

  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedProgramId, setSelectedProgramId] = useState(() => isCoordinator ? user?.programId || '' : '');
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  
  const [reportParams, setReportParams] = useState<{programId: string; year: string; semester: number} | null>(null);

  useEffect(() => {
    if (instituteId) {
        setLoading(true);
        getPrograms(instituteId).then(allPrograms => {
             if (isCoordinator && user?.programId) {
                setPrograms(allPrograms.filter(p => p.id === user.programId));
             } else {
                setPrograms(allPrograms);
             }
             setLoading(false);
        });
    }
  }, [instituteId, isCoordinator, user?.programId]);

  const handleGenerateReport = () => {
    if (selectedProgramId && selectedYear && selectedSemester) {
        setReportParams({
            programId: selectedProgramId,
            year: selectedYear,
            semester: parseInt(selectedSemester, 10),
        });
    }
  };
  
  const coordinatorProgramName = isCoordinator ? programs.find(p => p.id === user?.programId)?.name : '';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Reportes de Matrícula</CardTitle>
          <CardDescription>
            Selecciona los parámetros para generar una lista de estudiantes matriculados por unidad didáctica.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            {loading ? <Loader2 className="animate-spin" /> : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end pt-4">
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
                        <Label htmlFor="year-select">Año Académico</Label>
                        <Select value={selectedYear} onValueChange={setSelectedYear}>
                            <SelectTrigger id="year-select"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {years.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="semester-select">Semestre</Label>
                        <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                            <SelectTrigger id="semester-select"><SelectValue placeholder="Seleccione semestre" /></SelectTrigger>
                            <SelectContent>
                                {semesters.map(s => <SelectItem key={s} value={String(s)}>Semestre {s}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={handleGenerateReport} disabled={!selectedProgramId || !selectedYear || !selectedSemester}>
                        Generar Reporte
                    </Button>
                </div>
            )}
        </CardContent>
      </Card>

      {reportParams && (
        <MatriculationReportView 
            key={`${reportParams.programId}-${reportParams.year}-${reportParams.semester}`}
            {...reportParams}
        />
      )}
    </div>
  );
}
