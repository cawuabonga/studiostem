
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import type { StudyProgram } from '@/types';
import { deleteStudyProgram } from '@/config/firebase';

interface DeleteProgramDialogProps {
  program: StudyProgram;
  isOpen: boolean;
  onClose: (updated?: boolean) => void;
}

export function DeleteProgramDialog({ program, isOpen, onClose }: DeleteProgramDialogProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!program?.id) return;
    setIsDeleting(true);
    try {
      await deleteStudyProgram(program.id);
      toast({
        title: '¡Eliminado!',
        description: 'El programa de estudios ha sido eliminado.',
        variant: 'default',
      });
      onClose(true);
    } catch (error) {
      console.error('Error deleting program:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el programa. Intenta de nuevo.',
        variant: 'destructive',
      });
      onClose(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Esto eliminará permanentemente el programa de estudios
            <strong className="mx-1">{program.name}</strong>
            de la base de datos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onClose(false)} disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
            {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
