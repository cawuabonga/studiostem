
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Unit, Program } from '@/types';
import { updateUnit, getPrograms } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';

const editUnitSchema = z.object({
  name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  code: z.string().min(1, { message: 'El código es requerido.' }),
  credits: z.coerce.number().min(0, { message: 'Los créditos deben ser un número positivo.' }),
  semester: z.coerce.number().min(1, { message: 'El ciclo debe ser al menos 1.' }).max(12, { message: 'El ciclo no puede ser mayor a 12.' }),
  programId: z.string({ required_error: 'Debe seleccionar un programa.' }),
});

type EditUnitFormValues = z.infer<typeof editUnitSchema>;

interface EditUnitDialogProps {
  unit: Unit;
  isOpen: boolean;
  onClose: (updated?: boolean) => void;
}

export function EditUnitDialog({ unit, isOpen, onClose }: EditUnitDialogProps) {
  const { toast } = useToast();
  const { instituteId } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [programs, setPrograms] = useState<Program[]>([]);

   useEffect(() => {
    if (instituteId && isOpen) {
      getPrograms(instituteId).then(setPrograms).catch(console.error);
    }
  }, [instituteId, isOpen]);

  const form = useForm<EditUnitFormValues>({
    resolver: zodResolver(editUnitSchema),
    defaultValues: { ...unit },
  });

  useEffect(() => {
    if (unit) {
      form.reset(unit);
    }
  }, [unit, form, isOpen]);

  const onSubmit = async (data: EditUnitFormValues) => {
    if (!instituteId) {
        toast({ title: 'Error', description: 'ID de instituto no encontrado.', variant: 'destructive'});
        return;
    }
    setIsSubmitting(true);
    try {
      await updateUnit(instituteId, unit.id, data);
      toast({
        title: '¡Éxito!',
        description: 'La información de la unidad ha sido actualizada.',
      });
      onClose(true); 
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la unidad.',
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
          <DialogTitle>Editar Unidad Didáctica</DialogTitle>
          <DialogDescription>
            Realiza cambios en la información de la unidad.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
             <FormField
                control={form.control}
                name="programId"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Programa de Estudio</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                        <SelectTrigger>
                        <SelectValue placeholder="Seleccione un programa" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {programs.map((program) => (
                        <SelectItem key={program.id} value={program.id}>
                            {program.name}
                        </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Nombre</FormLabel>
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
                name="credits"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Créditos</FormLabel>
                    <FormControl>
                        <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="semester"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Ciclo</FormLabel>
                    <FormControl>
                        <Input type="number" {...field} />
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
