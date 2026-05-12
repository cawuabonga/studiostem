"use client";

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { saveLoginDesignSettings, getLoginDesignSettings, uploadFileAndGetURL } from '@/config/firebase';
import type { LoginDesign } from '@/types';
import { Skeleton } from '../ui/skeleton';
import { Textarea } from '../ui/textarea';
import { Loader2, Save, Image as ImageIcon, Layout, Info, UserCheck, Phone } from 'lucide-react';
import { Separator } from '../ui/separator';
import Image from 'next/image';

const designSchema = z.object({
  title: z.string().optional(),
  slogan: z.string().optional(),
  textAlign: z.enum(['left', 'center', 'right']).optional(),
  titleSize: z.enum(['text-2xl', 'text-3xl', 'text-4xl']).optional(),
  sloganSize: z.enum(['text-base', 'text-lg', 'text-xl']).optional(),
  imageUrl: z.string().url({ message: "Debe ser una URL válida." }).or(z.literal('')),
  backgroundColor: z.string().min(1, "El color de fondo es requerido."),
  textColor: z.string().min(1, "El color de texto es requerido."),
  layout: z.enum(['side', 'center'], { required_error: 'Debe seleccionar un diseño.' }),
  creationYear: z.string().optional(),
  creators: z.string().optional(),
  contactInfo: z.string().optional(),
  logo: z.instanceof(FileList).optional(),
});

type DesignFormValues = z.infer<typeof designSchema>;

interface LoginDesignFormProps {
  onSettingsSaved: () => void;
}

export function LoginDesignForm({ onSettingsSaved }: LoginDesignFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [design, setDesign] = useState<LoginDesign | null>(null);

  const form = useForm<DesignFormValues>({
    resolver: zodResolver(designSchema),
    defaultValues: {
      title: 'SISTEMA TECNOLÓGICO DE EDUCACIÓN MODULAR',
      slogan: 'Una nueva forma de gestionar la educación.',
      textAlign: 'left',
      titleSize: 'text-3xl',
      sloganSize: 'text-lg',
      imageUrl: '',
      backgroundColor: '#1c3d5a',
      textColor: '#ffffff',
      layout: 'side',
      creationYear: '',
      creators: '',
      contactInfo: '',
    },
  });

  useEffect(() => {
    const fetchSettings = async () => {
      setLoadingInitial(true);
      try {
        const settings = await getLoginDesignSettings();
        if (settings) {
          setDesign(settings);
          form.reset({
            title: settings.title || '',
            slogan: settings.slogan || '',
            textAlign: settings.textAlign || 'left',
            titleSize: settings.titleSize || 'text-3xl',
            sloganSize: settings.sloganSize || 'text-lg',
            imageUrl: settings.imageUrl || '',
            backgroundColor: settings.backgroundColor || '#1c3d5a',
            textColor: settings.textColor || '#ffffff',
            layout: settings.layout || 'side',
            creationYear: settings.creationYear || '',
            creators: settings.creators || '',
            contactInfo: settings.contactInfo || '',
          });
        }
      } catch (error) {
        toast({ title: "Error", description: "No se pudieron cargar las configuraciones.", variant: "destructive" });
      } finally {
        setLoadingInitial(false);
      }
    };
    fetchSettings();
  }, [form, toast]);


  const onSubmit = async (data: DesignFormValues) => {
    setLoading(true);
    try {
      let logoUrl = design?.logoUrl || '';
      if (data.logo && data.logo.length > 0) {
          logoUrl = await uploadFileAndGetURL(data.logo[0], 'config/platform/logo');
      }

      const { logo, ...rest } = data;
      await saveLoginDesignSettings({ ...rest, logoUrl });
      
      toast({
        title: '¡Éxito!',
        description: 'La configuración de la plataforma ha sido actualizada.',
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
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* IZQUIERDA: Identidad Visual */}
            <div className="md:col-span-4 space-y-6">
                <div className="p-4 bg-muted/30 rounded-xl border-2 border-dashed flex flex-col items-center text-center">
                    <Label className="mb-4 font-black uppercase text-xs tracking-widest text-primary">Logo de Plataforma</Label>
                    {design?.logoUrl && (
                        <div className="relative h-32 w-32 mb-4 bg-white rounded-lg p-2 shadow-inner">
                            <Image src={design.logoUrl} alt="Logo actual" fill className="object-contain" />
                        </div>
                    )}
                    <FormField
                        control={form.control}
                        name="logo"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <Input type="file" accept="image/*" {...form.register('logo')} className="text-xs" />
                                </FormControl>
                                <FormDescription className="text-[10px]">Recomendado: PNG Transparente 512x512px.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                        <UserCheck className="h-4 w-4" /> Créditos de Autor
                    </h3>
                    <FormField
                        control={form.control}
                        name="creationYear"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Año de Lanzamiento</FormLabel>
                                <FormControl><Input placeholder="Ej: 2024" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="creators"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Creador / Desarrollador</FormLabel>
                                <FormControl><Input placeholder="Nombres o Empresa" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </div>

            {/* DERECHA: Textos y Colores */}
            <div className="md:col-span-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem className="md:col-span-2">
                        <FormLabel className="font-bold">Título Principal del Login</FormLabel>
                        <FormControl><Textarea {...field} rows={2} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="slogan"
                    render={({ field }) => (
                        <FormItem className="md:col-span-2">
                        <FormLabel className="font-bold">Eslogan / Subtítulo</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="contactInfo"
                    render={({ field }) => (
                        <FormItem className="md:col-span-2">
                        <FormLabel className="flex items-center gap-2 font-bold">
                            <Phone className="h-4 w-4" /> Información de Soporte / Contacto
                        </FormLabel>
                        <FormControl><Input placeholder="Ej: Soporte técnico: 987654321 / support@stem.com" {...field} /></FormControl>
                        <FormDescription>Aparecerá al final del formulario de acceso.</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <FormField
                        control={form.control}
                        name="textAlign"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Alineación</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
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
                    <FormField
                        control={form.control}
                        name="backgroundColor"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Color Fondo Panel</FormLabel>
                            <div className="flex gap-2">
                                <FormControl><Input type="color" {...field} className="w-12 p-1" /></FormControl>
                                <Input value={field.value} onChange={field.onChange} className="flex-1 font-mono text-xs uppercase" />
                            </div>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="textColor"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Color Texto Panel</FormLabel>
                            <div className="flex gap-2">
                                <FormControl><Input type="color" {...field} className="w-12 p-1" /></FormControl>
                                <Input value={field.value} onChange={field.onChange} className="flex-1 font-mono text-xs uppercase" />
                            </div>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </div>
        </div>

        <div className="flex justify-end pt-6 border-t">
            <Button type="submit" size="lg" disabled={loading} className="w-full sm:w-auto h-14 px-12 shadow-xl shadow-primary/20">
            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
            {loading ? 'Guardando...' : 'Actualizar Diseño de Plataforma'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
