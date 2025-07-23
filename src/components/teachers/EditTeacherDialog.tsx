
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
import { useToast } from '@/hooks/use-toast';
import type { Teacher, StaffProfile, Program } from '@/types';
import { updateStaffProfile, getPrograms } from '@/config/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const conditions = ['NOMBRADO', 'CONTRATADO'] as const;

const editTeacherSchema = z.object({
  displayName: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  email: z.string().email({ message: 'Email inválido.' }),
  phone: z.string().min(7, { message: 'El teléfono debe tener al menos 7 dígitos.' }),
  condition: z.enum(conditions, { required_error: 'Debe seleccionar una condición.' }),
  programId: z.string({ required_error: 'Debe seleccionar un programa.' }),
});

type EditTeacherFormValues = z.infer<typeof editTeacherSchema>;

interface EditTeacherDialogProps {
  teacher: Teacher;
  instituteId: string;
  isOpen: boolean;
  onClose: (updated?: boolean) => void;
}

export function EditTeacherDialog({ teacher, instituteId, isOpen, onClose }: EditTeacherDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [programs, setPrograms] = useState<Program[]>([]);

   useEffect(() => {
    if (instituteId) {
      getPrograms(instituteId).then(setPrograms).catch(console.error);
    }
  }, [instituteId]);

  const form = useForm<EditTeacherFormValues>({
    resolver: zodResolver(editTeacherSchema),
  });

  useEffect(() => {
    if (teacher) {
        // We need to fetch the full profile to get programId and condition
        // For now, we adapt. In a real scenario, the initial teacher object would have this.
      form.reset({
          displayName: teacher.fullName,
          email: teacher.email,
          phone: teacher.phone,
          condition: 'CONTRATADO', // Placeholder
          programId: '' // Placeholder
      });
    }
  }, [teacher, form, isOpen]);

  const onSubmit = async (data: EditTeacherFormValues) => {
    setIsSubmitting(true);
    try {
        const updateData: Partial<StaffProfile> = {
            displayName: data.displayName,
            email: data.email,
            phone: data.phone,
            condition: data.condition,
            programId: data.programId,
        };
      await updateStaffProfile(instituteId, teacher.documentId, updateData);
      toast({
        title: '¡Éxito!',
        description: 'La información del docente ha sido actualizada.',
      });
      onClose(true); 
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la información del docente.',
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
          <DialogTitle>Editar Perfil de Docente</DialogTitle>
          <DialogDescription>
            Realiza cambios en la información del docente con N° Doc: {teacher.documentId}
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
            <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
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
            <FormField
                control={form.control}
                name="programId"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Programa de Estudios Principal</FormLabel>
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
