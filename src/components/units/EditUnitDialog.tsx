
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
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import type { DidacticUnit } from '@/types';
import { updateDidacticUnit } from '@/config/firebase';

const editUnitSchema = z.object({
  name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  credits: z.coerce.number().min(0, { message: 'Los créditos deben ser un número positivo.' }),
  theoreticalHours: z.coerce.number().min(0, { message: 'Las horas deben ser un número positivo.' }),
  practicalHours: z.coerce.number().min(0, { message: 'Las horas deben ser un número positivo.' }),
  numberOfGroups: z.coerce.number().min(1, { message: 'Debe haber al menos 1 grupo.' }).default(1),
});

type EditUnitFormValues = z.infer<typeof editUnitSchema>;

interface EditUnitDialogProps {
  unit: DidacticUnit;
  isOpen: boolean;
  onClose: (updated?: boolean) => void;
}

export function EditUnitDialog({ unit, isOpen, onClose }: EditUnitDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalHours, setTotalHours] = useState(unit.totalHours);

  const form = useForm<EditUnitFormValues>({
    resolver: zodResolver(editUnitSchema),
    defaultValues: {
      name: unit?.name || '',
      credits: unit?.credits || 0,
      theoreticalHours: unit?.theoreticalHours || 0,
      practicalHours: unit?.practicalHours || 0,
      numberOfGroups: unit?.numberOfGroups || 1,
    },
  });

  const { watch, reset } = form;
  const theoreticalHours = watch('theoreticalHours');
  const practicalHours = watch('practicalHours');
  const numberOfGroups = watch('numberOfGroups');

  useEffect(() => {
    const th = Number(theoreticalHours) || 0;
    const ph = Number(practicalHours) || 0;
    const multiplier = Number(numberOfGroups) || 1;
    setTotalHours((th + ph) * multiplier);
  }, [theoreticalHours, practicalHours, numberOfGroups]);

  useEffect(() => {
    if (unit) {
      reset({
        name: unit.name,
        credits: unit.credits,
        theoreticalHours: unit.theoreticalHours,
        practicalHours: unit.practicalHours,
        numberOfGroups: unit.numberOfGroups,
      });
    }
  }, [unit, reset, isOpen]);

  const onSubmit = async (data: EditUnitFormValues) => {
    if (!unit?.id) return;
    setIsSubmitting(true);
    try {
      const updatedData: Partial<Omit<DidacticUnit, 'id'>> = {
        ...data,
        totalHours: totalHours,
      };
      await updateDidacticUnit(unit.id, updatedData);
      toast({
        title: '¡Éxito!',
        description: 'La unidad didáctica ha sido actualizada.',
      });
      onClose(true);
    } catch (error) {
      console.error('Error updating unit:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la unidad. Intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Unidad Didáctica</DialogTitle>
          <DialogDescription>
            Modifica los detalles de la unidad. Los cambios se guardarán permanentemente.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
             <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Nombre de la Unidad Didáctica</FormLabel>
                    <FormControl>
                        <Input placeholder="Ej: Programación Orientada a Objetos" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                    control={form.control}
                    name="credits"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Créditos</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="Ej: 4" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="theoreticalHours"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Horas Teóricas</FormLabel>
                        <FormControl>
                        <Input type="number" placeholder="Ej: 2" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="practicalHours"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Horas Prácticas</FormLabel>
                        <FormControl>
                        <Input type="number" placeholder="Ej: 4" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
             <FormField
                control={form.control}
                name="numberOfGroups"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Número de Grupos</FormLabel>
                    <FormControl>
                        <Input type="number" min="1" placeholder="1" {...field} />
                    </FormControl>
                    <FormDescription>
                        El total de horas se multiplicará por esta cantidad.
                    </FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
            <div className="rounded-md border bg-muted p-4 text-center">
                <h3 className="text-lg font-medium text-muted-foreground">Total de Horas Calculadas</h3>
                <p className="text-4xl font-bold text-primary">{totalHours}</p>
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
