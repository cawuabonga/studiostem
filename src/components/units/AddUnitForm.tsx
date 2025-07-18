
"use client";

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { addUnit, getPrograms } from '@/config/firebase';
import type { Program, ProgramModule, UnitPeriod, UnitType } from '@/types';

const periods: UnitPeriod[] = ['MAR-JUL', 'AGO-DIC'];
const unitTypes: UnitType[] = ['Empleabilidad', 'Especifica'];

const addUnitSchema = z.object({
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

type AddUnitFormValues = z.infer<typeof addUnitSchema>;

interface AddUnitFormProps {
  instituteId: string;
  onUnitAdded: () => void;
}

export function AddUnitForm({ instituteId, onUnitAdded }: AddUnitFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [modules, setModules] = useState<ProgramModule[]>([]);

  useEffect(() => {
    if (instituteId) {
      getPrograms(instituteId).then(setPrograms).catch(console.error);
    }
  }, [instituteId]);

  const form = useForm<AddUnitFormValues>({
    resolver: zodResolver(addUnitSchema),
    defaultValues: {
      name: '',
      code: '',
      credits: 0,
      theoreticalHours: 0,
      practicalHours: 0,
      totalHours: 0,
    },
  });

  const selectedProgramId = form.watch('programId');
  const theoreticalHours = form.watch('theoreticalHours');
  const practicalHours = form.watch('practicalHours');

  useEffect(() => {
    if (selectedProgramId) {
      const selectedProgram = programs.find(p => p.id === selectedProgramId);
      setModules(selectedProgram?.modules || []);
      form.setValue('moduleId', ''); // Reset module when program changes
    } else {
      setModules([]);
    }
  }, [selectedProgramId, programs, form]);

  useEffect(() => {
    const total = (Number(theoreticalHours) || 0) + (Number(practicalHours) || 0);
    form.setValue('totalHours', total);
  }, [theoreticalHours, practicalHours, form]);

  const onSubmit = async (data: AddUnitFormValues) => {
    setLoading(true);
    try {
      await addUnit(instituteId, data);
      toast({
        title: '¡Éxito!',
        description: 'La unidad didáctica ha sido registrada.',
      });
      form.reset();
      onUnitAdded();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo registrar la unidad.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    <Input placeholder="Ej: Comunicación Efectiva" {...field} />
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
                    <Input placeholder="Ej: CE-101" {...field} />
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

        <Button type="submit" disabled={loading}>
          {loading ? 'Registrando...' : 'Registrar Unidad'}
        </Button>
      </form>
    </Form>
  );
}
