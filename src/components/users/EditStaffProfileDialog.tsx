

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
import type { StaffProfile, Role, Program } from '@/types';
import { updateStaffProfile, getPrograms, getRoles } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Separator } from '../ui/separator';

const conditions = ['NOMBRADO', 'CONTRATADO'] as const;

const editStaffProfileSchema = z.object({
  displayName: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  email: z.string().email({ message: 'Email inválido.' }),
  phone: z.string().min(7, { message: 'El celular debe tener al menos 7 dígitos.' }).optional().or(z.literal('')),
  roleId: z.string({ required_error: 'Debe seleccionar un rol.' }),
  condition: z.enum(conditions, { required_error: 'Debe seleccionar una condición.' }),
  programId: z.string({ required_error: 'Debe seleccionar un programa.' }),
  rfidCardId: z.string().optional().or(z.literal('')),
});

type EditStaffProfileFormValues = z.infer<typeof editStaffProfileSchema>;

interface EditStaffProfileDialogProps {
  profile: StaffProfile;
  isOpen: boolean;
  onClose: (updated?: boolean) => void;
}

export function EditStaffProfileDialog({ profile, isOpen, onClose }: EditStaffProfileDialogProps) {
  const { toast } = useToast();
  const { instituteId } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    if (instituteId) {
      getPrograms(instituteId).then(setPrograms).catch(console.error);
      getRoles(instituteId).then(setRoles).catch(console.error);
    }
  }, [instituteId]);

  const form = useForm<EditStaffProfileFormValues>({
    resolver: zodResolver(editStaffProfileSchema),
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        displayName: profile.displayName || '',
        email: profile.email || '',
        phone: profile.phone || '',
        roleId: profile.roleId || '',
        condition: profile.condition,
        programId: profile.programId || '',
        rfidCardId: profile.rfidCardId || '',
      });
    }
  }, [profile, form, isOpen]);

  const onSubmit = async (data: EditStaffProfileFormValues) => {
    if (!instituteId) {
      toast({ title: 'Error', description: 'ID de instituto no encontrado.', variant: 'destructive' });
      return;
    }
     const selectedRole = roles.find(r => r.id === data.roleId);
    if (!selectedRole) {
      toast({ title: "Error", description: "Rol seleccionado no es válido.", variant: "destructive"});
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);
    try {
      const updateData: Partial<StaffProfile> = {
        displayName: data.displayName,
        email: data.email,
        phone: data.phone,
        roleId: data.roleId,
        role: selectedRole.name as any, // for legacy compatibility
        condition: data.condition,
        programId: data.programId,
        rfidCardId: data.rfidCardId,
      };

      await updateStaffProfile(instituteId, profile.documentId, updateData);
      toast({
        title: '¡Éxito!',
        description: 'El perfil del personal ha sido actualizado. El cambio de rol se reflejará en el próximo inicio de sesión del usuario.',
      });
      onClose(true);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el perfil.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Perfil de Personal</DialogTitle>
          <DialogDescription>
            Modificando el perfil para {profile.displayName} (N° Doc: {profile.documentId}).
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Nombre Completo</FormLabel>
                        <FormControl>
                        <Input {...field} />
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
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                        <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Celular</FormLabel>
                        <FormControl>
                        <Input {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="condition"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Condición</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona una condición" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {conditions.map((cond) => (
                                <SelectItem key={cond} value={cond}>
                                {cond.charAt(0).toUpperCase() + cond.slice(1).toLowerCase()}
                                </SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="roleId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Rol</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona un rol" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
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
                <FormField
                    control={form.control}
                    name="programId"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Programa de Estudios</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!programs.length}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder={programs.length ? "Seleccione un programa" : "No hay programas"} />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {programs.map((program) => (
                            <SelectItem key={program.id} value={program.id}>
                                {program.name}
                            </SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
             </div>
             <Separator />
             <div className="space-y-2">
                <h3 className="font-medium text-sm">Control de Acceso</h3>
                 <FormField
                    control={form.control}
                    name="rfidCardId"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>ID de Tarjeta RFID</FormLabel>
                        <FormControl>
                        <Input placeholder="Escriba o escanee el ID de la tarjeta" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
             </div>
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={() => onClose()}>Cancelar</Button>
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
