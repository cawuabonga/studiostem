
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
import type { StaffProfile, UserRole, Program } from '@/types';
import { updateStaffProfile, getPrograms } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';

const assignableRoles: UserRole[] = ['Teacher', 'Coordinator', 'Admin'];
const roleDisplayMap: Record<string, string> = {
    Teacher: 'Docente',
    Coordinator: 'Coordinador',
    Admin: 'Administrador',
};

const conditions = ['NOMBRADO', 'CONTRATADO'] as const;

const editStaffProfileSchema = z.object({
  displayName: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  email: z.string().email({ message: 'Email inválido.' }),
  phone: z.string().min(7, { message: 'El celular debe tener al menos 7 dígitos.' }).optional().or(z.literal('')),
  role: z.enum(assignableRoles, { required_error: 'Debe seleccionar un rol.' }),
  condition: z.enum(conditions, { required_error: 'Debe seleccionar una condición.' }),
  programId: z.string({ required_error: 'Debe seleccionar un programa.' }),
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

  useEffect(() => {
    if (instituteId) {
      getPrograms(instituteId).then(setPrograms).catch(console.error);
    }
  }, [instituteId]);

  const form = useForm<EditStaffProfileFormValues>({
    resolver: zodResolver(editStaffProfileSchema),
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        displayName: profile.displayName,
        email: profile.email,
        phone: profile.phone,
        role: profile.role,
        condition: profile.condition,
        programId: profile.programId,
      });
    }
  }, [profile, form, isOpen]);

  const onSubmit = async (data: EditStaffProfileFormValues) => {
    if (!instituteId) {
      toast({ title: 'Error', description: 'ID de instituto no encontrado.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      await updateStaffProfile(instituteId, profile.dni, data);
      toast({
        title: '¡Éxito!',
        description: 'El perfil del personal ha sido actualizado.',
      });
      onClose(true);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el perfil.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Perfil de Personal</DialogTitle>
          <DialogDescription>
            Modificando el perfil para {profile.displayName} (DNI: {profile.dni}).
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                            {assignableRoles.map((roleValue) => (
                                <SelectItem key={roleValue} value={roleValue}>
                                {roleDisplayMap[roleValue]}
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
