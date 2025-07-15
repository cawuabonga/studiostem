
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
import type { Institute } from '@/types';
import { updateInstitute } from '@/config/firebase';

const editInstituteSchema = z.object({
  name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  logoUrl: z.string().url({ message: 'Debe ser una URL válida.' }).optional().or(z.literal('')),
  primaryColor: z.string().regex(/^\d{1,3}\s\d{1,3}%\s\d{1,3}%$/, { message: 'Debe ser un HSL válido, ej: 225 65% 32%' }).optional().or(z.literal('')),
});

type EditInstituteFormValues = z.infer<typeof editInstituteSchema>;

interface EditInstituteDialogProps {
  institute: Institute;
  isOpen: boolean;
  onClose: (updated?: boolean) => void;
}

export function EditInstituteDialog({ institute, isOpen, onClose }: EditInstituteDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<EditInstituteFormValues>({
    resolver: zodResolver(editInstituteSchema),
    defaultValues: {
      name: institute?.name || '',
      logoUrl: institute?.logoUrl || '',
      primaryColor: institute?.primaryColor || '',
    },
  });

  useEffect(() => {
    if (institute) {
      form.reset({
        name: institute.name,
        logoUrl: institute.logoUrl || '',
        primaryColor: institute.primaryColor || '',
      });
    }
  }, [institute, form, isOpen]);

  const onSubmit = async (data: EditInstituteFormValues) => {
    setIsSubmitting(true);
    try {
      await updateInstitute(institute.id, data);
      toast({
        title: '¡Éxito!',
        description: 'La información del instituto ha sido actualizada.',
      });
      onClose(true); 
    } catch (error) {
      console.error('Error updating institute:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la información del instituto. Intenta de nuevo.',
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
          <DialogTitle>Editar Instituto</DialogTitle>
          <DialogDescription>
            Realiza cambios en la información del instituto. El ID no se puede cambiar.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Instituto</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre del instituto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
                control={form.control}
                name="logoUrl"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>URL del Logo</FormLabel>
                    <FormControl>
                    <Input placeholder="https://ejemplo.com/logo.png" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="primaryColor"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Color Primario (HSL)</FormLabel>
                    <FormControl>
                    <Input placeholder="225 65% 32%" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={() => onClose()}>
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
