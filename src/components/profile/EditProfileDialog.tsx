

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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import type { AppUser } from '@/types';
import { updateUserProfile } from '@/config/firebase'; 
import { useAuth } from '@/contexts/AuthContext';

const editProfileSchema = z.object({
  displayName: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }).optional(),
  photoURL: z.string().url({ message: 'Por favor, ingrese una URL válida.' }).or(z.literal('')).optional(),
  documentId: z.string().min(8, { message: 'El documento debe tener al menos 8 caracteres.' }).optional().or(z.literal('')),
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
      documentId: user.documentId || '',
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        documentId: user.documentId || '',
      });
    }
  }, [user, form, isOpen]);

  const onSubmit = async (data: EditProfileFormValues) => {
    setIsSubmitting(true);
    try {
      await updateUserProfile({
        displayName: data.displayName,
        photoURL: data.photoURL,
        documentId: data.documentId,
      });

      // toast({
      //   title: '¡Éxito!',
      //   description: 'Tu perfil ha sido actualizado.',
      // });
      
      await reloadUser();
      
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      // toast({
      //   title: 'Error',
      //   description: 'No se pudo actualizar tu perfil. Intenta de nuevo.',
      //   variant: 'destructive',
      // });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
          <DialogDescription>
            Realiza cambios en tu perfil. Haz clic en guardar cuando hayas terminado.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Tu nombre" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="photoURL"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL de Foto de Perfil</FormLabel>
                  <FormControl>
                    <Input placeholder="https://ejemplo.com/foto.png" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="documentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Documento de Identidad</FormLabel>
                  <FormControl>
                    <Input placeholder="Tu número de documento" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
