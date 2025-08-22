
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
import { useAuth } from '@/contexts/AuthContext';
import { addStaffProfile, getPrograms, getRoles } from '@/config/firebase';
import type { Program, Role } from '@/types';

const conditions = ['NOMBRADO', 'CONTRATADO'] as const;

const addStaffSchema = z.object({
  displayName: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  documentId: z.string().min(8, { message: 'El documento debe tener al menos 8 caracteres.' }),
  email: z.string().email({ message: 'Email inválido.' }),
  phone: z.string().min(7, { message: 'El celular debe tener al menos 7 dígitos.' }).optional().or(z.literal('')),
  roleId: z.string({ required_error: 'Debe seleccionar un rol.' }),
  condition: z.enum(conditions, { required_error: 'Debe seleccionar una condición.' }),
  programId: z.string({ required_error: 'Debe seleccionar un programa.' }),
});

type AddStaffFormValues = z.infer<typeof addStaffSchema>;

interface AddStaffFormProps {
  instituteId: string;
  onProfileCreated: () => void;
}

export function AddStaffForm({ instituteId, onProfileCreated }: AddStaffFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    if (instituteId) {
      getPrograms(instituteId).then(setPrograms).catch(console.error);
      getRoles(instituteId).then(setRoles).catch(console.error);
    }
  }, [instituteId]);

  const form = useForm<AddStaffFormValues>({
    resolver: zodResolver(addStaffSchema),
    defaultValues: {
      displayName: '',
      documentId: '',
      email: '',
      phone: '',
    },
  });

  const onSubmit = async (data: AddStaffFormValues) => {
    setLoading(true);
    const selectedRole = roles.find(r => r.id === data.roleId);
    if (!selectedRole) {
      toast({ title: "Error", description: "Rol seleccionado no es válido.", variant: "destructive"});
      setLoading(false);
      return;
    }

    try {
      await addStaffProfile(instituteId, { 
        ...data, 
        role: selectedRole.name as any, // Legacy role name for now
      });
      toast({
        title: '¡Éxito!',
        description: 'El perfil del personal ha sido creado. El usuario podrá reclamarlo desde su dashboard.',
      });
      form.reset();
      onProfileCreated();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el perfil.',
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
            name="displayName"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Nombre Completo</FormLabel>
                <FormControl>
                    <Input placeholder="Ej: Maria Lopez" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="documentId"
            render={({ field }) => (
                <FormItem>
                <FormLabel>N° Documento</FormLabel>
                <FormControl>
                    <Input placeholder="Documento de Identidad" {...field} />
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
                    <Input type="email" placeholder="maria.lopez@email.com" {...field} />
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
                name="roleId"
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
                        {roles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                            {role.name}
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
                <FormLabel>Programa de Estudios</FormLabel>
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
          {loading ? 'Creando Perfil...' : 'Crear Perfil de Personal'}
        </Button>
      </form>
    </Form>
  );
}
