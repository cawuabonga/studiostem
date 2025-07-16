
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
import { useAuth } from '@/contexts/AuthContext';
import { addUnit, getPrograms } from '@/config/firebase';
import type { Program } from '@/types';

const addUnitSchema = z.object({
  name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  code: z.string().min(1, { message: 'El código es requerido.' }),
  credits: z.coerce.number().min(0, { message: 'Los créditos deben ser un número positivo.' }),
  semester: z.coerce.number().min(1, { message: 'El ciclo debe ser al menos 1.' }).max(12, { message: 'El ciclo no puede ser mayor a 12.' }),
  programId: z.string({ required_error: 'Debe seleccionar un programa.' }),
});

type AddUnitFormValues = z.infer<typeof addUnitSchema>;

interface AddUnitFormProps {
  onUnitAdded: () => void;
}

export function AddUnitForm({ onUnitAdded }: AddUnitFormProps) {
  const { toast } = useToast();
  const { instituteId } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [programs, setPrograms] = useState<Program[]>([]);

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
      semester: 1,
    },
  });

  const onSubmit = async (data: AddUnitFormValues) => {
    if (!instituteId) {
        toast({ title: 'Error', description: 'No se ha seleccionado un instituto.', variant: 'destructive'});
        return;
    }
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            name="semester"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Ciclo</FormLabel>
                <FormControl>
                    <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? 'Registrando...' : 'Registrar Unidad'}
        </Button>
      </form>
    </Form>
  );
}
