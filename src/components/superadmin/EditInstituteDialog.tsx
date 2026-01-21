

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
import type { Institute } from '@/types';
import { updateInstitute } from '@/config/firebase';
import { hexToHsl, hslToHex } from '@/lib/utils';
import Image from 'next/image';

const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_LOGO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];

const editInstituteSchema = z.object({
  name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  logo: z.instanceof(FileList).optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, { message: 'Debe ser un color hexadecimal válido.' }).optional().or(z.literal('')),
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
      logo: undefined,
      primaryColor: institute?.primaryColor ? hslToHex(institute.primaryColor) : '#000000',
    },
  });

  useEffect(() => {
    if (institute && isOpen) {
      form.reset({
        name: institute.name,
        logo: undefined,
        primaryColor: institute.primaryColor ? hslToHex(institute.primaryColor) : '#000000',
      });
    }
  }, [institute, form, isOpen]);

  const onSubmit = async (data: EditInstituteFormValues) => {
    setIsSubmitting(true);
    try {
      const { logo, ...restOfData } = data;
      const logoFile = logo?.[0];
      
      const updateData: Partial<Omit<Institute, 'id' | 'logoUrl'>> = {
          name: restOfData.name,
          primaryColor: restOfData.primaryColor ? hexToHsl(restOfData.primaryColor) : undefined
      };
      
      await updateInstitute(institute.id, updateData, logoFile);

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
                name="logo"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Logo del Instituto</FormLabel>
                    {institute.logoUrl && (
                        <div className="relative h-20 w-20 rounded-md overflow-hidden border">
                            <Image src={institute.logoUrl} alt="Logo actual" fill className="object-contain" data-ai-hint="company logo" />
                        </div>
                    )}
                    <FormControl>
                        <Input type="file" accept="image/png, image/jpeg, image/webp, image/svg+xml" {...form.register('logo')} />
                    </FormControl>
                    <FormDescription>Sube un nuevo logo para reemplazar el actual.</FormDescription>
                    <FormMessage />
                </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="primaryColor"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Color Primario</FormLabel>
                     <FormControl>
                      <div className="flex items-center gap-2">
                        <Input type="color" className="p-1 h-10 w-14" {...field} />
                        <Input type="text" className="h-10 flex-1" value={field.value} onChange={field.onChange} />
                      </div>
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
