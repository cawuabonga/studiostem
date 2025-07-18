
"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { addStaffProfile, getPrograms } from '@/config/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { UserRole, Program } from '@/types';

const assignableRoles: UserRole[] = ['Teacher', 'Coordinator', 'Admin'];
const roleDisplayMap: Record<string, string> = {
    Teacher: 'Docente',
    Coordinator: 'Coordinador',
    Admin: 'Administrador',
}

const conditions = ['NOMBRADO', 'CONTRATADO'] as const;

const addStaffSchema = z.object({
  dni: z.string().length(8, { message: 'El DNI debe tener 8 dígitos.' }),
  displayName: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  email: z.string().email({ message: 'Email inválido.' }),
  phone: z.string().min(7, { message: 'El celular debe tener al menos 7 dígitos.' }).optional().or(z.literal('')),
  role: z.enum(assignableRoles, { required_error: 'Debe seleccionar un rol.' }),
  condition: z.enum(conditions, { required_error: 'Debe seleccionar una condición.' }),
  programId: z.string({ required_error: 'Debe seleccionar un programa.' }),
});

type AddStaffFormValues = z.infer<typeof addStaffSchema>;

interface AddStaffFormProps {
  onUserAdded: () => void;
}

export function AddStaffForm({ onUserAdded }: AddStaffFormProps) {
  const { toast } = useToast();
  const { instituteId } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [programs, setPrograms] = useState<Program[]>([]);

  useEffect(() => {
    if (instituteId) {
      getPrograms(instituteId).then(setPrograms).catch(console.error);
    }
  }, [instituteId]);

  const form = useForm<AddStaffFormValues>({
    resolver: zodResolver(addStaffSchema),
    defaultValues: {
      displayName: '',
      email: '',
      dni: '',
      phone: '',
      role: 'Teacher',
    },
  });

  const onSubmit = async (data: AddStaffFormValues) => {
    if (!instituteId) {
        toast({ title: 'Error', description: 'No se ha seleccionado un instituto.', variant: 'destructive'});
        return;
    }
    setLoading(true);
    try {
      await addStaffProfile(instituteId, {
        ...data,
      });

      toast({
        title: '¡Éxito!',
        description: `Se ha creado el perfil para ${data.displayName}. El usuario podrá reclamar este perfil desde su dashboard usando su DNI.`,
        duration: 8000
      });
      form.reset();
      onUserAdded();
    } catch (error: any) {
      let errorMessage = 'No se pudo registrar el perfil. Es posible que ya exista un perfil con ese DNI.';
       if (error.message.includes('permission-denied')) {
          errorMessage = 'No tienes permiso para realizar esta acción.';
      }
      toast({
        title: 'Error',
        description: errorMessage,
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
            name="displayName"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Nombre Completo</FormLabel>
                <FormControl>
                    <Input placeholder="Ej: Carlos Rodriguez" {...field} />
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                    <Input type="email" placeholder="carlos.rodriguez@email.com" {...field} />
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <FormLabel>Programa de Estudios</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!programs.length}>
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
         <FormDescription>
            El usuario final deberá crear su cuenta y luego validarla con su DNI desde su perfil.
        </FormDescription>
        <Button type="submit" disabled={loading}>
          {loading ? 'Registrando Perfil...' : 'Registrar Perfil de Personal'}
        </Button>
      </form>
    </Form>
  );
}
