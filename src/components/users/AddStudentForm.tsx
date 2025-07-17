
"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { createInstituteUser } from '@/config/firebase';

const addStudentSchema = z.object({
  displayName: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  dni: z.string().length(8, { message: 'El DNI debe tener 8 dígitos.' }).optional().or(z.literal('')),
  email: z.string().email({ message: 'Email inválido.' }),
});

type AddStudentFormValues = z.infer<typeof addStudentSchema>;

interface AddStudentFormProps {
  onUserAdded: () => void;
}

export function AddStudentForm({ onUserAdded }: AddStudentFormProps) {
  const { toast } = useToast();
  const { instituteId } = useAuth();
  const [loading, setLoading] = React.useState(false);

  const form = useForm<AddStudentFormValues>({
    resolver: zodResolver(addStudentSchema),
    defaultValues: {
      displayName: '',
      dni: '',
      email: '',
    },
  });

  const onSubmit = async (data: AddStudentFormValues) => {
    if (!instituteId) {
        toast({ title: 'Error', description: 'No se ha seleccionado un instituto.', variant: 'destructive'});
        return;
    }
    setLoading(true);
    try {
      // In a real app, this would call a secure backend function
      await createInstituteUser(instituteId, {
        ...data,
        role: 'Student',
        uid: '', // Placeholder
        instituteId: instituteId,
        photoURL: null,
        password: 'password123', // Temporary password
      });

      toast({
        title: '¡Éxito!',
        description: `Se ha creado el usuario para ${data.displayName}. Deberá usar "Olvidé mi contraseña" para establecer una contraseña.`,
        duration: 8000
      });
      form.reset();
      onUserAdded();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo registrar al estudiante.',
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
              <FormLabel>Nombre Completo del Estudiante</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Maria Vargas" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="dni"
            render={({ field }) => (
              <FormItem>
                <FormLabel>DNI (Opcional)</FormLabel>
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
                  <Input type="email" placeholder="maria.vargas@email.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormDescription>
            La contraseña temporal será 'password123'. El nuevo usuario deberá usar la opción de "Olvidé mi contraseña" en el login para establecer su propia contraseña.
        </FormDescription>
        <Button type="submit" disabled={loading}>
          {loading ? 'Registrando...' : 'Registrar Estudiante'}
        </Button>
      </form>
    </Form>
  );
}
