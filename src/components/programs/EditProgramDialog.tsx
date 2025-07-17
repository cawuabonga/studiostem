
"use client";

import React, { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { Separator } from '../ui/separator';

const editProgramSchema = z.object({
  name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  code: z.string().min(1, { message: 'El código es requerido.' }),
  abbreviation: z.string().min(1, { message: 'La abreviación es requerida.' }),
  duration: z.string().min(1, { message: 'La duración es requerida (ej: 6 Semestres).' }),
  moduleCount: z.coerce.number().min(1, 'Debe haber al menos 1 módulo.').max(10, 'No puede haber más de 10 módulos.'),
  moduleNames: z.array(z.object({ value: z.string().min(1, 'El nombre del módulo es requerido.') })),
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
      abbreviation: program?.abbreviation || '',
      duration: program?.duration || '',
      moduleCount: program?.moduleCount || 1,
      moduleNames: program?.moduleNames?.map(name => ({ value: name })) || [{ value: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "moduleNames"
  });

  const moduleCount = form.watch('moduleCount');

  useEffect(() => {
    if (program && isOpen) {
      form.reset({
        ...program,
        moduleNames: program.moduleNames.map(name => ({ value: name }))
      });
    }
  }, [program, form, isOpen]);

  useEffect(() => {
    const currentCount = fields.length;
    const newCount = Number(moduleCount); // Ensure it's a number
    if (isNaN(newCount) || newCount < 1) return;

    if (newCount > currentCount) {
      for (let i = currentCount; i < newCount; i++) {
        append({ value: '' });
      }
    } else if (newCount < currentCount) {
      for (let i = currentCount; i > newCount; i--) {
        remove(i - 1);
      }
    }
  }, [moduleCount, fields.length, append, remove]);


  const onSubmit = async (data: EditProgramFormValues) => {
    if (!instituteId) {
        toast({ title: 'Error', description: 'ID de instituto no encontrado.', variant: 'destructive'});
        return;
    }
    setIsSubmitting(true);
    try {
      const updateData = {
          ...data,
          moduleNames: data.moduleNames.map(m => m.value)
      };
      await updateProgram(instituteId, program.id, updateData);
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
      <DialogContent className="max-h-[90vh] overflow-y-auto">
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
                name="abbreviation"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Abreviación</FormLabel>
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

            <Separator className="my-6" />

             <h3 className="text-lg font-medium">Módulos del Programa</h3>

            <FormField
              control={form.control}
              name="moduleCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cantidad de Módulos</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" max="10" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              {fields.map((item, index) => (
                <FormField
                  key={item.id}
                  control={form.control}
                  name={`moduleNames.${index}.value`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Módulo {index + 1}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
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
