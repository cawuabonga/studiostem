
"use client";

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import type { Program } from '@/types';
import { updateProgram } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';

const editProgramSchema = z.object({
  name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  code: z.string().min(1, { message: 'El código es requerido.' }),
  resolution: z.string().min(1, { message: 'La resolución es requerida.' }),
  duration: z.string().min(1, { message: 'La duración es requerida (ej: 6 Semestres).' }),
});

type EditProgramFormValues = z.infer<typeof editProgramSchema>;

interface EditProgramDialogProps {
  program: Program;
  isOpen: boolean;
  onClose: (updated?: boolean) => void;
}

export function EditProgramDialog({ program, isOpen, onClose }: EditProgramDialogProps) {
  const { toast } = useToast();
  const { instituteId } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<EditProgramFormValues>({
    resolver: zodResolver(editProgramSchema),
    defaultValues: {
      name: program?.name || '',
      code: program?.code || '',
      resolution: program?.resolution || '',
      duration: program?.duration || '',
    },
  });

  useEffect(() => {
    if (program) {
      form.reset(program);
    }
  }, [program, form, isOpen]);

  const onSubmit = async (data: EditProgramFormValues) => {
    if (!instituteId) {
        toast({ title: 'Error', description: 'ID de instituto no encontrado.', variant: 'destructive'});
        return;
    }
    setIsSubmitting(true);
    try {
      await updateProgram(instituteId, program.id, data);
      toast({
        title: '¡Éxito!',
        description: 'La información del programa ha sido actualizada.',
      });
      onClose(true); 
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el programa.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Programa de Estudio</DialogTitle>
          <DialogDescription>
            Realiza cambios en la información del programa.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Nombre del Programa</FormLabel>
                    <FormControl>
                        <Input {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Código</FormLabel>
                    <FormControl>
                        <Input {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="resolution"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Resolución</FormLabel>
                    <FormControl>
                        <Input {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Duración</FormLabel>
                    <FormControl>
                        <Input {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={() => onClose()}>
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
