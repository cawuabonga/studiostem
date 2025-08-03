
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
import type { StudentProfile, Program, UnitPeriod } from '@/types';
import { updateStudentProfile, getPrograms } from '@/config/firebase';
import { Loader2 } from 'lucide-react';

const genders = ['Masculino', 'Femenino'] as const;
const periods: UnitPeriod[] = ['MAR-JUL', 'AGO-DIC'];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString());

const editStudentSchema = z.object({
  firstName: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  lastName: z.string().min(2, { message: 'El apellido debe tener al menos 2 caracteres.' }),
  email: z.string().email({ message: 'Email inválido.' }),
  phone: z.string().min(7, { message: 'El teléfono debe tener al menos 7 dígitos.' }).optional().or(z.literal('')),
  address: z.string().min(5, { message: 'La dirección es requerida.' }).optional().or(z.literal('')),
  age: z.coerce.number().min(15, { message: 'La edad debe ser al menos 15 años.' }),
  gender: z.enum(genders, { required_error: 'Debe seleccionar un género.' }),
  programId: z.string({ required_error: 'Debe seleccionar un programa.' }),
  admissionYear: z.string({ required_error: 'Debe seleccionar el año de admisión.' }),
  admissionPeriod: z.enum(periods, { required_error: 'Debe seleccionar el período de admisión.' }),
});

type EditStudentFormValues = z.infer<typeof editStudentSchema>;

interface EditStudentProfileDialogProps {
  profile: StudentProfile;
  instituteId: string;
  isOpen: boolean;
  onClose: (updated?: boolean) => void;
}

export function EditStudentProfileDialog({ profile, instituteId, isOpen, onClose }: EditStudentProfileDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [programs, setPrograms] = useState<Program[]>([]);

  useEffect(() => {
    if (instituteId) {
      getPrograms(instituteId).then(setPrograms).catch(console.error);
    }
  }, [instituteId]);

  const form = useForm<EditStudentFormValues>({
    resolver: zodResolver(editStudentSchema),
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phone: profile.phone,
        address: profile.address,
        age: profile.age,
        gender: profile.gender,
        programId: profile.programId,
        admissionYear: profile.admissionYear,
        admissionPeriod: profile.admissionPeriod,
      });
    }
  }, [profile, form, isOpen]);

  const onSubmit = async (data: EditStudentFormValues) => {
    setIsSubmitting(true);
    try {
      await updateStudentProfile(instituteId, profile.documentId, data);
      toast({
        title: '¡Éxito!',
        description: 'El perfil del estudiante ha sido actualizado.',
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
          <DialogTitle>Editar Perfil de Estudiante</DialogTitle>
          <DialogDescription>
            Modificando el perfil para {profile.fullName} (DNI: {profile.documentId}).
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Nombres</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Apellidos</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Sexo</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                            <SelectContent>
                            {genders.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Edad</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl><Input type="email" {...field} /></FormControl>
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
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            
             <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Dirección</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <FormField
                    control={form.control}
                    name="programId"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Programa</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                        <SelectContent>
                            {programs.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="admissionYear"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Año Admisión</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                            <SelectContent>
                            {years.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="admissionPeriod"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Período Admisión</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                            <SelectContent>
                            {periods.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                            </SelectContent>
                        </Select>
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
