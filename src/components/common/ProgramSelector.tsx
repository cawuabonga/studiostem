
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
  const { user, instituteId, activeProgramId, setActiveProgramId, loading: authLoading, hasPermission } = useAuth();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(true);

  // Determine user type based on permissions
  const isFullAdmin = hasPermission('academic:program:manage');
  const isCoordinator = hasPermission('academic:unit:manage:own') && !isFullAdmin;

  useEffect(() => {
    if (instituteId) {
      setLoadingPrograms(true);
      getPrograms(instituteId)
        .then(setPrograms)
        .catch(console.error)
        .finally(() => setLoadingPrograms(false));
    } else if (!authLoading) {
        setLoadingPrograms(false);
    }
  }, [instituteId, authLoading]);
  
  useEffect(() => {
    // If the user is a coordinator, their active program ID should always be their own programId.
    // This effect ensures it's set correctly when the user data is available.
    if (isCoordinator && user?.programId && activeProgramId !== user.programId) {
      setActiveProgramId(user.programId);
    }
  }, [isCoordinator, user?.programId, activeProgramId, setActiveProgramId]);


  const handleAdminSelection = (programId: string) => {
    const newActiveProgramId = programId === 'all' ? null : programId;
    setActiveProgramId(newActiveProgramId);
    if (onSelectionChange) {
      onSelectionChange(newActiveProgramId);
    }
  };
  
  const isLoading = authLoading || loadingPrograms;
  
  // This is the definitive program to be used, either from the coordinator or the admin's selection.
  const definitiveProgramId = isCoordinator ? user?.programId : activeProgramId;
  const coordinatorProgram = isCoordinator ? programs.find(p => p.id === user?.programId) : null;
  
  if (isLoading) {
      return <Skeleton className="h-10 w-full max-w-sm" />;
  }

  return (
    <div className="space-y-4">
        <div className="space-y-2 max-w-sm">
            <Label htmlFor="program-selector">Programa de Estudio</Label>
            {isCoordinator ? (
                 <Input 
                    id="program-selector"
                    value={coordinatorProgram?.name || 'Cargando programa...'} 
                    disabled 
                    className="font-semibold"
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
            ) : (
                <p className="text-sm text-muted-foreground">No tiene permisos para seleccionar un programa.</p>
            )}
        </div>
        
        {/* Render children, passing the definitive program ID */}
        {children(definitiveProgramId || null)}

    </div>
  );
}
