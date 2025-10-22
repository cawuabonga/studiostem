
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from '@/components/ui/label';
import { TeacherLoadDashboard } from '@/components/carga-horaria/TeacherLoadDashboard';
import { ProgramSelector } from '@/components/common/ProgramSelector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function CargaHorariaPage() {
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [showLoad, setShowLoad] = useState(false);

  const handleShowLoad = (programId: string | null) => {
    if (programId && selectedYear) {
      setShowLoad(true);
    } else {
        setShowLoad(false);
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
            Selecciona un programa y un año para ver la carga horaria de los docentes y coordinadores.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <ProgramSelector onSelectionChange={() => setShowLoad(false)}>
                {(activeProgramId) => (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end pt-4">
                         <div className="space-y-2">
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
                        <Button onClick={() => handleShowLoad(activeProgramId)} disabled={!activeProgramId || !selectedYear}>
                            Consultar Carga Horaria
                        </Button>
                        
                        {showLoad && activeProgramId && (
                            <div className="col-span-full pt-4">
                                <TeacherLoadDashboard 
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
