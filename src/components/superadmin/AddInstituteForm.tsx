

"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { addInstitute } from '@/config/firebase';
import { hexToHsl } from '@/lib/utils';

const addInstituteSchema = z.object({
  id: z.string().min(3, { message: 'El ID debe tener al menos 3 caracteres.' }).regex(/^[a-z0-9-]+$/, 'El ID solo puede contener letras minúsculas, números y guiones.'),
  name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  logoUrl: z.string().url({ message: 'Debe ser una URL válida.' }).optional().or(z.literal('')),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, { message: 'Debe ser un color hexadecimal válido.' }).optional().or(z.literal('')),
});

type AddInstituteFormValues = z.infer<typeof addInstituteSchema>;

interface AddInstituteFormProps {
  onInstituteAdded: () => void;
}

export function AddInstituteForm({ onInstituteAdded }: AddInstituteFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);

  const form = useForm<AddInstituteFormValues>({
    resolver: zodResolver(addInstituteSchema),
    defaultValues: {
      id: '',
      name: '',
      logoUrl: '',
      primaryColor: '#1E3A8A', // Default color in HEX
    },
  });

  const onSubmit = async (data: AddInstituteFormValues) => {
    setLoading(true);
    try {
      const instituteData = {
        name: data.name,
        ...(data.logoUrl && { logoUrl: data.logoUrl }),
        ...(data.primaryColor && { primaryColor: hexToHsl(data.primaryColor) }),
      };
      await addInstitute(data.id, instituteData);
      // toast({
      //   title: '¡Éxito!',
      //   description: 'El instituto ha sido registrado correctamente.',
      // });
      form.reset();
      onInstituteAdded();
    } catch (error: any) {
      console.error('Error adding institute:', error);
      let description = 'No se pudo registrar el instituto. Intenta de nuevo.';
      if (error.message.includes('permission-denied')) {
        description = 'Permiso denegado. Asegúrate de tener rol de SuperAdmin.';
      } else if (error.message.includes('already exists')) {
        description = 'Un instituto con este ID ya existe. Por favor, elige otro.';
      }
      // toast({
      //   title: 'Error',
      //   description,
      //   variant: 'destructive',
      // });
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
                <FormLabel>Nombre del Instituto</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Instituto Superior ABC" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ID Único del Instituto</FormLabel>
                <FormControl>
                  <Input placeholder="ej: instituto-abc" {...field} />
                </FormControl>
                <FormDescription>
                  Este ID es permanente y se usa en la URL.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="logoUrl"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>URL del Logo</FormLabel>
                    <FormControl>
                    <Input placeholder="https://ejemplo.com/logo.png" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="primaryColor"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Color Primario</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Input type="color" className="p-1 h-10 w-14" {...field} />
                        <Input type="text" className="h-10 flex-1" value={field.value} onChange={field.onChange} />
                      </div>
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>
        <Button type="submit" className="w-full md:w-auto" disabled={loading}>
          {loading ? 'Registrando...' : 'Registrar Instituto'}
        </Button>
      </form>
    </Form>
  );
}
