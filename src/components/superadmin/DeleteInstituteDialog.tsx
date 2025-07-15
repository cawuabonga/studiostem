
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
import type { Institute } from '@/types';
import { deleteInstitute } from '@/config/firebase';

interface DeleteInstituteDialogProps {
  institute: Institute;
  isOpen: boolean;
  onClose: (updated?: boolean) => void;
}

export function DeleteInstituteDialog({ institute, isOpen, onClose }: DeleteInstituteDialogProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!institute?.id) return;
    setIsDeleting(true);
    try {
      // NOTE: This will only delete the institute document itself, not its subcollections.
      // A more robust solution would use a Cloud Function to recursively delete all sub-documents.
      await deleteInstitute(institute.id);
      toast({
        title: '¡Eliminado!',
        description: 'El instituto ha sido eliminado. Sus datos internos (como usuarios, docentes) no se eliminan automáticamente.',
        variant: 'default',
        duration: 5000,
      });
      onClose(true);
    } catch (error) {
      console.error('Error deleting institute:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el instituto. Intenta de nuevo.',
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
            Esta acción no se puede deshacer y eliminará el instituto
            <strong className="mx-1">{institute.name}</strong>.
            <br/><br/>
            <span className="font-bold text-destructive">Importante:</span> Esta operación solo elimina el registro del instituto, no elimina automáticamente a los usuarios, docentes o unidades asociadas. Esta es una medida de seguridad.
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
