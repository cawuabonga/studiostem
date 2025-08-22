
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
import type { AppUser, Role, Institute } from '@/types';
import { updateUserBySuperAdmin, getInstitutes, getRoles } from '@/config/firebase';

const editUserSchema = z.object({
  displayName: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  roleId: z.string({ required_error: "Debe seleccionar un rol." }),
  instituteId: z.string().optional().or(z.literal('')),
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
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      displayName: user.displayName || '',
      roleId: user.roleId || '',
      instituteId: user.instituteId || '',
    },
  });

  const selectedInstituteId = form.watch('instituteId');

  useEffect(() => {
    if (isOpen) {
        const fetchInitialData = async () => {
            setLoadingData(true);
            try {
                const fetchedInstitutes = await getInstitutes();
                setInstitutes(fetchedInstitutes);
                 if (user.instituteId) {
                    const fetchedRoles = await getRoles(user.instituteId);
                    setRoles(fetchedRoles);
                } else {
                    setRoles([]);
                }
            } catch (error) {
                toast({ title: "Error", description: "No se pudieron cargar los institutos y roles.", variant: "destructive" });
            } finally {
                setLoadingData(false);
            }
        };
        fetchInitialData();
    }
  }, [isOpen, user.instituteId, toast]);

   useEffect(() => {
    if (selectedInstituteId) {
        getRoles(selectedInstituteId).then(setRoles).catch(console.error);
        // Do not reset role if it's the initial load
        if(selectedInstituteId !== user.instituteId) {
           form.setValue('roleId', '');
        }
    } else {
        setRoles([]);
    }
  }, [selectedInstituteId, form, user.instituteId]);


  useEffect(() => {
    if (user) {
      form.reset({
        displayName: user.displayName || '',
        roleId: user.roleId || '',
        instituteId: user.instituteId || '',
      });
    }
  }, [user, form, isOpen]);


  const onSubmit = async (data: EditUserFormValues) => {
    setIsSubmitting(true);
    const selectedRole = roles.find(r => r.id === data.roleId);
    
    if (!selectedRole && data.roleId !== 'SuperAdmin') {
        toast({ title: "Error", description: "El rol seleccionado no es válido.", variant: 'destructive'});
        setIsSubmitting(false);
        return;
    }
    
    // Handle the special case for SuperAdmin, which is not a dynamic role
    const finalRoleName = data.roleId === 'SuperAdmin' ? 'SuperAdmin' : selectedRole!.name;

    try {
      await updateUserBySuperAdmin(user.uid, {
        displayName: data.displayName,
        roleId: data.roleId,
        role: finalRoleName, // Update legacy role field for compatibility
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
              name="instituteId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instituto</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''} disabled={loadingData}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={loadingData ? "Cargando..." : "Selecciona un instituto"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="">Sin Instituto</SelectItem>
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
             <FormField
              control={form.control}
              name="roleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''} disabled={loadingData || !selectedInstituteId}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un rol" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="SuperAdmin">SuperAdmin</SelectItem>
                      <SelectItem value="" disabled>--- Roles del Instituto ---</SelectItem>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
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
              <Button type="submit" disabled={isSubmitting || loadingData}>
                {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

