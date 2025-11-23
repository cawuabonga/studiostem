
"use client";

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { saveLoginDesignSettings, getLoginDesignSettings } from '@/config/firebase';
import type { LoginDesign } from '@/types';
import { Skeleton } from '../ui/skeleton';

const designSchema = z.object({
  imageUrl: z.string().url({ message: "Debe ser una URL válida." }).or(z.literal('')),
  backgroundColor: z.string().min(1, "El color de fondo es requerido."),
  textColor: z.string().min(1, "El color de texto es requerido."),
  layout: z.enum(['side', 'center'], { required_error: 'Debe seleccionar un diseño.' }),
});

type DesignFormValues = z.infer<typeof designSchema>;

interface LoginDesignFormProps {
  onSettingsSaved: () => void;
}

export function LoginDesignForm({ onSettingsSaved }: LoginDesignFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);

  const form = useForm<DesignFormValues>({
    resolver: zodResolver(designSchema),
    defaultValues: {
      imageUrl: '',
      backgroundColor: '#D5DAE8', // Default from globals.css
      textColor: '#334155', // Default from globals.css
      layout: 'side',
    },
  });

  useEffect(() => {
    const fetchSettings = async () => {
      setLoadingInitial(true);
      try {
        const settings = await getLoginDesignSettings();
        if (settings) {
          form.reset(settings);
        }
      } catch (error) {
        toast({ title: "Error", description: "No se pudieron cargar las configuraciones de diseño existentes.", variant: "destructive" });
      } finally {
        setLoadingInitial(false);
      }
    };
    fetchSettings();
  }, [form, toast]);


  const onSubmit = async (data: DesignFormValues) => {
    setLoading(true);
    try {
      await saveLoginDesignSettings(data);
      toast({
        title: '¡Éxito!',
        description: 'La configuración de diseño del login ha sido guardada.',
      });
      onSettingsSaved();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'No se pudo guardar la configuración.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingInitial) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-1/3" />
        </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL de la Imagen Principal</FormLabel>
              <FormControl>
                <Input placeholder="https://ejemplo.com/imagen.png" {...field} />
              </FormControl>
              <FormDescription>Esta imagen aparecerá en la página de inicio de sesión. Déjelo en blanco si no desea una imagen.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="backgroundColor"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Color de Fondo</FormLabel>
                <FormControl>
                    <Input type="color" {...field} />
                </FormControl>
                <FormDescription>Color de fondo general de la página.</FormDescription>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="textColor"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Color del Texto</FormLabel>
                <FormControl>
                    <Input type="color" {...field} />
                </FormControl>
                <FormDescription>Color para títulos y texto principal.</FormDescription>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <FormField
          control={form.control}
          name="layout"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estructura de la Página</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un diseño" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="side">Imagen a un lado</SelectItem>
                  <SelectItem value="center">Contenido centrado</SelectItem>
                </SelectContent>
              </Select>
               <FormDescription>Cambia la disposición de la imagen y el formulario de login.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar Diseño'}
        </Button>
      </form>
    </Form>
  );
}
