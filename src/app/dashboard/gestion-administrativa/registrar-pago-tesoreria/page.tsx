
"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getStudentProfile, getStaffProfileByDocumentId } from '@/config/firebase';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const searchSchema = z.object({
  documentId: z.string().min(8, { message: 'El DNI debe tener 8 caracteres.' }).max(8, { message: 'El DNI debe tener 8 caracteres.' }),
});

type SearchFormValues = z.infer<typeof searchSchema>;

export default function TreasuryPaymentRegistrationPage() {
  const [loading, setLoading] = useState(false);
  const { user, instituteId, hasPermission, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  
  const [isExternalPayerDialogOpen, setIsExternalPayerDialogOpen] = useState(false);
  const [externalPayerDni, setExternalPayerDni] = useState('');
  const [externalPayerName, setExternalPayerName] = useState('');

  useEffect(() => {
    if (!authLoading && !hasPermission('admin:payments:validate')) {
      router.push('/dashboard');
    }
  }, [authLoading, hasPermission, router]);


  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: { documentId: '' },
  });

  const onSubmit = async (data: SearchFormValues) => {
    if (!instituteId) return;
    setLoading(true);
    try {
      // 1. Search for Student
      const studentProfile = await getStudentProfile(instituteId, data.documentId);
      if (studentProfile) {
        router.push(`/dashboard/gestion-administrativa/registrar-pago-tesoreria/${studentProfile.documentId}?type=student`);
        return;
      }

      // 2. Search for Staff
      const staffProfile = await getStaffProfileByDocumentId(instituteId, data.documentId);
      if (staffProfile) {
        router.push(`/dashboard/gestion-administrativa/registrar-pago-tesoreria/${staffProfile.documentId}?type=staff`);
        return;
      }
      
      // 3. Not found, treat as External Payer
      setExternalPayerDni(data.documentId);
      setIsExternalPayerDialogOpen(true);
      
    } catch (error) {
      toast({ title: "Error", description: "Ocurrió un error al buscar el perfil.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleExternalPayerSubmit = () => {
    if (!externalPayerName.trim()) {
        toast({ title: 'Dato requerido', description: 'Por favor ingrese el nombre completo del pagador.', variant: 'destructive' });
        return;
    }
    const queryParams = new URLSearchParams({
        type: 'external',
        name: externalPayerName,
    }).toString();
    
    router.push(`/dashboard/gestion-administrativa/registrar-pago-tesoreria/${externalPayerDni}?${queryParams}`);
    setIsExternalPayerDialogOpen(false);
  };
  
   if (authLoading || !hasPermission('admin:payments:validate')) {
    return <p>Cargando o no autorizado...</p>;
  }

  return (
    <>
    <Card className="max-w-xl mx-auto">
        <CardHeader>
          <CardTitle>Registrar Pago</CardTitle>
          <CardDescription>
            Ingresa el DNI del pagador (estudiante, personal o externo) para iniciar el registro.
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
                    <FormLabel>DNI del Pagador</FormLabel>
                    <FormControl>
                      <Input placeholder="Ingrese DNI..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="self-end" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                Buscar
              </Button>
            </form>
          </Form>
        </CardContent>
    </Card>

    <Dialog open={isExternalPayerDialogOpen} onOpenChange={setIsExternalPayerDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Pagador Externo No Encontrado</DialogTitle>
                <DialogDescription>
                    El DNI {externalPayerDni} no está registrado como estudiante o personal. Por favor, ingrese el nombre completo para continuar con el registro del pago.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-2">
                <Label htmlFor="external-name">Nombre Completo del Pagador</Label>
                <Input 
                    id="external-name"
                    value={externalPayerName}
                    onChange={(e) => setExternalPayerName(e.target.value)}
                    placeholder="Nombres y Apellidos Completos"
                />
            </div>
            <DialogFooter>
                <DialogClose asChild><Button variant="ghost">Cancelar</Button></DialogClose>
                <Button onClick={handleExternalPayerSubmit}>Continuar</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
