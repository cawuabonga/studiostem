
"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { updateInstitute, uploadFileAndGetURL } from '@/config/firebase';
import type { Institute, InstitutePublicProfile } from '@/types';
import { Loader2, Save, ExternalLink } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import Image from 'next/image';
import { hexToHsl, hslToHex } from '@/lib/utils';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const profileSchema = z.object({
  bannerImage: z.instanceof(FileList).optional()
    .refine(files => !files || files.length === 0 || files?.[0]?.size <= MAX_FILE_SIZE, `El tamaño máximo es 5MB.`)
    .refine(files => !files || files.length === 0 || ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type), "Solo formatos .jpg, .jpeg, .png y .webp."),
  slogan: z.string().optional(),
  aboutUs: z.string().optional(),
  contactAddress: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email({ message: 'Debe ser un email válido.' }).optional().or(z.literal('')),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, { message: 'Debe ser un color hexadecimal válido.' }).optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function PublicProfileManagementPage() {
  const { institute, instituteId, loading: authLoading, reloadUser } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      bannerImage: undefined,
      slogan: '',
      aboutUs: '',
      contactAddress: '',
      contactPhone: '',
      contactEmail: '',
      primaryColor: '#1E3A8A',
    },
  });

  useEffect(() => {
    if (institute) {
      form.reset({
        slogan: institute.publicProfile?.slogan || '',
        aboutUs: institute.publicProfile?.aboutUs || '',
        contactAddress: institute.publicProfile?.contactAddress || '',
        contactPhone: institute.publicProfile?.contactPhone || '',
        contactEmail: institute.publicProfile?.contactEmail || '',
        bannerImage: undefined,
        primaryColor: institute.primaryColor ? hslToHex(institute.primaryColor) : '#1E3A8A',
      });
    }
  }, [institute, form]);

  const onSubmit = async (data: ProfileFormValues) => {
    if (!instituteId) {
        toast({ title: 'Error', description: 'No se ha seleccionado un instituto.', variant: 'destructive'});
        return;
    }
    setIsSubmitting(true);
    try {
      let bannerUrl = institute?.publicProfile?.bannerUrl || '';

      if (data.bannerImage && data.bannerImage.length > 0) {
        const file = data.bannerImage[0];
        const storagePath = `institutes/${instituteId}/public/banner`;
        bannerUrl = await uploadFileAndGetURL(file, storagePath);
      }
      
      const publicProfile: InstitutePublicProfile = {
        bannerUrl: bannerUrl,
        slogan: data.slogan,
        aboutUs: data.aboutUs,
        contactAddress: data.contactAddress,
        contactPhone: data.contactPhone,
        contactEmail: data.contactEmail,
      };

      const instituteUpdateData: Partial<Institute> = {
        publicProfile,
        primaryColor: data.primaryColor ? hexToHsl(data.primaryColor) : undefined,
      };

      await updateInstitute(instituteId, instituteUpdateData);
      await reloadUser(); 
      
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
            <div className="flex flex-wrap justify-between items-start gap-4">
                <div>
                    <CardTitle>Gestionar Perfil Público del Instituto</CardTitle>
                    <CardDescription>
                        Esta información será visible para todos en la página pública de tu instituto.
                    </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                     {instituteId && (
                        <Button asChild variant="outline">
                            <Link href={`/institute/${instituteId}`} target="_blank">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Ver Página Pública
                            </Link>
                        </Button>
                    )}
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                        Guardar Cambios
                    </Button>
                </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField control={form.control} name="bannerImage" render={({ field }) => (
                <FormItem>
                    <FormLabel>Imagen de Banner</FormLabel>
                    {institute?.publicProfile?.bannerUrl && (
                        <div className="relative h-40 w-full rounded-md overflow-hidden border">
                            <Image src={institute.publicProfile.bannerUrl} alt="Banner actual" fill className="object-cover" />
                        </div>
                    )}
                    <FormControl><Input type="file" {...form.register('bannerImage')} /></FormControl>
                    <FormDescription>Sube una nueva imagen para reemplazar la actual. Tamaño máximo: 5MB.</FormDescription>
                    <FormMessage />
                </FormItem>
                )} />
                 <FormField control={form.control} name="primaryColor" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Color Primario de la Marca</FormLabel>
                        <FormControl>
                        <div className="flex items-center gap-2">
                            <Input type="color" className="p-1 h-12 w-14" {...field} />
                            <Input type="text" className="h-12 flex-1 font-mono" value={field.value} onChange={field.onChange} />
                        </div>
                        </FormControl>
                        <FormDescription>Define el color principal para el tema visual del instituto.</FormDescription>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>

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
