
"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { addLoginImage } from '@/config/firebase';
import Image from 'next/image';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const addImageSchema = z.object({
  image: z
    .any()
    .refine((files) => files?.length === 1, "Debes seleccionar una imagen.")
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `El tamaño máximo del archivo es 5MB.`)
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      "Solo se aceptan archivos .jpg, .jpeg, .png y .webp."
    ),
});

type AddImageFormValues = z.infer<typeof addImageSchema>;

interface AddLoginImageFormProps {
  onImageAdded: () => void;
}

export function AddLoginImageForm({ onImageAdded }: AddLoginImageFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const form = useForm<AddImageFormValues>({
    resolver: zodResolver(addImageSchema),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue('image', e.target.files);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const onSubmit = async () => {
    if (!preview) {
        toast({
            title: 'Error',
            description: 'No se ha seleccionado ninguna imagen para subir.',
            variant: 'destructive',
        });
        return;
    }
    
    setLoading(true);
    try {
      await addLoginImage(preview);
      toast({
        title: '¡Éxito!',
        description: 'La imagen se ha guardado correctamente.',
      });
      form.reset();
      setPreview(null);
      onImageAdded(); // Trigger refresh on parent
    } catch (error) {
      console.error('Error adding image:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar la imagen. Por favor, intenta de nuevo.',
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
          name="image"
          render={() => (
            <FormItem>
              <FormLabel>Subir Imagen</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleFileChange}
                  disabled={loading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {preview && (
            <div className="mt-4">
                <FormLabel>Vista Previa</FormLabel>
                <div className="relative w-full max-w-sm h-64 mt-2 border rounded-md overflow-hidden">
                    <Image src={preview} alt="Vista previa de la imagen" layout="fill" objectFit="contain" />
                </div>
            </div>
        )}

        <Button type="submit" disabled={loading || !preview}>
          {loading ? 'Guardando...' : 'Guardar Imagen'}
        </Button>
      </form>
    </Form>
  );
}
