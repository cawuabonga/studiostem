
"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { addLoginImageURL } from '@/config/firebase';

const addImageSchema = z.object({
  imageUrl: z.string().url({ message: 'Por favor, ingresa una URL válida.' }).min(1, { message: 'La URL no puede estar vacía.' }),
});

type AddImageFormValues = z.infer<typeof addImageSchema>;

interface AddLoginImageFormProps {
  onImageAdded: () => void;
}

export function AddLoginImageForm({ onImageAdded }: AddLoginImageFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);

  const form = useForm<AddImageFormValues>({
    resolver: zodResolver(addImageSchema),
    defaultValues: {
      imageUrl: '',
    },
  });

  const onSubmit = async (data: AddImageFormValues) => {
    setLoading(true);
    try {
      await addLoginImageURL(data.imageUrl);
      toast({
        title: '¡Éxito!',
        description: 'La URL de la imagen se ha guardado correctamente.',
      });
      form.reset();
      onImageAdded(); // Trigger refresh on parent
    } catch (error) {
      console.error('Error adding image URL:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar la URL de la imagen. Por favor, intenta de nuevo.',
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
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar Imagen'}
        </Button>
      </form>
    </Form>
  );
}
