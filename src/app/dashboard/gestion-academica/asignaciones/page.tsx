
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { getPrograms } from "@/config/firebase";
import { useAuth } from "@/contexts/AuthContext";
import type { Program } from "@/types";
import { Label } from '@/components/ui/label';
import { AssignmentBoard } from '@/components/assignments/AssignmentBoard';
import { Input } from '@/components/ui/input';

export default function AsignacionesPage() {
  const { user, instituteId, hasPermission } = useAuth();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [showAssignments, setShowAssignments] = useState(false);

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
     setShowAssignments(false);
  }, [isCoordinator, user?.programId]);

  const handleShowAssignments = () => {
    if (selectedProgramId && selectedYear) {
      setShowAssignments(true);
    }
  };
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString());

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Asignación de Unidades Didácticas</CardTitle>
          <CardDescription>
            Selecciona un año y un programa de estudio para asignar docentes a las unidades didácticas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2">
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
            <div className="flex-1 space-y-2">
                 <Label htmlFor="program-select">Programa de Estudio</Label>
                <Select 
                    value={selectedProgramId} 
                    onValueChange={(value) => { setSelectedProgramId(value); setShowAssignments(false); }} 
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
          <Button onClick={handleShowAssignments} disabled={!selectedProgramId || !selectedYear}>
            Cargar Unidades
          </Button>
        </CardContent>
      </Card>

      {showAssignments && instituteId && (
        <AssignmentBoard 
          key={`${instituteId}-${selectedProgramId}-${selectedYear}`}
          instituteId={instituteId} 
          programId={selectedProgramId} 
          year={selectedYear} 
        />
      )}
    </div>
  );
}
