
"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { addStaffProfile, getPrograms } from '@/config/firebase';
import type { Program } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const conditions = ['NOMBRADO', 'CONTRATADO'] as const;

const addTeacherSchema = z.object({
  displayName: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  documentId: z.string().min(8, { message: 'El documento de identidad debe tener al menos 8 caracteres.' }),
  email: z.string().email({ message: 'Email inválido.' }),
  phone: z.string().min(7, { message: 'El teléfono debe tener al menos 7 dígitos.' }),
  condition: z.enum(conditions, { required_error: 'Debe seleccionar una condición.' }),
  programId: z.string({ required_error: 'Debe seleccionar un programa.' }),
});

type AddTeacherFormValues = z.infer<typeof addTeacherSchema>;

interface AddTeacherFormProps {
  instituteId: string;
  onTeacherAdded: () => void;
}

export function AddTeacherForm({ instituteId, onTeacherAdded }: AddTeacherFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [programs, setPrograms] = React.useState<Program[]>([]);

  React.useEffect(() => {
    if (instituteId) {
      getPrograms(instituteId).then(setPrograms).catch(console.error);
    }
  }, [instituteId]);

  const form = useForm<AddTeacherFormValues>({
    resolver: zodResolver(addTeacherSchema),
    defaultValues: {
      displayName: '',
      documentId: '',
      email: '',
      phone: '',
    },
  });

  const onSubmit = async (data: AddTeacherFormValues) => {
    setLoading(true);
    try {
      // Create a StaffProfile with the role of 'Teacher'
      await addStaffProfile(instituteId, { ...data, role: 'Teacher' });
      toast({
        title: '¡Éxito!',
        description: 'El perfil del docente ha sido registrado.',
      });
      form.reset();
      onTeacherAdded();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo registrar al docente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre Completo</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Juan Pérez" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="documentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>N° Documento</FormLabel>
                <FormControl>
                  <Input placeholder="12345678" {...field} />
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
                  <Input type="email" placeholder="juan.perez@email.com" {...field} />
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
                <FormLabel>Teléfono</FormLabel>
                <FormControl>
                  <Input placeholder="987654321" {...field} />
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
        <Button type="submit" disabled={loading}>
          {loading ? 'Registrando...' : 'Registrar Docente'}
        </Button>
      </form>
    </Form>
  );
}
