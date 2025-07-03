
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
import type { DidacticUnit, StudyProgram, UnitPeriod, UnitType, Shift } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Separator } from '../ui/separator';

const addUnitSchema = z.object({
  name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  studyProgram: z.string({ required_error: 'Debe seleccionar un programa de estudios.' }),
  period: z.enum(['MAR-JUL', 'AGOS-DIC'], { required_error: 'Debe seleccionar un período.' }),
  module: z.string({ required_error: 'Debe seleccionar un módulo.' }),
  unitType: z.enum(['Específica', 'Empleabilidad'], { required_error: 'Debe seleccionar un tipo de unidad.' }),
  credits: z.coerce.number().min(0, { message: 'Los créditos deben ser un número positivo.' }),
  theoreticalHours: z.coerce.number().min(0, { message: 'Las horas deben ser un número positivo.' }),
  practicalHours: z.coerce.number().min(0, { message: 'Las horas deben ser un número positivo.' }),
  shifts: z.array(z.string()).refine((value) => value.length > 0, {
    message: "Debe seleccionar al menos un turno.",
  }),
});

type AddUnitFormValues = z.infer<typeof addUnitSchema>;

const moduleOptions = Array.from({ length: 10 }, (_, i) => `Módulo ${String(i + 1).padStart(2, '0')}`);
const periodOptions: UnitPeriod[] = ['MAR-JUL', 'AGOS-DIC'];
const unitTypeOptions: UnitType[] = ['Específica', 'Empleabilidad'];
const shiftOptions: Shift[] = ['Mañana', 'Tarde', 'Noche'];

interface AddUnitFormProps {
  onUnitAdded: () => void;
}

export function AddUnitForm({ onUnitAdded }: AddUnitFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
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
      shifts: [],
    },
  });

  const onSubmit = async (data: AddUnitFormValues) => {
    setLoading(true);
    const th = Number(data.theoreticalHours) || 0;
    const ph = Number(data.practicalHours) || 0;
    
    const baseUnitData: Omit<DidacticUnit, 'id' | 'shift'> = {
      name: data.name,
      studyProgram: data.studyProgram,
      period: data.period,
      module: data.module,
      credits: data.credits,
      theoreticalHours: th,
      practicalHours: ph,
      totalHours: th + ph,
      unitType: data.unitType,
    };

    try {
      const creationPromises = data.shifts.map(shift => {
        const unitDataForShift: Omit<DidacticUnit, 'id'> = {
            ...baseUnitData,
            shift: shift as Shift,
        };
        return addDidacticUnit(unitDataForShift);
      });
      
      await Promise.all(creationPromises);

      toast({
        title: '¡Éxito!',
        description: `Se han registrado ${data.shifts.length} unidad(es) didáctica(s) para los turnos seleccionados.`,
      });
      form.reset();
      onUnitAdded();
    } catch (error) {
      console.error('Error adding didactic unit(s):', error);
      toast({
        title: 'Error',
        description: 'No se pudieron registrar las unidades didácticas. Intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

        <Separator className="my-6" />

        <FormField
          control={form.control}
          name="shifts"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel>Turnos/Grupos a Crear</FormLabel>
                <FormDescription>
                  Seleccione uno o más turnos. Se creará una unidad didáctica separada para cada turno.
                </FormDescription>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {shiftOptions.map((item) => (
                  <FormField
                    key={item}
                    control={form.control}
                    name="shifts"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={item}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(item)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...(field.value || []), item])
                                  : field.onChange(
                                      (field.value || []).filter(
                                        (value) => value !== item
                                      )
                                    )
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {item}
                          </FormLabel>
                        </FormItem>
                      )
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Separator className="my-6" />
        
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
        <Button type="submit" className="w-full md:w-auto" disabled={loading}>
          {loading ? 'Registrando...' : 'Registrar Unidad(es)'}
        </Button>
      </form>
    </Form>
  );
}
