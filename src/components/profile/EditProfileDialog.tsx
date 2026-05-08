
"use client";

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import type { AppUser } from '@/types';
import { updateUserProfile } from '@/config/firebase'; 
import { useAuth } from '@/contexts/AuthContext';
import { Textarea } from '../ui/textarea';
import { Separator } from '../ui/separator';
import { Github, Linkedin, Facebook, Instagram, Globe, Loader2 } from 'lucide-react';

const editProfileSchema = z.object({
  displayName: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }).optional(),
  photoURL: z.string().url({ message: 'Por favor, ingrese una URL válida.' }).or(z.literal('')).optional(),
  bio: z.string().max(300, "Máximo 300 caracteres.").optional(),
  socialLinks: z.object({
    linkedin: z.string().url("URL inválida").or(z.literal('')).optional(),
    github: z.string().url("URL inválida").or(z.literal('')).optional(),
    facebook: z.string().url("URL inválida").or(z.literal('')).optional(),
    instagram: z.string().url("URL inválida").or(z.literal('')).optional(),
    web: z.string().url("URL inválida").or(z.literal('')).optional(),
  }).optional(),
});

type EditProfileFormValues = z.infer<typeof editProfileSchema>;

interface EditProfileDialogProps {
  user: AppUser;
  isOpen: boolean;
  onClose: () => void;
}

export function EditProfileDialog({ user, isOpen, onClose }: EditProfileDialogProps) {
  const { toast } = useToast();
  const { reloadUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<EditProfileFormValues>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      bio: user.bio || '',
      socialLinks: {
        linkedin: user.socialLinks?.linkedin || '',
        github: user.socialLinks?.github || '',
        facebook: user.socialLinks?.facebook || '',
        instagram: user.socialLinks?.instagram || '',
        web: user.socialLinks?.web || '',
      }
    },
  });

  useEffect(() => {
    if (user && isOpen) {
      form.reset({
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        bio: user.bio || '',
        socialLinks: {
          linkedin: user.socialLinks?.linkedin || '',
          github: user.socialLinks?.github || '',
          facebook: user.socialLinks?.facebook || '',
          instagram: user.socialLinks?.instagram || '',
          web: user.socialLinks?.web || '',
        }
      });
    }
  }, [user, form, isOpen]);

  const onSubmit = async (data: EditProfileFormValues) => {
    setIsSubmitting(true);
    try {
      await updateUserProfile(data);
      toast({ title: '¡Éxito!', description: 'Tu perfil ha sido actualizado.' });
      await reloadUser();
      onClose();
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo actualizar tu perfil.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-black uppercase">Editar Perfil Personal</DialogTitle>
          <DialogDescription>Completa tu identidad digital para que otros miembros del instituto te conozcan mejor.</DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-primary">Información Básica</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="displayName" render={({ field }) => (
                        <FormItem><FormLabel>Nombre Público</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="photoURL" render={({ field }) => (
                        <FormItem><FormLabel>Foto de Perfil (URL)</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                <FormField control={form.control} name="bio" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Breve Biografía</FormLabel>
                        <FormControl><Textarea rows={3} placeholder="Cuéntanos un poco sobre ti (estudios, pasiones, metas)..." {...field} /></FormControl>
                        <FormDescription className="text-[10px]">Máximo 300 caracteres.</FormDescription>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>

            <Separator />

            <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-primary">Redes Sociales y Web</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="socialLinks.linkedin" render={({ field }) => (
                        <FormItem><FormLabel className="flex items-center gap-2"><Linkedin className="h-4 w-4 text-blue-600"/> LinkedIn</FormLabel><FormControl><Input placeholder="https://linkedin.com/in/..." {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="socialLinks.github" render={({ field }) => (
                        <FormItem><FormLabel className="flex items-center gap-2"><Github className="h-4 w-4"/> GitHub</FormLabel><FormControl><Input placeholder="https://github.com/..." {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="socialLinks.facebook" render={({ field }) => (
                        <FormItem><FormLabel className="flex items-center gap-2"><Facebook className="h-4 w-4 text-blue-800"/> Facebook</FormLabel><FormControl><Input placeholder="https://facebook.com/..." {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="socialLinks.instagram" render={({ field }) => (
                        <FormItem><FormLabel className="flex items-center gap-2"><Instagram className="h-4 w-4 text-pink-600"/> Instagram</FormLabel><FormControl><Input placeholder="https://instagram.com/..." {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="socialLinks.web" render={({ field }) => (
                        <FormItem className="col-span-1 md:col-span-2"><FormLabel className="flex items-center gap-2"><Globe className="h-4 w-4 text-primary"/> Sitio Web Personal / Portafolio</FormLabel><FormControl><Input placeholder="https://tuweb.com" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
            </div>
          </form>
          
          <DialogFooter className="p-6 bg-muted/20 border-t">
              <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
              <Button type="submit" onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Guardar Cambios'}
              </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
