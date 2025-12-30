"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getStudentProfile } from '@/config/firebase';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const searchSchema = z.object({
  documentId: z.string().min(8, { message: 'El DNI debe tener 8 caracteres.' }).max(8, { message: 'El DNI debe tener 8 caracteres.' }),
});

type SearchFormValues = z.infer<typeof searchSchema>;

export default function TreasuryPaymentRegistrationPage() {
  const [loading, setLoading] = useState(false);
  const { instituteId } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: { documentId: '' },
  });

  const onSubmit = async (data: SearchFormValues) => {
    if (!instituteId) return;
    setLoading(true);
    try {
      const studentProfile = await getStudentProfile(instituteId, data.documentId);
      if (studentProfile) {
        router.push(`/dashboard/gestion-administrativa/registrar-pago-tesoreria/${studentProfile.documentId}`);
      } else {
        toast({
            title: "Estudiante No Encontrado",
            description: `No se encontró un estudiante con el DNI ${data.documentId}. Redirigiendo al formulario de registro.`,
            duration: 5000,
        });
        // Redirect to the main student registration page
        router.push('/dashboard/gestion-usuarios/registrar-estudiante');
      }
    } catch (error) {
      toast({ title: "Error", description: "Ocurrió un error al buscar al estudiante.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-xl mx-auto">
        <CardHeader>
          <CardTitle>Registrar Pago de Estudiante</CardTitle>
          <CardDescription>
            Ingresa el número de documento de identidad del estudiante para iniciar el registro de un nuevo pago.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-4">
              <FormField
                control={form.control}
                name="documentId"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>DNI del Estudiante</FormLabel>
                    <FormControl>
                      <Input placeholder="Ingrese DNI..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="self-end" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                Buscar Estudiante
              </Button>
            </form>
          </Form>
        </CardContent>
    </Card>
  );
}
