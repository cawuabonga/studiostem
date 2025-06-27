
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
import type { Teacher } from '@/types';
import { deleteTeacher } from '@/config/firebase';

interface DeleteTeacherDialogProps {
  teacher: Teacher;
  isOpen: boolean;
  onClose: (updated?: boolean) => void;
}

export function DeleteTeacherDialog({ teacher, isOpen, onClose }: DeleteTeacherDialogProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!teacher?.id) return;
    setIsDeleting(true);
    try {
      await deleteTeacher(teacher.id);
      toast({
        title: '¡Eliminado!',
        description: 'El docente ha sido eliminado.',
        variant: 'default',
      });
      onClose(true);
    } catch (error) {
      console.error('Error deleting teacher:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar al docente. Intenta de nuevo.',
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
            Esta acción no se puede deshacer. Esto eliminará permanentemente al docente
            <strong className="mx-1">{teacher.fullName}</strong>
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
