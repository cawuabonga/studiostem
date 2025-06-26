
"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { addStudyProgram } from '@/config/firebase';

const addProgramSchema = z.object({
  code: z.string().min(1, { message: 'El código del programa es requerido.' }),
  name: z.string().min(3, { message: 'La denominación debe tener al menos 3 caracteres.' }),
});

type AddProgramFormValues = z.infer<typeof addProgramSchema>;

interface AddProgramFormProps {
  onProgramAdded: () => void;
}

export function AddProgramForm({ onProgramAdded }: AddProgramFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);

  const form = useForm<AddProgramFormValues>({
    resolver: zodResolver(addProgramSchema),
    defaultValues: {
      code: '',
      name: '',
    },
  });

  const onSubmit = async (data: AddProgramFormValues) => {
    setLoading(true);
    try {
      await addStudyProgram(data);
      toast({
        title: '¡Éxito!',
        description: 'El programa de estudios ha sido registrado correctamente.',
      });
      form.reset();
      onProgramAdded();
    } catch (error) {
      console.error('Error adding study program:', error);
      toast({
        title: 'Error',
        description: 'No se pudo registrar el programa de estudios. Intenta de nuevo.',
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
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código del Programa (COD-PROGRAMA)</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: PSI-001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Denominación</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Desarrollo de Sistemas de Información" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" className="w-full md:w-auto" disabled={loading}>
          {loading ? 'Registrando...' : 'Registrar Programa'}
        </Button>
      </form>
    </Form>
  );
}
