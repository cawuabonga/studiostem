"use client";

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { addDidacticUnit, getStudyPrograms } from '@/config/firebase';
import type { DidacticUnit, StudyProgram, UnitPeriod } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const addUnitSchema = z.object({
  name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  studyProgram: z.string({ required_error: 'Debe seleccionar un programa de estudios.' }),
  period: z.enum(['MAR-JUL', 'AGOS-DIC'], { required_error: 'Debe seleccionar un período.' }),
  module: z.string({ required_error: 'Debe seleccionar un módulo.' }),
  credits: z.coerce.number().min(0, { message: 'Los créditos deben ser un número positivo.' }),
  theoreticalHours: z.coerce.number().min(0, { message: 'Las horas deben ser un número positivo.' }),
  practicalHours: z.coerce.number().min(0, { message: 'Las horas deben ser un número positivo.' }),
  numberOfGroups: z.coerce.number().min(1, { message: 'Debe haber al menos 1 grupo.' }).default(1),
});

type AddUnitFormValues = z.infer<typeof addUnitSchema>;

const moduleOptions = Array.from({ length: 10 }, (_, i) => `Módulo ${String(i + 1).padStart(2, '0')}`);
const periodOptions: UnitPeriod[] = ['MAR-JUL', 'AGOS-DIC'];

interface AddUnitFormProps {
  onUnitAdded: () => void;
}

export function AddUnitForm({ onUnitAdded }: AddUnitFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [totalHours, setTotalHours] = useState(0);
  const [studyPrograms, setStudyPrograms] = useState<StudyProgram[]>([]);
  const [programsLoading, setProgramsLoading] = useState(true);

  useEffect(() => {
    const fetchPrograms = async () => {
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
  }, [toast]);

  const form = useForm<AddUnitFormValues>({
    resolver: zodResolver(addUnitSchema),
    defaultValues: {
      name: '',
      credits: 0,
      theoreticalHours: 0,
      practicalHours: 0,
      numberOfGroups: 1,
    },
  });

  const { watch } = form;
  const theoreticalHours = watch('theoreticalHours');
  const practicalHours = watch('practicalHours');
  const numberOfGroups = watch('numberOfGroups');

  useEffect(() => {
    const th = Number(theoreticalHours) || 0;
    const ph = Number(practicalHours) || 0;
    const multiplier = Number(numberOfGroups) || 1;
    const total = (th + ph) * multiplier;
    setTotalHours(total);
  }, [theoreticalHours, practicalHours, numberOfGroups]);

  const onSubmit = async (data: AddUnitFormValues) => {
    setLoading(true);
    const unitData: Omit<DidacticUnit, 'id'> = {
      ...data,
      totalHours: totalHours,
    };

    try {
      await addDidacticUnit(unitData);
      toast({
        title: '¡Éxito!',
        description: 'La unidad didáctica ha sido registrada correctamente.',
      });
      form.reset();
      onUnitAdded();
    } catch (error) {
      console.error('Error adding didactic unit:', error);
      toast({
        title: 'Error',
        description: 'No se pudo registrar la unidad didáctica. Intenta de nuevo.',
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
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
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
            <div className="rounded-md border bg-muted p-3 text-center">
                <h3 className="text-sm font-medium text-muted-foreground">Total de Horas Calculadas</h3>
                <p className="text-3xl font-bold text-primary">{totalHours}</p>
            </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Registrando...' : 'Registrar Unidad'}
        </Button>
      </form>
    </Form>
  );
}
