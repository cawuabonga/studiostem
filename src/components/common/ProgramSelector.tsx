
"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getPrograms } from '@/config/firebase';
import type { Program } from '@/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '../ui/skeleton';

interface ProgramSelectorProps {
  onSelectionChange?: (programId: string | null) => void;
  children: (programId: string | null) => React.ReactNode;
}

export function ProgramSelector({ onSelectionChange, children }: ProgramSelectorProps) {
  const { user, instituteId, activeProgramId, setActiveProgramId, isCoordinator, isFullAdmin, loading: authLoading } = useAuth();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(true);

  useEffect(() => {
    if (instituteId) {
      setLoadingPrograms(true);
      getPrograms(instituteId)
        .then(setPrograms)
        .catch(console.error)
        .finally(() => setLoadingPrograms(false));
    }
  }, [instituteId]);

  const handleAdminSelection = (programId: string) => {
    const newActiveProgramId = programId === 'all' ? null : programId;
    setActiveProgramId(newActiveProgramId);
    if (onSelectionChange) {
      onSelectionChange(newActiveProgramId);
    }
  };
  
  const isLoading = authLoading || loadingPrograms;
  const coordinatorProgram = isCoordinator ? programs.find(p => p.id === user?.programId) : null;
  
  if (isLoading) {
      return <Skeleton className="h-10 w-full max-w-sm" />;
  }

  return (
    <div className="space-y-4">
        <div className="space-y-2">
            <Label htmlFor="program-selector">Programa de Estudio</Label>
            {isCoordinator ? (
                 <Input 
                    id="program-selector"
                    value={coordinatorProgram?.name || 'Cargando...'} 
                    disabled 
                />
            ) : isFullAdmin ? (
                <Select 
                    value={activeProgramId || 'all'} 
                    onValueChange={handleAdminSelection} 
                    disabled={!programs.length}
                >
                    <SelectTrigger id="program-selector">
                        <SelectValue placeholder="Seleccione un programa" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">-- Todos los Programas --</SelectItem>
                        {programs.map(program => (
                            <SelectItem key={program.id} value={program.id}>
                                {program.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            ) : null }
        </div>
        
        {/* Render children, passing the active program ID */}
        {children(activeProgramId)}

    </div>
  );
}
