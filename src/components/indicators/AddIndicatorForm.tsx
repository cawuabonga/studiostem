
"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { addAchievementIndicator } from '@/config/firebase';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Unit } from '@/types';

const addIndicatorSchema = z.object({
  name: z.string().min(3, { message: 'El nombre/código debe tener al menos 3 caracteres.' }),
  description: z.string().min(10, { message: 'La descripción debe tener al menos 10 caracteres.' }),
  startWeek: z.coerce.number().min(1, 'La semana de inicio debe ser al menos 1.'),
  endWeek: z.coerce.number().min(1, 'La semana final debe ser al menos 1.'),
}).refine(data => data.endWeek >= data.startWeek, {
    message: 'La semana final debe ser mayor o igual a la semana de inicio.',
    path: ['endWeek'],
});

type AddIndicatorFormValues = z.infer<typeof addIndicatorSchema>;

interface AddIndicatorFormProps {
  unit: Unit;
  onIndicatorAdded: () => void;
}

export function AddIndicatorForm({ unit, onIndicatorAdded }: AddIndicatorFormProps) {
  const { instituteId } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);

  const form = useForm<AddIndicatorFormValues>({
    resolver: zodResolver(addIndicatorSchema),
    defaultValues: {
      name: '',
      description: '',
      startWeek: 1,
      endWeek: 1,
    },
  });

  const onSubmit = async (data: AddIndicatorFormValues) => {
    if (!instituteId) {
        toast({ title: 'Error', description: 'ID de instituto no encontrado.', variant: 'destructive'});
        return;
    }
     if (data.endWeek > (unit.totalWeeks || 16)) { // Default to 16 if not set
        form.setError('endWeek', {
            type: 'manual',
            message: `La semana final no puede exceder el total de semanas de la unidad (${unit.totalWeeks || 16}).`
        });
        return;
    }

    setLoading(true);
    try {
      await addAchievementIndicator(instituteId, unit.id, data);
      toast({
        title: '¡Éxito!',
        description: 'El indicador de logro ha sido añadido.',
      });
      form.reset();
      onIndicatorAdded();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo añadir el indicador.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
        <CardHeader>
            <CardTitle>Añadir Nuevo Indicador de Logro</CardTitle>
            <CardDescription>Define un nuevo indicador para esta unidad didáctica y el rango de semanas que abarca.</CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Nombre o Código del Indicador</FormLabel>
                    <FormControl>
                        <Input placeholder="Ej: Indicador 1.1" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Descripción del Indicador</FormLabel>
                    <FormControl>
                        <Textarea
                        placeholder="Describe qué debe ser capaz de hacer o demostrar el estudiante..."
                        {...field}
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="startWeek"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Semana de Inicio</FormLabel>
                            <FormControl>
                                <Input type="number" min="1" max={unit.totalWeeks || 16} {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="endWeek"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Semana Final</FormLabel>
                            <FormControl>
                                <Input type="number" min="1" max={unit.totalWeeks || 16} {...field} />
                            </FormControl>
                             <FormMessage />
                            </FormItem>
                        )}
                    />
                 </div>
                <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? 'Añadiendo...' : 'Añadir Indicador'}
                </Button>
            </form>
            </Form>
        </CardContent>
    </Card>
  );
}
