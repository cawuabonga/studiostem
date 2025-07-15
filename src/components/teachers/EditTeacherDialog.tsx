
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
import { updateTeacher, getStudyPrograms } from '@/config/firebase';
import type { Teacher, StudyProgram, TeacherCondition } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

const teacherSchema = z.object({
  dni: z.string().length(8, { message: 'El DNI debe tener 8 dígitos.' }),
  fullName: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  email: z.string().email({ message: 'Por favor, ingrese un correo electrónico válido.' }),
  phone: z.string().min(9, { message: 'El celular debe tener al menos 9 dígitos.' }),
  studyProgram: z.string({ required_error: 'Debe seleccionar un programa de estudios.' }),
  condition: z.enum(['Nombrado', 'Contratado'], { required_error: 'Debe seleccionar una condición.' }),
});

type EditTeacherFormValues = z.infer<typeof teacherSchema>;

const conditionOptions: TeacherCondition[] = ['Nombrado', 'Contratado'];

interface EditTeacherDialogProps {
  teacher: Teacher;
  isOpen: boolean;
  onClose: (updated?: boolean) => void;
}

export function EditTeacherDialog({ teacher, isOpen, onClose }: EditTeacherDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [studyPrograms, setStudyPrograms] = useState<StudyProgram[]>([]);
  const [programsLoading, setProgramsLoading] = useState(true);
  const { instituteId } = useAuth();

  const form = useForm<EditTeacherFormValues>({
    resolver: zodResolver(teacherSchema),
    defaultValues: teacher,
  });

  useEffect(() => {
    if (isOpen && instituteId) {
      const fetchPrograms = async () => {
        setProgramsLoading(true);
        try {
          const programs = await getStudyPrograms(instituteId);
          setStudyPrograms(programs);
        } catch (error) {
          console.error("Failed to fetch study programs:", error);
        } finally {
          setProgramsLoading(false);
        }
      };
      fetchPrograms();
      form.reset(teacher);
    }
  }, [teacher, form, isOpen, instituteId]);

  const onSubmit = async (data: EditTeacherFormValues) => {
    if (!teacher?.id || !instituteId) return;
    setIsSubmitting(true);
    try {
      await updateTeacher(instituteId, teacher.id, data);
      toast({
        title: '¡Éxito!',
        description: 'La información del docente ha sido actualizada.',
      });
      onClose(true);
    } catch (error) {
      console.error('Error updating teacher:', error);
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
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Docente</DialogTitle>
          <DialogDescription>
            Modifica los detalles del docente. Los cambios se guardarán permanentemente.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="dni" render={({ field }) => (
                <FormItem>
                  <FormLabel>DNI</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="fullName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombres Completos</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo Electrónico</FormLabel>
                  <FormControl><Input type="email" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Celular</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="studyProgram" render={({ field }) => (
                <FormItem>
                  <FormLabel>Programa de Estudios</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={programsLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={programsLoading ? "Cargando..." : "Seleccione"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {studyPrograms.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="condition" render={({ field }) => (
                <FormItem>
                  <FormLabel>Condición</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {conditionOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
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
