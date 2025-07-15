
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { AppUser, UserRole, Institute } from '@/types';
import { updateUserBySuperAdmin, getInstitutes } from '@/config/firebase';

const allRoles: UserRole[] = ['SuperAdmin', 'Student', 'Teacher', 'Coordinator', 'Admin'];

const editUserSchema = z.object({
  displayName: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  role: z.enum(allRoles, { errorMap: () => ({ message: "Por favor selecciona un rol válido."}) }),
  instituteId: z.string({ required_error: "Debe seleccionar un instituto." }),
});

type EditUserFormValues = z.infer<typeof editUserSchema>;

interface SuperAdminEditUserDialogProps {
  user: AppUser;
  isOpen: boolean;
  onClose: (updated?: boolean) => void;
}

export function SuperAdminEditUserDialog({ user, isOpen, onClose }: SuperAdminEditUserDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [loadingInstitutes, setLoadingInstitutes] = useState(true);

  useEffect(() => {
    if (isOpen) {
        const fetchInstitutes = async () => {
            setLoadingInstitutes(true);
            try {
                const fetchedInstitutes = await getInstitutes();
                setInstitutes(fetchedInstitutes);
            } catch (error) {
                toast({ title: "Error", description: "No se pudieron cargar los institutos.", variant: "destructive" });
            } finally {
                setLoadingInstitutes(false);
            }
        };
        fetchInstitutes();
    }
  }, [isOpen, toast]);

  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      displayName: user.displayName || '',
      role: user.role,
      instituteId: user.instituteId || '',
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        displayName: user.displayName || '',
        role: user.role,
        instituteId: user.instituteId || '',
      });
    }
  }, [user, form, isOpen]);


  const onSubmit = async (data: EditUserFormValues) => {
    setIsSubmitting(true);
    try {
      await updateUserBySuperAdmin(user.uid, {
        displayName: data.displayName,
        role: data.role,
        instituteId: data.instituteId,
      });
      toast({
        title: '¡Éxito!',
        description: 'La información del usuario ha sido actualizada.',
      });
      onClose(true);
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Usuario (SuperAdmin)</DialogTitle>
          <DialogDescription>
            Modifica los detalles para {user.email}.
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
                      {allRoles.map((roleValue) => (
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
            <FormField
              control={form.control}
              name="instituteId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instituto</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={loadingInstitutes}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={loadingInstitutes ? "Cargando..." : "Selecciona un instituto"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {institutes.map((institute) => (
                        <SelectItem key={institute.id} value={institute.id}>
                          {institute.name}
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
