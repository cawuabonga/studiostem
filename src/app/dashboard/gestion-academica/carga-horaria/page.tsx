
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { getPrograms } from "@/config/firebase";
import { useAuth } from "@/contexts/AuthContext";
import type { Program } from "@/types";
import { Label } from '@/components/ui/label';
import { TeacherLoadDashboard } from '@/components/carga-horaria/TeacherLoadDashboard';

export default function CargaHorariaPage() {
  const { user, hasPermission, instituteId } = useAuth();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [showLoad, setShowLoad] = useState(false);

  const isCoordinator = hasPermission('academic:unit:manage:own') && !hasPermission('academic:program:manage');

  useEffect(() => {
    if (instituteId) {
      getPrograms(instituteId).then(setPrograms).catch(console.error);
    }
  }, [instituteId]);

  useEffect(() => {
    if (isCoordinator && user?.programId) {
      setSelectedProgramId(user.programId);
    } else {
      setSelectedProgramId('');
    }
     setShowLoad(false);
  }, [isCoordinator, user?.programId]);


  const handleShowLoad = () => {
    if (selectedProgramId && selectedYear) {
      setShowLoad(true);
    }
  };
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString());

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Consulta de Carga Horaria</CardTitle>
          <CardDescription>
            Selecciona un año y un programa de estudio para ver la carga horaria de los docentes y coordinadores.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2">
                <Label htmlFor="year-select">Año</Label>
                <Select value={selectedYear} onValueChange={(value) => { setSelectedYear(value); setShowLoad(false); }}>
                    <SelectTrigger id="year-select">
                        <SelectValue placeholder="Seleccione un año" />
                    </SelectTrigger>
                    <SelectContent>
                        {years.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex-1 space-y-2">
                 <Label htmlFor="program-select">Programa de Estudio</Label>
                <Select 
                    value={selectedProgramId} 
                    onValueChange={(value) => { setSelectedProgramId(value); setShowLoad(false); }} 
                    disabled={!programs.length || isCoordinator}
                >
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
          </div>
          <Button onClick={handleShowLoad} disabled={!selectedProgramId || !selectedYear}>
            Consultar Carga Horaria
          </Button>
        </CardContent>
      </Card>

      {showLoad && instituteId && (
        <TeacherLoadDashboard 
          key={`${instituteId}-${selectedProgramId}-${selectedYear}`}
          instituteId={instituteId} 
          programId={selectedProgramId} 
          year={selectedYear} 
        />
      )}
    </div>
  );
}
