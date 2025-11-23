
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from '@/components/ui/label';
import { AssignmentBoard } from '@/components/assignments/AssignmentBoard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { getPrograms } from '@/config/firebase';
import type { Program } from '@/types';
import { Input } from '@/components/ui/input';

export default function AsignacionesPage() {
  const { user, hasPermission, instituteId } = useAuth();
  
  const isFullAdmin = hasPermission('academic:program:manage');
  const isCoordinator = hasPermission('academic:assignment:manage') && !isFullAdmin;

  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState(() => isCoordinator ? user?.programId || '' : '');
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [showAssignments, setShowAssignments] = useState(false);

  useEffect(() => {
    if (instituteId) {
        getPrograms(instituteId).then(allPrograms => {
            if (isCoordinator && user?.programId) {
                setPrograms(allPrograms.filter(p => p.id === user.programId));
            } else if (isFullAdmin) {
                setPrograms(allPrograms);
            }
        });
    }
  }, [instituteId, isFullAdmin, isCoordinator, user?.programId]);
  
  useEffect(() => {
    if (isCoordinator && user?.programId) {
        setSelectedProgramId(user.programId);
    }
  }, [isCoordinator, user?.programId]);

  const handleShowAssignments = () => {
    if (selectedProgramId && selectedYear) {
      setShowAssignments(true);
    } else {
      setShowAssignments(false);
    }
  };
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString());

  const coordinatorProgramName = isCoordinator ? programs.find(p => p.id === user?.programId)?.name : '';


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Asignación de Unidades Didácticas</CardTitle>
          <CardDescription>
            {isCoordinator 
             ? `Asigne docentes a las unidades didácticas de su programa.`
             : 'Selecciona un programa de estudio y un año para asignar docentes a las unidades didácticas.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-4">
                 <div className="space-y-2">
                    <Label htmlFor="program-select">Programa de Estudios</Label>
                    {isCoordinator ? (
                        <Input value={coordinatorProgramName || 'Cargando...'} disabled />
                    ) : (
                         <Select value={selectedProgramId} onValueChange={(value) => { setSelectedProgramId(value); setShowAssignments(false); }}>
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
                    <Label htmlFor="year-select">Año</Label>
                    <Select value={selectedYear} onValueChange={(value) => { setSelectedYear(value); setShowAssignments(false); }}>
                        <SelectTrigger id="year-select">
                            <SelectValue placeholder="Seleccione un año" />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <Button onClick={handleShowAssignments} disabled={!selectedProgramId || !selectedYear}>
                    Cargar Tablero de Asignación
                </Button>
            </div>
            
             {showAssignments && selectedProgramId && (
                <div className="col-span-full pt-4">
                    <AssignmentBoard 
                        key={`${selectedProgramId}-${selectedYear}`}
                        programId={selectedProgramId} 
                        year={selectedYear} 
                    />
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
