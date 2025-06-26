
"use client";

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { addDidacticUnit } from '@/config/firebase';
import { DidacticUnit } from '@/types';

const addUnitSchema = z.object({
  name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  credits: z.coerce.number().min(0, { message: 'Los créditos deben ser un número positivo.' }),
  theoreticalHours: z.coerce.number().min(0, { message: 'Las horas deben ser un número positivo.' }),
  practicalHours: z.coerce.number().min(0, { message: 'Las horas deben ser un número positivo.' }),
  hasGroups: z.boolean().default(false),
});

type AddUnitFormValues = z.infer<typeof addUnitSchema>;

export function AddUnitForm() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [totalHours, setTotalHours] = useState(0);

  const form = useForm<AddUnitFormValues>({
    resolver: zodResolver(addUnitSchema),
    defaultValues: {
      name: '',
      credits: 0,
      theoreticalHours: 0,
      practicalHours: 0,
      hasGroups: false,
    },
  });

  const { watch } = form;
  const theoreticalHours = watch('theoreticalHours');
  const practicalHours = watch('practicalHours');
  const hasGroups = watch('hasGroups');

  useEffect(() => {
    const th = Number(theoreticalHours) || 0;
    const ph = Number(practicalHours) || 0;
    const multiplier = hasGroups ? 2 : 1;
    const total = (th + ph) * multiplier;
    setTotalHours(total);
  }, [theoreticalHours, practicalHours, hasGroups]);

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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          name="hasGroups"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">¿Tiene grupos?</FormLabel>
                <FormDescription>
                  Activa si esta unidad se divide en grupos. Esto duplicará las horas totales.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="rounded-md border bg-muted p-4 text-center">
            <h3 className="text-lg font-medium text-muted-foreground">Total de Horas Calculadas</h3>
            <p className="text-4xl font-bold text-primary">{totalHours}</p>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Registrando...' : 'Registrar Unidad'}
        </Button>
      </form>
    </Form>
  );
}
