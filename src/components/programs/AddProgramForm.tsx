
"use client";

import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { addProgram } from '@/config/firebase';
import { Separator } from '../ui/separator';

const addProgramSchema = z.object({
  name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  code: z.string().min(1, { message: 'El código es requerido.' }),
  abbreviation: z.string().min(1, { message: 'La abreviación es requerida.' }),
  duration: z.string().min(1, { message: 'La duración es requerida (ej: 6 Semestres).' }),
  moduleCount: z.coerce.number().min(1, 'Debe haber al menos 1 módulo.').max(10, 'No puede haber más de 10 módulos.'),
  modules: z.array(z.object({ 
    name: z.string().min(1, 'El nombre del módulo es requerido.'),
    code: z.string(), // El código se genera automáticamente
  })),
});

type AddProgramFormValues = z.infer<typeof addProgramSchema>;

interface AddProgramFormProps {
  instituteId: string;
  onProgramAdded: () => void;
}

export function AddProgramForm({ instituteId, onProgramAdded }: AddProgramFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);

  const form = useForm<AddProgramFormValues>({
    resolver: zodResolver(addProgramSchema),
    defaultValues: {
      name: '',
      code: '',
      abbreviation: '',
      duration: '',
      moduleCount: 1,
      modules: [{ name: '', code: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "modules"
  });

  const moduleCount = form.watch('moduleCount');
  const programAbbreviation = form.watch('abbreviation');

  React.useEffect(() => {
    const currentCount = fields.length;
    if (moduleCount > currentCount) {
      for (let i = currentCount; i < moduleCount; i++) {
        const newCode = `MODULO ${i + 1} - ${programAbbreviation || ''}`.trim();
        append({ name: '', code: newCode });
      }
    } else if (moduleCount < currentCount) {
      for (let i = currentCount; i > moduleCount; i--) {
        remove(i - 1);
      }
    }
  }, [moduleCount, fields, append, remove, programAbbreviation]);

  React.useEffect(() => {
    fields.forEach((_, index) => {
        const newCode = `MODULO ${index + 1} - ${programAbbreviation || ''}`.trim();
        const currentCode = form.getValues(`modules.${index}.code`);
        if (newCode !== currentCode) {
            form.setValue(`modules.${index}.code`, newCode);
        }
    });
  }, [programAbbreviation, fields, form]);


  const onSubmit = async (data: AddProgramFormValues) => {
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
            name="abbreviation"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Abreviación</FormLabel>
                <FormControl>
                    <Input placeholder="Ej: ET" {...field} />
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

        <Separator className="my-6" />
        
        <h3 className="text-lg font-medium">Módulos del Programa</h3>
        
        <FormField
          control={form.control}
          name="moduleCount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cantidad de Módulos</FormLabel>
              <FormControl>
                <Input type="number" min="1" max="10" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-md">
                 <FormField
                    control={form.control}
                    name={`modules.${index}.name`}
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Nombre del Módulo {index + 1}</FormLabel>
                        <FormControl>
                            <Input placeholder={`Ej: Módulo de Atención Primaria`} {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                 <FormField
                    control={form.control}
                    name={`modules.${index}.code`}
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Código del Módulo</FormLabel>
                        <FormControl>
                            <Input {...field} disabled />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
            </div>
          ))}
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? 'Registrando...' : 'Registrar Programa'}
        </Button>
      </form>
    </Form>
  );
}
