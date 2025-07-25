
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

const addIndicatorSchema = z.object({
  name: z.string().min(3, { message: 'El nombre/código debe tener al menos 3 caracteres.' }),
  description: z.string().min(10, { message: 'La descripción debe tener al menos 10 caracteres.' }),
});

type AddIndicatorFormValues = z.infer<typeof addIndicatorSchema>;

interface AddIndicatorFormProps {
  unitId: string;
  onIndicatorAdded: () => void;
}

export function AddIndicatorForm({ unitId, onIndicatorAdded }: AddIndicatorFormProps) {
  const { instituteId } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);

  const form = useForm<AddIndicatorFormValues>({
    resolver: zodResolver(addIndicatorSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const onSubmit = async (data: AddIndicatorFormValues) => {
    if (!instituteId) {
        toast({ title: 'Error', description: 'ID de instituto no encontrado.', variant: 'destructive'});
        return;
    }
    setLoading(true);
    try {
      await addAchievementIndicator(instituteId, unitId, data);
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
            <CardDescription>Define un nuevo indicador para esta unidad didáctica.</CardDescription>
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
