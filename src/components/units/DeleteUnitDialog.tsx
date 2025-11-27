

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
import type { Unit } from '@/types';
import { deleteUnit } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';

interface DeleteUnitDialogProps {
  unit: Unit;
  isOpen: boolean;
  onClose: (updated?: boolean) => void;
}

export function DeleteUnitDialog({ unit, isOpen, onClose }: DeleteUnitDialogProps) {
  const { toast } = useToast();
  const { instituteId } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!instituteId) {
        // toast({ title: 'Error', description: 'ID de instituto no encontrado.', variant: 'destructive'});
        return;
    }
    setIsDeleting(true);
    try {
      await deleteUnit(instituteId, unit.id);
      // toast({
      //   title: '¡Eliminada!',
      //   description: 'La unidad didáctica ha sido eliminada.',
      // });
      onClose(true);
    } catch (error) {
      // toast({
      //   title: 'Error',
      //   description: 'No se pudo eliminar la unidad. Intenta de nuevo.',
      //   variant: 'destructive',
      // });
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
            Esta acción no se puede deshacer y eliminará la unidad
            <strong className="mx-1">{unit.name}</strong>.
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
