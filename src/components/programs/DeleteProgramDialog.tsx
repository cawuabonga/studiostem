
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
import type { Program } from '@/types';
import { deleteProgram } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';

interface DeleteProgramDialogProps {
  program: Program;
  isOpen: boolean;
  onClose: (updated?: boolean) => void;
}

export function DeleteProgramDialog({ program, isOpen, onClose }: DeleteProgramDialogProps) {
  const { toast } = useToast();
  const { instituteId } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!instituteId) {
        toast({ title: 'Error', description: 'ID de instituto no encontrado.', variant: 'destructive'});
        return;
    }
    setIsDeleting(true);
    try {
      await deleteProgram(instituteId, program.id);
      toast({
        title: '¡Eliminado!',
        description: 'El programa de estudio ha sido eliminado.',
      });
      onClose(true);
    } catch (error) {
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
          <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer y eliminará el programa
            <strong className="mx-1">{program.name}</strong>.
            Esto puede afectar a unidades didácticas y otros datos asociados.
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
