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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { AddStudentForm } from '@/components/users/AddStudentForm';

const searchSchema = z.object({
  documentId: z.string().min(8, { message: 'El DNI debe tener 8 caracteres.' }).max(8, { message: 'El DNI debe tener 8 caracteres.' }),
});

type SearchFormValues = z.infer<typeof searchSchema>;

export default function TreasuryPaymentRegistrationPage() {
  const [loading, setLoading] = useState(false);
  const [showNewStudentDialog, setShowNewStudentDialog] = useState(false);
  const [dniData, setDniData] = useState<{ firstName: string; lastName: string; documentId: string } | null>(null);
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
        // Consultar DNI aquí antes de abrir el diálogo
        const response = await fetch('/api/consult-dni', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dni: data.documentId }),
        });
        const result = await response.json();
        if (result.success) {
          setDniData({ ...result.data, documentId: data.documentId });
        } else {
          setDniData({ firstName: '', lastName: '', documentId: data.documentId });
          toast({ title: 'Info', description: result.error || 'No se pudieron obtener los datos. Por favor, ingréselos manualmente.', variant: 'default' });
        }
        setShowNewStudentDialog(true);
      }
    } catch (error) {
      toast({ title: "Error", description: "Ocurrió un error al buscar al estudiante.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };
  
  const handleProfileCreated = () => {
    setShowNewStudentDialog(false);
    const documentId = form.getValues('documentId');
    router.push(`/dashboard/gestion-administrativa/registrar-pago-tesoreria/${documentId}`);
  };

  return (
    <>
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
      
      <Dialog open={showNewStudentDialog} onOpenChange={setShowNewStudentDialog}>
        <DialogContent className="max-w-4xl">
            <DialogHeader>
                <DialogTitle>Estudiante No Encontrado</DialogTitle>
                <DialogDescription>
                    El DNI ingresado no corresponde a un estudiante registrado. Por favor, complete el siguiente formulario para crear su perfil.
                </DialogDescription>
            </DialogHeader>
             {instituteId && dniData && (
                <AddStudentForm
                    instituteId={instituteId}
                    onProfileCreated={handleProfileCreated}
                    initialData={dniData}
                />
            )}
        </DialogContent>
      </Dialog>
    </>
  );
}
