
"use client";

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { AppUser, UserRole } from '@/types';
import { updateUserByAdmin } from '@/config/firebase';

const roles: UserRole[] = ['Student', 'Teacher', 'Coordinator', 'Admin'];

const editUserSchema = z.object({
  displayName: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  role: z.enum(roles, { errorMap: () => ({ message: "Por favor selecciona un rol válido."}) }),
});

type EditUserFormValues = z.infer<typeof editUserSchema>;

interface EditUserDialogProps {
  user: AppUser;
  isOpen: boolean;
  onClose: (updated?: boolean) => void;
}

export function EditUserDialog({ user, isOpen, onClose }: EditUserDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      displayName: user.displayName || '',
      role: user.role,
    },
  });

  // Reset form when user prop changes or dialog opens/closes
  useEffect(() => {
    if (user) {
      form.reset({
        displayName: user.displayName || '',
        role: user.role,
      });
    }
  }, [user, form, isOpen]);


  const onSubmit = async (data: EditUserFormValues) => {
    setIsSubmitting(true);
    try {
      await updateUserByAdmin(user.uid, {
        displayName: data.displayName,
        role: data.role,
      });
      toast({
        title: '¡Éxito!',
        description: 'La información del usuario ha sido actualizada.',
      });
      onClose(true); // Pass true to indicate an update occurred
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la información del usuario. Intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Usuario</DialogTitle>
          <DialogDescription>
            Modifica el nombre y el rol para {user.email}.
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
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un rol" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roles.map((roleValue) => (
                        <SelectItem key={roleValue} value={roleValue}>
                          {roleValue}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
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
