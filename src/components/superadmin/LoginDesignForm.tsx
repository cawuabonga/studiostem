

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
import { Textarea } from '../ui/textarea';

const designSchema = z.object({
  title: z.string().optional(),
  slogan: z.string().optional(),
  textAlign: z.enum(['left', 'center', 'right']).optional(),
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
      title: 'SISTEMA TECNOLÓGICO DE EDUCACIÓN MODULAR',
      slogan: 'Una nueva forma de gestionar la educación.',
      textAlign: 'left',
      imageUrl: '',
      backgroundColor: '#1c3d5a',
      textColor: '#ffffff',
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
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título Principal</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormDescription>El título principal que se muestra en el panel de la imagen.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="slogan"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Eslogan / Subtítulo</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="textAlign"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Alineación del Texto</FormLabel>
               <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione una alineación" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="left">Izquierda</SelectItem>
                  <SelectItem value="center">Centro</SelectItem>
                  <SelectItem value="right">Derecha</SelectItem>
                </SelectContent>
              </Select>
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
                <FormDescription>Color del panel de la imagen.</FormDescription>
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
                <FormDescription>Color para títulos y subtítulos.</FormDescription>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar Diseño'}
        </Button>
      </form>
    </Form>
  );
}
