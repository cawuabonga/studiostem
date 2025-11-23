"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/contexts/AuthContext';
import { GoogleSignInButton } from './GoogleSignInButton';

const registerSchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }),
  email: z.string().email({ message: 'Dirección de correo inválida' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const { signUpWithEmail, loading } = useAuth();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    await signUpWithEmail(data.name, data.email, data.password);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold">Nombre Completo</FormLabel>
                <FormControl>
                  <Input placeholder="Tu Nombre Completo" {...field} className="h-12" />
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
              <FormLabel className="font-semibold">Correo Electrónico</FormLabel>
              <FormControl>
                <Input type="email" placeholder="tu@email.com" {...field} className="h-12"/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold">Contraseña</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} className="h-12"/>
                </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="space-y-4 pt-4">
             <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
                {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </Button>
            <GoogleSignInButton />
        </div>
      </form>
    </Form>
  );
}
