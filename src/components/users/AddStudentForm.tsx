
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
import type { Program, UnitPeriod } from '@/types';
import { Loader2 } from 'lucide-react';

const genders = ['Masculino', 'Femenino'] as const;
const periods: UnitPeriod[] = ['MAR-JUL', 'AGO-DIC'];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString());

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const addStudentSchema = z.object({
  firstName: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  lastName: z.string().min(2, { message: 'El apellido debe tener al menos 2 caracteres.' }),
  documentId: z.string().min(8, 'El DNI debe tener 8 dígitos.').max(8, 'El DNI debe tener 8 dígitos.'),
  email: z.string().email({ message: 'Email inválido.' }),
  phone: z.string().min(7, { message: 'El teléfono debe tener al menos 7 dígitos.' }).optional().or(z.literal('')),
  address: z.string().min(5, { message: 'La dirección es requerida.' }).optional().or(z.literal('')),
  age: z.coerce.number().min(15, { message: 'La edad debe ser al menos 15 años.' }),
  gender: z.enum(genders, { required_error: 'Debe seleccionar un género.' }),
  programId: z.string({ required_error: 'Debe seleccionar un programa.' }),
  admissionYear: z.string({ required_error: 'Debe seleccionar el año de admisión.' }),
  admissionPeriod: z.enum(periods, { required_error: 'Debe seleccionar el período de admisión.' }),
  photoURL: z.instanceof(FileList).optional()
    .refine(files => !files || files.length === 0 || files[0]?.size <= MAX_FILE_SIZE, `El tamaño máximo es de 2MB.`)
    .refine(
      files => !files || files.length === 0 || ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      "Solo se aceptan formatos .jpg, .jpeg, .png y .webp."
    ),
});


type AddStudentFormValues = z.infer<typeof addStudentSchema>;

interface AddStudentFormProps {
  instituteId: string;
  onProfileCreated: () => void;
  initialData?: { firstName: string; lastName: string; documentId: string } | null;
}

const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export function AddStudentForm({ instituteId, onProfileCreated, initialData = null }: AddStudentFormProps) {
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
      firstName: initialData?.firstName || '',
      lastName: initialData?.lastName || '',
      documentId: initialData?.documentId || '',
      email: '',
      phone: '',
      address: '',
      age: 0,
      gender: undefined,
      programId: '',
      admissionYear: new Date().getFullYear().toString(),
      admissionPeriod: undefined,
      photoURL: undefined,
    },
  });
  
  useEffect(() => {
    if(initialData) {
        form.reset({
            ...form.getValues(),
            firstName: initialData.firstName,
            lastName: initialData.lastName,
            documentId: initialData.documentId,
        })
    }
  }, [initialData, form])

  const onSubmit = async (data: AddStudentFormValues) => {
    setLoading(true);
    try {
      let photoDataUri = '';
      if (data.photoURL && data.photoURL.length > 0) {
          photoDataUri = await fileToDataUri(data.photoURL[0]);
      }
      
      const { photoURL, ...studentData } = data;

      await addStudentProfile(instituteId, {
        ...studentData,
        photoURL: photoDataUri,
        // Asignar el roleId por defecto para estudiantes
        roleId: 'student', 
        role: 'Student',
      });

      toast({
        title: '¡Éxito!',
        description: 'El perfil del estudiante ha sido creado.',
      });
      form.reset();
       const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement | null;
      if (fileInput) {
        fileInput.value = '';
      }
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
              <FormLabel>Foto del Estudiante (Opcional)</FormLabel>
              <FormControl>
                <Input 
                  type="file" 
                  accept="image/*" 
                  {...form.register('photoURL')} 
                />
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
        </div>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
             <FormField
                control={form.control}
                name="admissionYear"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Año de Admisión</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        </FormControl>
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
                    <FormLabel>Período de Admisión</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger><SelectValue placeholder="Seleccione período"/></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {periods.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? 'Creando Perfil...' : 'Crear Perfil de Estudiante'}
        </Button>
      </form>
    </Form>
  );
}

    
