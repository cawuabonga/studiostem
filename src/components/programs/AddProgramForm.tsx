
"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { addProgram } from '@/config/firebase';

const addProgramSchema = z.object({
  name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  code: z.string().min(1, { message: 'El código es requerido.' }),
  resolution: z.string().min(1, { message: 'La resolución es requerida.' }),
  duration: z.string().min(1, { message: 'La duración es requerida (ej: 6 Semestres).' }),
});

type AddProgramFormValues = z.infer<typeof addProgramSchema>;

interface AddProgramFormProps {
  onProgramAdded: () => void;
}

export function AddProgramForm({ onProgramAdded }: AddProgramFormProps) {
  const { toast } = useToast();
  const { instituteId } = useAuth();
  const [loading, setLoading] = React.useState(false);

  const form = useForm<AddProgramFormValues>({
    resolver: zodResolver(addProgramSchema),
    defaultValues: {
      name: '',
      code: '',
      resolution: '',
      duration: '',
    },
  });

  const onSubmit = async (data: AddProgramFormValues) => {
    if (!instituteId) {
        toast({ title: 'Error', description: 'No se ha seleccionado un instituto.', variant: 'destructive'});
        return;
    }
    setLoading(true);
    try {
      await addProgram(instituteId, data);
      toast({
        title: '¡Éxito!',
        description: 'El programa de estudio ha sido registrado.',
      });
      form.reset();
      onProgramAdded();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo registrar el programa.',
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
                <FormLabel>Nombre del Programa</FormLabel>
                <FormControl>
                    <Input placeholder="Ej: Enfermería Técnica" {...field} />
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
                    <Input placeholder="Ej: ET01" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <FormField
            control={form.control}
            name="resolution"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Resolución</FormLabel>
                <FormControl>
                    <Input placeholder="Ej: RD N° 123-2023" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
             <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Duración</FormLabel>
                <FormControl>
                    <Input placeholder="Ej: 6 Semestres" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? 'Registrando...' : 'Registrar Programa'}
        </Button>
      </form>
    </Form>
  );
}
