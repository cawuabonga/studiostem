
"use client";

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { addStudentProfile, getPrograms } from '@/config/firebase';
import type { Program, UnitPeriod, UnitTurno } from '@/types';
import { Loader2, Search, CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { calculateAge, cn } from '@/lib/utils';
import { Timestamp } from 'firebase/firestore';

const genders = ['Masculino', 'Femenino'] as const;
const periods: UnitPeriod[] = ['MAR-JUL', 'AGO-DIC'];
const turnos: UnitTurno[] = ['Mañana', 'Tarde', 'Noche'];
const currentYear = new Date().getFullYear();
// Ampliamos el rango de años de 2015 a 2035
const years = Array.from({ length: 21 }, (_, i) => (2015 + i).toString());

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const addStudentSchema = z.object({
  firstName: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  lastName: z.string().min(2, { message: 'El apellido debe tener al menos 2 caracteres.' }),
  documentId: z.string().min(8, 'El DNI debe tener 8 dígitos.').max(8, 'El DNI debe tener 8 dígitos.'),
  email: z.string().email({ message: 'Email inválido.' }),
  phone: z.string().min(7, { message: 'El teléfono debe tener al menos 7 dígitos.' }).optional().or(z.literal('')),
  address: z.string().min(5, { message: 'La dirección es requerida.' }).optional().or(z.literal('')),
  birthDate: z.date({ required_error: 'La fecha de nacimiento es requerida.' }),
  age: z.number(),
  gender: z.enum(genders, { required_error: 'Debe seleccionar un género.' }),
  programId: z.string({ required_error: 'Debe seleccionar un programa.' }),
  admissionYear: z.string({ required_error: 'Debe seleccionar el año de admisión.' }),
  admissionPeriod: z.enum(periods, { required_error: 'Debe seleccionar el período de admisión.' }),
  turno: z.enum(turnos, { required_error: 'Debe seleccionar un turno.' }),
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
  const [isConsultingDni, setIsConsultingDni] = useState(false);


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
      turno: undefined,
      photoURL: undefined,
    },
  });
  
  const watchedBirthDate = form.watch('birthDate');

  useEffect(() => {
    if (watchedBirthDate) {
        const age = calculateAge(watchedBirthDate);
        form.setValue('age', age);
    }
  }, [watchedBirthDate, form]);

  useEffect(() => {
    if(initialData) {
        form.reset({
            ...form.getValues(),
            firstName: initialData.firstName,
            lastName: initialData.lastName,
            documentId: initialData.documentId,
        })
    }
  }, [initialData, form]);

  const handleDniLookup = async () => {
    const dni = form.getValues('documentId');
    if (dni.length !== 8) {
        form.setError('documentId', { type: 'manual', message: 'El DNI debe tener 8 dígitos.' });
        return;
    }
    setIsConsultingDni(true);
    try {
        const response = await fetch('/api/consult-dni', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dni }),
        });
        const result = await response.json();
        if (result.success) {
            form.setValue('firstName', result.data.firstName, { shouldValidate: true });
            form.setValue('lastName', result.data.lastName, { shouldValidate: true });
            toast({ title: 'Éxito', description: 'Datos del estudiante encontrados y rellenados.' });
        } else {
             toast({ title: 'Error en la Consulta', description: result.error, variant: 'destructive' });
        }
    } catch (error) {
        toast({ title: 'Error de Red', description: 'No se pudo conectar con el servicio de consulta.', variant: 'destructive' });
    } finally {
        setIsConsultingDni(false);
    }
  };

  const onSubmit = async (data: AddStudentFormValues) => {
    setLoading(true);
    try {
      let photoDataUri = '';
      if (data.photoURL && data.photoURL.length > 0) {
          photoDataUri = await fileToDataUri(data.photoURL[0]);
      }
      
      const { photoURL, birthDate, ...studentData } = data;

      await addStudentProfile(instituteId, {
        ...studentData,
        birthDate: Timestamp.fromDate(birthDate),
        photoURL: photoDataUri,
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
                        <div className="flex gap-2">
                             <FormControl>
                                <Input placeholder="12345678" {...field} />
                            </FormControl>
                            <Button type="button" onClick={handleDniLookup} disabled={isConsultingDni}>
                                {isConsultingDni ? <Loader2 className="h-4 w-4 animate-spin"/> : <Search className="h-4 w-4"/>}
                                <span className="ml-2 hidden sm:inline">Consultar DNI</span>
                            </Button>
                        </div>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                name="birthDate"
                render={({ field }) => (
                    <FormItem className="flex flex-col pt-2">
                    <FormLabel className="mb-1">Fecha de Nacimiento</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                            )}
                            >
                            {field.value ? (
                                format(field.value, "PPP", { locale: es })
                            ) : (
                                <span>Seleccione fecha</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                            date > new Date() || date < new Date("1950-01-01")
                            }
                            captionLayout="dropdown-buttons"
                            fromYear={1950}
                            toYear={new Date().getFullYear()}
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <div className="space-y-2">
                <FormLabel>Edad Calculada</FormLabel>
                <div className="h-10 px-3 py-2 rounded-md border bg-muted flex items-center font-bold text-primary">
                    {form.watch('age') || 0} años
                </div>
            </div>
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="turno"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Turno Inicial Asignado</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger><SelectValue placeholder="Turno..." /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {turnos.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <FormDescription>Se usará para filtrar las unidades en la matrícula.</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? 'Creando Perfil...' : 'Crear Perfil de Estudiante'}
        </Button>
      </form>
    </Form>
  );
}
