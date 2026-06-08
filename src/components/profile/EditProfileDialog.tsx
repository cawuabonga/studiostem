
"use client";

import React, { useEffect, useState } from 'react';
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
import { updateUserProfile, uploadFileAndGetURL } from '@/config/firebase'; 
import { useAuth } from '@/contexts/AuthContext';
import { Textarea } from '../ui/textarea';
import { Separator } from '../ui/separator';
import { Github, Linkedin, Facebook, Instagram, Globe, Loader2, Plus, X, Image as ImageIcon, UserCircle, FileText } from 'lucide-react';
import { Badge } from '../ui/badge';
import Image from 'next/image';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ACCEPTED_PDF_TYPE = ["application/pdf"];

const editProfileSchema = z.object({
  displayName: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }).optional(),
  photoURL: z.instanceof(FileList).optional(),
  coverImage: z.instanceof(FileList).optional(),
  cvFile: z.instanceof(FileList).optional()
    .refine(files => !files || files.length === 0 || files[0]?.size <= 10 * 1024 * 1024, "Máximo 10MB para el CV.")
    .refine(files => !files || files.length === 0 || ACCEPTED_PDF_TYPE.includes(files[0]?.type), "El CV debe estar en formato PDF."),
  bio: z.string().max(500, "Máximo 500 caracteres.").optional(),
  skills: z.array(z.string()).optional(),
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
  const [newSkill, setNewSkill] = useState('');
  const [skills, setSkills] = useState<string[]>(user.skills || []);

  const form = useForm<EditProfileFormValues>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      displayName: user.displayName || '',
      photoURL: undefined,
      coverImage: undefined,
      cvFile: undefined,
      bio: user.bio || '',
      skills: user.skills || [],
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
      setSkills(user.skills || []);
      form.reset({
        displayName: user.displayName || '',
        photoURL: undefined,
        coverImage: undefined,
        cvFile: undefined,
        bio: user.bio || '',
        skills: user.skills || [],
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

  const handleAddSkill = () => {
      if (newSkill.trim() && !skills.includes(newSkill.trim())) {
          const updatedSkills = [...skills, newSkill.trim()];
          setSkills(updatedSkills);
          form.setValue('skills', updatedSkills);
          setNewSkill('');
      }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
      const updatedSkills = skills.filter(s => s !== skillToRemove);
      setSkills(updatedSkills);
      form.setValue('skills', updatedSkills);
  };

  const onSubmit = async (data: EditProfileFormValues) => {
    setIsSubmitting(true);
    try {
      let finalPhotoURL = user.photoURL || '';
      let finalCoverURL = user.coverImageUrl || '';
      let finalCVUrl = user.cvUrl || '';

      if (data.photoURL && data.photoURL.length > 0) {
          finalPhotoURL = await uploadFileAndGetURL(data.photoURL[0], `users/${user.uid}/profile_photo`);
      }

      if (data.coverImage && data.coverImage.length > 0) {
          finalCoverURL = await uploadFileAndGetURL(data.coverImage[0], `users/${user.uid}/cover_image`);
      }

      if (data.cvFile && data.cvFile.length > 0) {
          finalCVUrl = await uploadFileAndGetURL(data.cvFile[0], `users/${user.uid}/cv_personal`);
      }

      await updateUserProfile({ 
          displayName: data.displayName,
          photoURL: finalPhotoURL,
          coverImageUrl: finalCoverURL,
          cvUrl: finalCVUrl,
          bio: data.bio,
          socialLinks: data.socialLinks,
          skills 
      });

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
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-black uppercase text-primary tracking-tighter">Mi Identidad Profesional</DialogTitle>
          <DialogDescription>Configura tu perfil para que sea visible como una hoja de vida profesional ante reclutadores.</DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-6 py-4 space-y-8">
            <div className="space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Apariencia y Visualización</h3>
                
                <div className="space-y-4">
                    <FormField control={form.control} name="coverImage" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center gap-2 font-bold">
                                <ImageIcon className="h-4 w-4 text-primary" /> Imagen de Portada (Banner)
                            </FormLabel>
                            {user.coverImageUrl && (
                                <div className="relative h-24 w-full rounded-xl overflow-hidden border mb-2">
                                    <Image src={user.coverImageUrl} alt="Banner actual" fill className="object-cover opacity-60" />
                                </div>
                            )}
                            <FormControl><Input type="file" accept="image/*" {...form.register('coverImage')} /></FormControl>
                            <FormDescription className="text-[10px]">Aparecerá en el fondo de tu cabecera de perfil público.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="photoURL" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center gap-2 font-bold">
                                    <UserCircle className="h-4 w-4 text-primary" /> Foto de Perfil
                                </FormLabel>
                                <FormControl><Input type="file" accept="image/*" {...form.register('photoURL')} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="displayName" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold">Nombre Público</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>

                    {/* Nueva Carga de CV */}
                    {user.role === 'Student' && (
                        <div className="bg-primary/5 p-4 rounded-2xl border-2 border-dashed border-primary/20 space-y-3">
                             <FormField control={form.control} name="cvFile" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2 font-black text-primary uppercase text-xs">
                                        <FileText className="h-4 w-4" /> Mi Hoja de Vida (PDF)
                                    </FormLabel>
                                    {user.cvUrl && (
                                        <div className="flex items-center gap-2 text-xs font-bold text-green-700 bg-green-50 p-2 rounded-lg mb-2">
                                            <CheckCircle2 className="h-4 w-4" /> Ya tienes un CV registrado. Puedes actualizarlo.
                                        </div>
                                    )}
                                    <FormControl><Input type="file" accept=".pdf" {...form.register('cvFile')} className="bg-background" /></FormControl>
                                    <FormDescription className="text-[10px]">Obligatorio para postular a vacantes. Sube tu CV actualizado en PDF.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                    )}
                </div>

                <FormField control={form.control} name="bio" render={({ field }) => (
                    <FormItem>
                        <FormLabel className="font-bold">Resumen Ejecutivo / Perfil Profesional</FormLabel>
                        <FormControl><Textarea rows={4} placeholder="Describe tu trayectoria, tus fortalezas y qué valor aportas a una empresa..." {...field} /></FormControl>
                        <FormDescription className="text-[10px]">Cuéntale a los reclutadores quién eres profesionalmente. Máximo 500 caracteres.</FormDescription>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>

            <Separator />

            <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Habilidades y Competencias</h3>
                <div className="space-y-3">
                    <div className="flex gap-2">
                        <Input 
                            placeholder="Ej: Análisis de Datos, Java, Liderazgo..." 
                            value={newSkill} 
                            onChange={e => setNewSkill(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                        />
                        <Button type="button" onClick={handleAddSkill} variant="secondary">
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                        {skills.map(skill => (
                            <Badge key={skill} className="bg-primary/10 text-primary border-primary/20 flex items-center gap-1 py-1 px-3">
                                {skill}
                                <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => handleRemoveSkill(skill)} />
                            </Badge>
                        ))}
                    </div>
                </div>
            </div>

            <Separator />

            <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Presencia Digital (Redes)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="socialLinks.linkedin" render={({ field }) => (
                        <FormItem><FormLabel className="flex items-center gap-2"><Linkedin className="h-4 w-4 text-blue-600"/> LinkedIn</FormLabel><FormControl><Input placeholder="https://linkedin.com/in/..." {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="socialLinks.github" render={({ field }) => (
                        <FormItem><FormLabel className="flex items-center gap-2"><Github className="h-4 w-4"/> GitHub / Portafolio</FormLabel><FormControl><Input placeholder="https://github.com/..." {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="socialLinks.facebook" render={({ field }) => (
                        <FormItem><FormLabel className="flex items-center gap-2"><Facebook className="h-4 w-4 text-blue-800"/> Facebook</FormLabel><FormControl><Input placeholder="https://facebook.com/..." {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="socialLinks.instagram" render={({ field }) => (
                        <FormItem><FormLabel className="flex items-center gap-2"><Instagram className="h-4 w-4 text-pink-600"/> Instagram</FormLabel><FormControl><Input placeholder="https://instagram.com/..." {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
            </div>
          </form>
          
          <DialogFooter className="p-6 bg-muted/20 border-t">
              <DialogClose asChild><Button type="button" variant="outline" className="font-bold">CANCELAR</Button></DialogClose>
              <Button type="submit" onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting} className="font-black px-8">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'PUBLICAR CAMBIOS'}
              </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
