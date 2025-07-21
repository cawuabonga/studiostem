
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
import { addStudentProfile, getPrograms } from '@/config/firebase';
import type { Program } from '@/types';
import { Loader2 } from 'lucide-react';

const genders = ['Masculino', 'Femenino'] as const;

const addStudentSchema = z.object({
  firstName: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  lastName: z.string().min(2, { message: 'El apellido debe tener al menos 2 caracteres.' }),
  dni: z.string().length(8, { message: 'El DNI debe tener 8 dígitos.' }),
  email: z.string().email({ message: 'Email inválido.' }),
  phone: z.string().min(7, { message: 'El teléfono debe tener al menos 7 dígitos.' }).optional().or(z.literal('')),
  address: z.string().min(5, { message: 'La dirección es requerida.' }).optional().or(z.literal('')),
  age: z.coerce.number().min(15, { message: 'La edad debe ser al menos 15 años.' }),
  gender: z.enum(genders, { required_error: 'Debe seleccionar un género.' }),
  programId: z.string({ required_error: 'Debe seleccionar un programa.' }),
  photoURL: z.string().url({ message: 'Debe ser una URL válida.' }).optional().or(z.literal('')),
});

type AddStudentFormValues = z.infer<typeof addStudentSchema>;

interface AddStudentFormProps {
  instituteId: string;
  onProfileCreated: () => void;
}

export function AddStudentForm({ instituteId, onProfileCreated }: AddStudentFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [programs, setPrograms] = useState<Program[]>([]);

  useEffect(() => {
    if (instituteId) {
      getPrograms(instituteId).then(setPrograms).catch(console.error);
    }
  }, [instituteId]);

  const form = useForm<AddStudentFormValues>({
    resolver: zodResolver(addStudentSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      dni: '',
      email: '',
      phone: '',
      address: '',
    },
  });

  const onSubmit = async (data: AddStudentFormValues) => {
    setLoading(true);
    try {
      await addStudentProfile(instituteId, data);
      toast({
        title: '¡Éxito!',
        description: 'El perfil del estudiante ha sido creado.',
      });
      form.reset();
      onProfileCreated();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el perfil del estudiante.',
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
          name="photoURL"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL de la Foto</FormLabel>
              <FormControl>
                <Input placeholder="https://ejemplo.com/foto.png" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Nombres</FormLabel>
                <FormControl>
                    <Input placeholder="Ej: Juan" {...field} />
                </FormControl>
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
                <FormControl>
                    <Input placeholder="Ej: Pérez García" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                name="gender"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Sexo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                        </FormControl>
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
                    <FormControl>
                        <Input type="number" {...field} />
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
                    <Input type="email" placeholder="ejemplo@email.com" {...field} />
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
                    <Input placeholder="987654321" {...field} />
                </FormControl>
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
                <FormControl>
                    <Input placeholder="Av. Siempre Viva 123" {...field} />
                </FormControl>
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
                    <SelectValue placeholder={programs.length ? "Seleccione un programa" : "Cargando programas..."} />
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
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? 'Creando Perfil...' : 'Crear Perfil de Estudiante'}
        </Button>
      </form>
    </Form>
  );
}
