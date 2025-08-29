
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

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const addImageSchema = z.object({
  name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  image: z.instanceof(FileList)
    .refine(files => files?.length === 1, 'Se requiere una imagen.')
    .refine(files => files?.[0]?.size <= MAX_FILE_SIZE, `El tamaño máximo es de 5MB.`)
    .refine(
      files => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      "Solo se aceptan formatos .jpg, .jpeg, .png y .webp."
    ),
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
       const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement | null;
      if (fileInput) {
        fileInput.value = '';
      }
      onImageUploaded();
    } catch (error: any) {
       console.error("Upload error:", error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo subir la imagen. Puede que sea demasiado grande.',
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
                <Input placeholder="Ej: Anuncio Principal" {...field} disabled={loading} />
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
                <Input 
                  type="file" 
                  accept="image/*" 
                  {...form.register('image')} 
                  disabled={loading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={loading} className="w-full">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? 'Procesando imagen...' : 'Subir Imagen'}
        </Button>
      </form>
    </Form>
  );
}
