
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { getStudyPrograms } from '@/config/firebase';
import type { StudyProgram } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { EditProgramDialog } from './EditProgramDialog';
import { DeleteProgramDialog } from './DeleteProgramDialog';

interface ProgramsListProps {
    onDataChange: () => void;
}

export function ProgramsList({ onDataChange }: ProgramsListProps) {
  const [programs, setPrograms] = useState<StudyProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState<StudyProgram | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchPrograms = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedPrograms = await getStudyPrograms();
      setPrograms(fetchedPrograms);
    } catch (error) {
      console.error("Error fetching programs:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los programas de estudios.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  const handleEdit = (program: StudyProgram) => {
    setSelectedProgram(program);
    setIsEditDialogOpen(true);
  };
  
  const handleDelete = (program: StudyProgram) => {
    setSelectedProgram(program);
    setIsDeleteDialogOpen(true);
  };

  const handleDialogClose = (updated?: boolean) => {
    setIsEditDialogOpen(false);
    setIsDeleteDialogOpen(false);
    setSelectedProgram(null);
    if (updated) {
      fetchPrograms();
      onDataChange();
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }
  
  if (!programs.length) {
    return <p className="text-center text-muted-foreground">No hay programas de estudios registrados.</p>;
  }

  return (
    <>
      <div className="rounded-md border relative">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Denominación</TableHead>
              <TableHead>Abreviatura</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {programs.map((program) => (
              <TableRow key={program.id}>
                <TableCell className="font-mono">{program.code}</TableCell>
                <TableCell className="font-medium">{program.name}</TableCell>
                <TableCell className="font-mono">{program.abbreviation}</TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(program)}>
                      <Edit2 className="h-4 w-4" />
                      <span className="sr-only">Editar Programa</span>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(program)} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Eliminar Programa</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {selectedProgram && isEditDialogOpen && (
        <EditProgramDialog
          program={selectedProgram}
          isOpen={isEditDialogOpen}
          onClose={handleDialogClose}
        />
      )}
      {selectedProgram && isDeleteDialogOpen && (
          <DeleteProgramDialog
            program={selectedProgram}
            isOpen={isDeleteDialogOpen}
            onClose={handleDialogClose}
          />
      )}
    </>
  );
}
