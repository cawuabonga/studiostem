
"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { updateInstitute } from '@/config/firebase';
import type { Institute, InstitutePublicProfile } from '@/types';
import { Loader2, Save } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const profileSchema = z.object({
  bannerUrl: z.string().url({ message: 'Debe ser una URL válida.' }).optional().or(z.literal('')),
  slogan: z.string().optional(),
  aboutUs: z.string().optional(),
  contactAddress: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email({ message: 'Debe ser un email válido.' }).optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function PublicProfileManagementPage() {
  const { institute, instituteId, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      bannerUrl: '',
      slogan: '',
      aboutUs: '',
      contactAddress: '',
      contactPhone: '',
      contactEmail: '',
    },
  });

  useEffect(() => {
    if (institute?.publicProfile) {
      form.reset(institute.publicProfile);
    }
  }, [institute, form]);

  const onSubmit = async (data: ProfileFormValues) => {
    if (!instituteId) {
        toast({ title: 'Error', description: 'No se ha seleccionado un instituto.', variant: 'destructive'});
        return;
    }
    setIsSubmitting(true);
    try {
      await updateInstitute(instituteId, { publicProfile: data });
      toast({ title: 'Perfil Actualizado', description: 'La información pública del instituto ha sido guardada.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
        <Card>
            <CardHeader><Skeleton className="h-8 w-1/2"/></CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full"/>
                <Skeleton className="h-24 w-full"/>
            </CardContent>
        </Card>
    )
  }

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle>Gestionar Perfil Público del Instituto</CardTitle>
                    <CardDescription>
                        Esta información será visible para todos en la página pública de tu instituto.
                    </CardDescription>
                </div>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                    Guardar Cambios
                </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField control={form.control} name="bannerUrl" render={({ field }) => (
              <FormItem>
                <FormLabel>URL de Imagen de Banner</FormLabel>
                <FormControl><Input placeholder="https://ejemplo.com/banner.png" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="slogan" render={({ field }) => (
              <FormItem>
                <FormLabel>Eslogan o Lema</FormLabel>
                <FormControl><Input placeholder="Lema del instituto" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="aboutUs" render={({ field }) => (
              <FormItem>
                <FormLabel>Sobre Nosotros</FormLabel>
                <FormControl><Textarea rows={5} placeholder="Describe la historia, misión y visión de tu instituto." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <FormField control={form.control} name="contactAddress" render={({ field }) => (
                <FormItem>
                    <FormLabel>Dirección</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
                )} />
                 <FormField control={form.control} name="contactPhone" render={({ field }) => (
                <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
                )} />
                 <FormField control={form.control} name="contactEmail" render={({ field }) => (
                <FormItem>
                    <FormLabel>Email de Contacto</FormLabel>
                    <FormControl><Input type="email" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
                )} />
            </div>
          </CardContent>
        </form>
      </Form>
    </Card>
  );
}
