
"use client";

import React, { useState } from 'react';
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
import type { DidacticUnit } from '@/types';
import { deleteDidacticUnit } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';

interface DeleteUnitDialogProps {
  unit: DidacticUnit;
  isOpen: boolean;
  onClose: (updated?: boolean) => void;
}

export function DeleteUnitDialog({ unit, isOpen, onClose }: DeleteUnitDialogProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const { instituteId } = useAuth();

  const handleDelete = async () => {
    if (!unit?.id || !instituteId) return;
    setIsDeleting(true);
    try {
      await deleteDidacticUnit(instituteId, unit.id);
      toast({
        title: '¡Eliminada!',
        description: 'La unidad didáctica ha sido eliminada.',
        variant: 'default',
      });
      onClose(true);
    } catch (error) {
      console.error('Error deleting unit:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la unidad. Intenta de nuevo.',
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
            Esta acción no se puede deshacer. Esto eliminará permanentemente la unidad didáctica
            <strong className="mx-1">{unit.name}</strong>
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
