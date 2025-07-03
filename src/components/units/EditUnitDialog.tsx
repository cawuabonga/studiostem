
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
import type { DidacticUnit, StudyProgram, UnitPeriod, UnitType, Shift } from '@/types';
import { updateDidacticUnit, getStudyPrograms } from '@/config/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


const editUnitSchema = z.object({
  name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  studyProgram: z.string({ required_error: 'Debe seleccionar un programa de estudios.' }),
  period: z.enum(['MAR-JUL', 'AGOS-DIC'], { required_error: 'Debe seleccionar un período.' }),
  module: z.string({ required_error: 'Debe seleccionar un módulo.' }),
  unitType: z.enum(['Específica', 'Empleabilidad'], { required_error: 'Debe seleccionar un tipo de unidad.' }),
  credits: z.coerce.number().min(0, { message: 'Los créditos deben ser un número positivo.' }),
  theoreticalHours: z.coerce.number().min(0, { message: 'Las horas deben ser un número positivo.' }),
  practicalHours: z.coerce.number().min(0, { message: 'Las horas deben ser un número positivo.' }),
  shift: z.enum(['Mañana', 'Tarde', 'Noche']).optional(),
});

type EditUnitFormValues = z.infer<typeof editUnitSchema>;

const moduleOptions = Array.from({ length: 10 }, (_, i) => `Módulo ${String(i + 1).padStart(2, '0')}`);
const periodOptions: UnitPeriod[] = ['MAR-JUL', 'AGOS-DIC'];
const unitTypeOptions: UnitType[] = ['Específica', 'Empleabilidad'];
const shiftOptions: Shift[] = ['Mañana', 'Tarde', 'Noche'];


interface EditUnitDialogProps {
  unit: DidacticUnit;
  isOpen: boolean;
  onClose: (updated?: boolean) => void;
}

export function EditUnitDialog({ unit, isOpen, onClose }: EditUnitDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [studyPrograms, setStudyPrograms] = useState<StudyProgram[]>([]);
  const [programsLoading, setProgramsLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const fetchPrograms = async () => {
      setProgramsLoading(true);
      try {
        const programs = await getStudyPrograms();
        setStudyPrograms(programs);
      } catch (error) {
        console.error("Failed to fetch study programs:", error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los programas de estudio.',
          variant: 'destructive',
        });
      } finally {
        setProgramsLoading(false);
      }
    };
    fetchPrograms();
  }, [isOpen, toast]);

  const form = useForm<EditUnitFormValues>({
    resolver: zodResolver(editUnitSchema),
    defaultValues: {
      name: unit?.name || '',
      studyProgram: unit?.studyProgram || undefined,
      period: unit?.period || undefined,
      module: unit?.module || undefined,
      unitType: unit?.unitType || undefined,
      credits: unit?.credits || 0,
      theoreticalHours: unit?.theoreticalHours || 0,
      practicalHours: unit?.practicalHours || 0,
      shift: unit?.shift || undefined,
    },
  });

  const { reset } = form;

  useEffect(() => {
    if (unit) {
      reset({
        name: unit.name,
        studyProgram: unit.studyProgram,
        period: unit.period,
        module: unit.module,
        unitType: unit.unitType,
        credits: unit.credits,
        theoreticalHours: unit.theoreticalHours,
        practicalHours: unit.practicalHours,
        shift: unit.shift,
      });
    }
  }, [unit, reset, isOpen]);

  const onSubmit = async (data: EditUnitFormValues) => {
    if (!unit?.id) return;
    setIsSubmitting(true);
    try {
      const th = Number(data.theoreticalHours) || 0;
      const ph = Number(data.practicalHours) || 0;
      const totalHours = th + ph;

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
      <DialogContent className="sm:max-w-3xl">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="studyProgram"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Programa de Estudios</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={programsLoading}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder={programsLoading ? "Cargando programas..." : "Seleccione un programa"} />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {studyPrograms.map(program => <SelectItem key={program.id} value={program.name}>{program.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="unitType"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Tipo de Unidad</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Seleccione un tipo" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {unitTypeOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                    control={form.control}
                    name="period"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Período</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Seleccione un período" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {periodOptions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="module"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Módulo</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Seleccione un módulo" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {moduleOptions.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="shift"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Turno</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="No asignado" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {shiftOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
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
            <DialogFooter className="pt-4 sticky bottom-0 bg-background py-4">
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
