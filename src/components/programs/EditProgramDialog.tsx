
"use client";

import React, { useEffect, useState } from 'react';
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
import type { StudyProgram } from '@/types';
import { updateStudyProgram } from '@/config/firebase';

const editProgramSchema = z.object({
  code: z.string().min(1, { message: 'El código del programa es requerido.' }),
  name: z.string().min(3, { message: 'La denominación debe tener al menos 3 caracteres.' }),
  abbreviation: z.string().min(2, { message: 'La abreviatura es requerida.' }),
});

type EditProgramFormValues = z.infer<typeof editProgramSchema>;

interface EditProgramDialogProps {
  program: StudyProgram;
  isOpen: boolean;
  onClose: (updated?: boolean) => void;
}

export function EditProgramDialog({ program, isOpen, onClose }: EditProgramDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EditProgramFormValues>({
    resolver: zodResolver(editProgramSchema),
    defaultValues: {
      code: program?.code || '',
      name: program?.name || '',
      abbreviation: program?.abbreviation || '',
    },
  });

  useEffect(() => {
    if (program) {
      form.reset({
        code: program.code,
        name: program.name,
        abbreviation: program.abbreviation || '',
      });
    }
  }, [program, form, isOpen]);

  const onSubmit = async (data: EditProgramFormValues) => {
    if (!program?.id) return;
    setIsSubmitting(true);
    try {
      await updateStudyProgram(program.id, data);
      toast({
        title: '¡Éxito!',
        description: 'El programa de estudios ha sido actualizado.',
      });
      onClose(true);
    } catch (error) {
      console.error('Error updating program:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el programa. Intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Editar Programa de Estudios</DialogTitle>
          <DialogDescription>
            Modifica los detalles del programa. Los cambios se guardarán permanentemente.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Denominación</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Desarrollo de Sistemas de Información" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Código del Programa (COD-PROGRAMA)</FormLabel>
                    <FormControl>
                        <Input placeholder="Ej: PSI-001" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                    control={form.control}
                    name="abbreviation"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Abreviatura</FormLabel>
                        <FormControl>
                        <Input placeholder="Ej: DSI" {...field} />
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
