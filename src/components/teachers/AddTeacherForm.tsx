
"use client";

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { addTeacher, getStudyPrograms } from '@/config/firebase';
import type { StudyProgram, TeacherCondition } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

const teacherSchema = z.object({
  dni: z.string().length(8, { message: 'El DNI debe tener 8 dígitos.' }),
  fullName: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  email: z.string().email({ message: 'Por favor, ingrese un correo electrónico válido.' }),
  phone: z.string().min(9, { message: 'El celular debe tener al menos 9 dígitos.' }),
  studyProgram: z.string({ required_error: 'Debe seleccionar un programa de estudios.' }),
  condition: z.enum(['Nombrado', 'Contratado'], { required_error: 'Debe seleccionar una condición.' }),
});

type TeacherFormValues = z.infer<typeof teacherSchema>;

interface AddTeacherFormProps {
  onTeacherAdded: () => void;
}

const conditionOptions: TeacherCondition[] = ['Nombrado', 'Contratado'];

export function AddTeacherForm({ onTeacherAdded }: AddTeacherFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [studyPrograms, setStudyPrograms] = useState<StudyProgram[]>([]);
  const [programsLoading, setProgramsLoading] = useState(true);
  const { instituteId } = useAuth();

  useEffect(() => {
    if (!instituteId) return;
    const fetchPrograms = async () => {
      try {
        const programs = await getStudyPrograms(instituteId);
        setStudyPrograms(programs);
      } catch (error) {
        console.error("Failed to fetch study programs:", error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los programas de estudio.',
          variant: 'destructive',
        });
      } finally {
        setProgramsLoading(false);
      }
    };
    fetchPrograms();
  }, [toast, instituteId]);

  const form = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      dni: '',
      fullName: '',
      email: '',
      phone: '',
    },
  });

  const onSubmit = async (data: TeacherFormValues) => {
    if (!instituteId) return;
    setLoading(true);
    try {
      await addTeacher(instituteId, data);
      toast({
        title: '¡Éxito!',
        description: 'El docente ha sido registrado correctamente.',
      });
      form.reset();
      onTeacherAdded();
    } catch (error) {
      console.error('Error adding teacher:', error);
      toast({
        title: 'Error',
        description: 'No se pudo registrar al docente. Intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="dni"
            render={({ field }) => (
              <FormItem>
                <FormLabel>DNI</FormLabel>
                <FormControl>
                  <Input placeholder="12345678" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombres Completos</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
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
                <FormLabel>Correo Electrónico</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="john.doe@example.com" {...field} />
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
                <FormLabel>Celular</FormLabel>
                <FormControl>
                  <Input placeholder="987654321" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="studyProgram"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Programa de Estudios</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={programsLoading}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={programsLoading ? "Cargando..." : "Seleccione un programa"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {studyPrograms.map(program => <SelectItem key={program.id} value={program.name}>{program.name}</SelectItem>)}
                  </SelectContent>
                </Select>
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
                      <SelectValue placeholder="Seleccione una condición" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {conditionOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" className="w-full md:w-auto" disabled={loading}>
          {loading ? 'Registrando...' : 'Registrar Docente'}
        </Button>
      </form>
    </Form>
  );
}
