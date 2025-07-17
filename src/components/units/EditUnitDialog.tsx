
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
import type { Unit, Program, ProgramModule, UnitPeriod, UnitType } from '@/types';
import { updateUnit, getPrograms } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';

const periods: UnitPeriod[] = ['MAR-JUL', 'AGO-DIC'];
const unitTypes: UnitType[] = ['Empleabilidad', 'Especifica'];

const editUnitSchema = z.object({
  programId: z.string({ required_error: 'Debe seleccionar un programa.' }),
  moduleId: z.string({ required_error: 'Debe seleccionar un módulo.' }),
  name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  credits: z.coerce.number().min(0, { message: 'Los créditos deben ser un número positivo.' }),
  theoreticalHours: z.coerce.number().min(0, { message: 'Las horas deben ser un número positivo.' }),
  practicalHours: z.coerce.number().min(0, { message: 'Las horas deben ser un número positivo.' }),
  totalHours: z.coerce.number(),
  period: z.enum(periods, { required_error: 'Debe seleccionar un período.' }),
  unitType: z.enum(unitTypes, { required_error: 'Debe seleccionar un tipo de unidad.' }),
  code: z.string().min(1, { message: 'El código es requerido.' }),
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
  const [modules, setModules] = useState<ProgramModule[]>([]);

  const form = useForm<EditUnitFormValues>({
    resolver: zodResolver(editUnitSchema),
    defaultValues: { ...unit },
  });
  
  const selectedProgramId = form.watch('programId');
  const theoreticalHours = form.watch('theoreticalHours');
  const practicalHours = form.watch('practicalHours');

   useEffect(() => {
    if (instituteId && isOpen) {
      getPrograms(instituteId).then(p => {
        setPrograms(p);
        const selectedProgram = p.find(prog => prog.id === unit.programId);
        setModules(selectedProgram?.modules || []);
      }).catch(console.error);
    }
  }, [instituteId, isOpen, unit.programId]);


  useEffect(() => {
    if (unit) {
      form.reset(unit);
    }
  }, [unit, form, isOpen]);

  useEffect(() => {
    if (selectedProgramId) {
      const selectedProgram = programs.find(p => p.id === selectedProgramId);
      setModules(selectedProgram?.modules || []);
      // Do not reset module selection if the program ID hasn't changed from the initial one
      if (selectedProgramId !== unit.programId) {
        form.setValue('moduleId', '');
      }
    } else {
      setModules([]);
    }
  }, [selectedProgramId, programs, form, unit.programId]);
  
  useEffect(() => {
    const total = (Number(theoreticalHours) || 0) + (Number(practicalHours) || 0);
    form.setValue('totalHours', total);
  }, [theoreticalHours, practicalHours, form]);

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
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <FormField
                    control={form.control}
                    name="moduleId"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Módulo</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!modules.length}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Seleccione un módulo" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {modules.map((module) => (
                            <SelectItem key={module.code} value={module.code}>
                                {module.name} ({module.code})
                            </SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
            <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Nombre de la Unidad</FormLabel>
                    <FormControl>
                        <Input {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    name="period"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Período</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger><SelectValue placeholder="Seleccione período" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {periods.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
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
                name="theoreticalHours"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Horas Teóricas</FormLabel>
                    <FormControl>
                        <Input type="number" {...field} />
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
                        <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                    control={form.control}
                    name="totalHours"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Total de Horas</FormLabel>
                        <FormControl>
                            <Input type="number" {...field} disabled />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
             <FormField
                control={form.control}
                name="unitType"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Tipo de Unidad</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger><SelectValue placeholder="Seleccione tipo" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {unitTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
            />
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
