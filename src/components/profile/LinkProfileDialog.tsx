
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
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { linkUserToProfile } from '@/config/firebase';
import { Loader2 } from 'lucide-react';

const linkProfileSchema = z.object({
  documentId: z.string().min(8, { message: 'El documento de identidad debe tener al menos 8 caracteres.' }),
  email: z.string().email({ message: 'Por favor, ingrese un correo electrónico válido.' }),
});

type LinkProfileFormValues = z.infer<typeof linkProfileSchema>;

interface LinkProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileLinked: () => void;
  isModal?: boolean;
}

export function LinkProfileDialog({ isOpen, onClose, onProfileLinked, isModal = true }: LinkProfileDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LinkProfileFormValues>({
    resolver: zodResolver(linkProfileSchema),
    defaultValues: {
      documentId: '',
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
      const result = await linkUserToProfile(user.uid, data.documentId, data.email);
      
      toast({
        title: '¡Perfil Vinculado!',
        description: `Tu cuenta ha sido vinculada al perfil de ${result.role} en ${result.instituteName}. Serás redirigido.`,
        duration: 5000,
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

  const content = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="documentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>N° de Documento de Identidad</FormLabel>
              <FormControl>
                <Input placeholder="Tu número de documento" {...field} />
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
        <div className="pt-4">
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Verificando...' : 'Vincular Perfil'}
          </Button>
        </div>
      </form>
    </Form>
  );

  if (isModal) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Vincular Perfil Institucional</DialogTitle>
            <DialogDescription>
              Ingresa tu documento de identidad y el correo electrónico con el que fuiste registrado en el instituto para vincular tu cuenta.
            </DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen -m-6">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Vincular Perfil Institucional</CardTitle>
            <CardDescription className="text-center pt-2">
              Para continuar, necesitamos conectar tu cuenta a tu perfil existente en el instituto. Por favor, ingresa los datos con los que fuiste registrado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {content}
          </CardContent>
        </Card>
    </div>
  );
}
