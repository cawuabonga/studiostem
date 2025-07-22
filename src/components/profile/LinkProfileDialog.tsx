
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
import { useAuth } from '@/contexts/AuthContext';
import { linkUserToProfile } from '@/config/firebase';
import { Loader2 } from 'lucide-react';

const linkProfileSchema = z.object({
  dni: z.string().length(8, { message: 'El DNI debe tener exactamente 8 dígitos.' }),
  email: z.string().email({ message: 'Por favor, ingrese un correo electrónico válido.' }),
});

type LinkProfileFormValues = z.infer<typeof linkProfileSchema>;

interface LinkProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileLinked: () => void;
}

export function LinkProfileDialog({ isOpen, onClose, onProfileLinked }: LinkProfileDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LinkProfileFormValues>({
    resolver: zodResolver(linkProfileSchema),
    defaultValues: {
      dni: '',
      email: '',
    },
  });

  const onSubmit = async (data: LinkProfileFormValues) => {
    if (!user) {
        toast({ title: "Error", description: "No has iniciado sesión.", variant: "destructive" });
        return;
    }
    
    setIsSubmitting(true);
    try {
      const result = await linkUserToProfile(user.uid, data.dni, data.email);
      
      toast({
        title: '¡Perfil Vinculado!',
        description: `Tu cuenta ha sido vinculada al perfil de ${result.role} en ${result.instituteName}.`,
      });

      onProfileLinked();

    } catch (error: any) {
      console.error('Error linking profile:', error);
      toast({
        title: 'Error al Vincular',
        description: error.message || 'No se pudo encontrar un perfil con los datos proporcionados. Por favor, verifica la información o contacta a un administrador.',
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
          <DialogTitle>Vincular Perfil Institucional</DialogTitle>
          <DialogDescription>
            Ingresa tu DNI y el correo electrónico con el que fuiste registrado en el instituto para vincular tu cuenta.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="dni"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>DNI</FormLabel>
                  <FormControl>
                    <Input placeholder="Tu número de DNI" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo Electrónico de Registro</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="El correo que el instituto registró" {...field} />
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
                {isSubmitting ? 'Verificando...' : 'Vincular Perfil'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
