
"use client";

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { getLoginPageImageURL, setLoginPageImageURL } from '@/config/firebase';

const updateImageSchema = z.object({
  imageUrl: z.string().url({ message: 'Por favor, ingresa una URL válida.' }).min(1, { message: 'La URL de la imagen no puede estar vacía.' }),
});

type UpdateImageFormValues = z.infer<typeof updateImageSchema>;

export function UpdateLoginImageForm() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [fetchingCurrent, setFetchingCurrent] = React.useState(true);

  const form = useForm<UpdateImageFormValues>({
    resolver: zodResolver(updateImageSchema),
    defaultValues: {
      imageUrl: '',
    },
  });

  useEffect(() => {
    async function fetchCurrentImageUrl() {
      setFetchingCurrent(true);
      try {
        const currentUrl = await getLoginPageImageURL();
        if (currentUrl) {
          form.setValue('imageUrl', currentUrl);
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'No se pudo obtener la URL de la imagen actual.',
          variant: 'destructive',
        });
      } finally {
        setFetchingCurrent(false);
      }
    }
    fetchCurrentImageUrl();
  }, [form, toast]);

  const onSubmit = async (data: UpdateImageFormValues) => {
    setLoading(true);
    try {
      await setLoginPageImageURL(data.imageUrl);
      toast({
        title: '¡Éxito!',
        description: 'La URL de la imagen de inicio de sesión se actualizó correctamente.',
      });
    } catch (error) {
      console.error('Error updating image URL:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la URL de la imagen. Por favor, intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetchingCurrent) {
    return <p>Cargando configuración actual de la imagen...</p>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL de la Imagen</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://ejemplo.com/imagen.png"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={loading || fetchingCurrent}>
          {loading ? 'Actualizando...' : 'Actualizar URL de la Imagen'}
        </Button>
      </form>
    </Form>
  );
}
