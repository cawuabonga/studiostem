
"use client";

import React, { useState } from 'react';
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
import { validateUserWithActivationCode } from '@/config/firebase'; 
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const validateProfileSchema = z.object({
  dni: z.string().length(8, { message: 'El DNI debe tener exactamente 8 dígitos.' }),
  activationCode: z.string().min(6, { message: 'El código de activación es requerido.' }),
});

type ValidateProfileFormValues = z.infer<typeof validateProfileSchema>;

interface ValidateProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ValidateProfileDialog({ isOpen, onClose, onSuccess }: ValidateProfileDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ValidateProfileFormValues>({
    resolver: zodResolver(validateProfileSchema),
    defaultValues: {
      dni: '',
      activationCode: '',
    },
  });

  const onSubmit = async (data: ValidateProfileFormValues) => {
    if (!user) {
        toast({ title: 'Error', description: 'No se ha encontrado un usuario autenticado.', variant: 'destructive'});
        return;
    }
    setIsSubmitting(true);
    try {
      await validateUserWithActivationCode(user.uid, data.dni, data.activationCode);

      toast({
        title: '¡Éxito!',
        description: 'Tu perfil ha sido validado y actualizado. Tus nuevos roles y permisos están activos.',
      });
      
      onSuccess();
      
    } catch (error: any) {
      console.error('Error validating profile:', error);
      toast({
        title: 'Error de Validación',
        description: error.message || 'No se pudo validar el perfil. Verifica tus datos o contacta a un administrador.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Validar Perfil de Usuario</DialogTitle>
          <DialogDescription>
            Ingresa tu DNI y el código de activación proporcionado por tu instituto para vincular tu cuenta y activar tus permisos.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="dni"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de DNI</FormLabel>
                  <FormControl>
                    <Input placeholder="Tu DNI de 8 dígitos" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="activationCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código de Activación</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: ACTIV-A1B2C3" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Validando...' : 'Validar Perfil'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
