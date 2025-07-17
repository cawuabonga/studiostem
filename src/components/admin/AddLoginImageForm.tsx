
"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { uploadLoginImage } from '@/config/firebase';
import { Loader2 } from 'lucide-react';

const addImageSchema = z.object({
  name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  image: z.instanceof(FileList).refine(files => files?.length === 1, 'Se requiere una imagen.'),
});

type AddImageFormValues = z.infer<typeof addImageSchema>;

interface AddLoginImageFormProps {
  onImageUploaded: () => void;
}

export function AddLoginImageForm({ onImageUploaded }: AddLoginImageFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<AddImageFormValues>({
    resolver: zodResolver(addImageSchema),
    defaultValues: {
      name: '',
      image: undefined,
    },
  });

  const onSubmit = async (data: AddImageFormValues) => {
    setLoading(true);
    const imageFile = data.image[0];
    try {
      await uploadLoginImage(imageFile, data.name);
      toast({
        title: '¡Éxito!',
        description: 'La imagen ha sido subida correctamente.',
      });
      form.reset();
      onImageUploaded();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo subir la imagen.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de la Imagen</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Anuncio Principal" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="image"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Archivo de Imagen</FormLabel>
              <FormControl>
                <Input type="file" accept="image/*" {...form.register('image')} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={loading} className="w-full">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? 'Subiendo...' : 'Subir Imagen'}
        </Button>
      </form>
    </Form>
  );
}
