
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from '@/components/ui/label';
import { AssignmentBoard } from '@/components/assignments/AssignmentBoard';
import { ProgramSelector } from '@/components/common/ProgramSelector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AsignacionesPage() {
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [showAssignments, setShowAssignments] = useState(false);

  const handleShowAssignments = (programId: string | null) => {
    if (programId && selectedYear) {
      setShowAssignments(true);
    } else {
      setShowAssignments(false);
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
            Selecciona un programa de estudio y un año para asignar docentes a las unidades didácticas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <ProgramSelector onSelectionChange={setShowAssignments.bind(null, false)}>
                {(activeProgramId) => (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end pt-4">
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
                        <Button onClick={() => handleShowAssignments(activeProgramId)} disabled={!activeProgramId || !selectedYear}>
                            Cargar Tablero de Asignación
                        </Button>
                        
                        {showAssignments && activeProgramId && (
                            <div className="col-span-full pt-4">
                                <AssignmentBoard 
                                    key={`${activeProgramId}-${selectedYear}`}
                                    programId={activeProgramId} 
                                    year={selectedYear} 
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
