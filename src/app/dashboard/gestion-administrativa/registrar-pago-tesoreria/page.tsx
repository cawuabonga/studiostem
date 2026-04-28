
"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Search, UserCircle, Briefcase, GraduationCap, ArrowLeft, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getStudentProfile, getStaffProfileByDocumentId, getPrograms, getRoles } from '@/config/firebase';
import { useToast } from '@/hooks/use-toast';
import { TreasuryRegisterPaymentForm } from '@/components/payments/TreasuryRegisterPaymentForm';
import { Badge } from '@/components/ui/badge';

const searchSchema = z.object({
  documentId: z.string().min(1, { message: 'Ingrese un número de documento.' }),
});

type SearchFormValues = z.infer<typeof searchSchema>;

interface PayerProfile {
    documentId: string;
    fullName: string;
    type: 'student' | 'staff' | 'external';
    programName?: string;
    roleName?: string;
}

export default function TreasuryPaymentRegistrationPage() {
  const { instituteId, hasPermission, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<PayerProfile | null>(null);
  
  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: { documentId: '' },
  });

  const onSearch = async (data: SearchFormValues) => {
    if (!instituteId) return;
    setLoading(true);
    try {
      // 1. Fetch auxiliary data for names
      const [programs, roles] = await Promise.all([
          getPrograms(instituteId),
          getRoles(instituteId)
      ]);
      const programMap = new Map(programs.map(p => [p.id, p.name]));
      const roleMap = new Map(roles.map(r => [r.id, r.name]));

      // 2. Search for Student
      const student = await getStudentProfile(instituteId, data.documentId);
      if (student) {
        setSelectedProfile({
            documentId: student.documentId,
            fullName: student.fullName,
            type: 'student',
            programName: programMap.get(student.programId) || 'N/A',
            roleName: 'Estudiante'
        });
        setLoading(false);
        return;
      }

      // 3. Search for Staff
      const staff = await getStaffProfileByDocumentId(instituteId, data.documentId);
      if (staff) {
        setSelectedProfile({
            documentId: staff.documentId,
            fullName: staff.displayName,
            type: 'staff',
            programName: programMap.get(staff.programId) || 'N/A',
            roleName: roleMap.get(staff.roleId) || staff.role || 'Personal'
        });
        setLoading(false);
        return;
      }
      
      // 4. Not found
      toast({
          title: "Documento no registrado",
          description: "No se encontró un perfil con ese documento. Puede registrarlo como pagador externo.",
      });
      setSelectedProfile(null);
      
    } catch (error) {
      toast({ title: "Error", description: "Ocurrió un error al buscar el perfil.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleExternalPayer = () => {
      const docId = form.getValues('documentId');
      if (!docId) {
          toast({ title: "Atención", description: "Ingrese un documento primero.", variant: "destructive" });
          return;
      }
      setSelectedProfile({
          documentId: docId,
          fullName: '',
          type: 'external',
          roleName: 'Pagador Externo',
          programName: 'N/A'
      });
  };

  const resetSelection = () => {
      setSelectedProfile(null);
      form.reset({ documentId: '' });
  };

  if (authLoading || !hasPermission('admin:payments:validate')) {
    return <p className="p-8">Cargando o no autorizado...</p>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
        <Card className="border-primary/20 shadow-md">
            <CardHeader className="bg-primary/5 rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                    <UserCircle className="h-6 w-6 text-primary" />
                    Búsqueda de Pagador
                </CardTitle>
                <CardDescription>
                    Ingrese el documento de identidad para cargar los datos automáticamente.
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSearch)} className="flex flex-col sm:flex-row gap-4 items-end">
                        <FormField
                            control={form.control}
                            name="documentId"
                            render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormLabel>Número de Documento (DNI, Pasaporte, etc.)</FormLabel>
                                <FormControl>
                                    <Input 
                                        placeholder="Ej: 12345678" 
                                        {...field} 
                                        disabled={!!selectedProfile || loading}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                form.handleSubmit(onSearch)();
                                            }
                                        }}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        {!selectedProfile ? (
                            <div className="flex gap-2 w-full sm:w-auto">
                                <Button type="submit" disabled={loading} className="flex-1 sm:flex-none">
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                                    Buscar
                                </Button>
                                <Button type="button" variant="outline" onClick={handleExternalPayer} disabled={loading}>
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Es Externo
                                </Button>
                            </div>
                        ) : (
                            <Button type="button" variant="ghost" onClick={resetSelection} className="text-muted-foreground">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Cambiar Pagador
                            </Button>
                        )}
                    </form>
                </Form>
            </CardContent>
        </Card>

        {selectedProfile && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-300 space-y-6">
                {/* Perfil Header */}
                <Card className="bg-muted/30 border-dashed">
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase">Nombre Completo</p>
                                <p className="font-semibold">{selectedProfile.fullName || (selectedProfile.type === 'external' ? 'Por ingresar...' : '---')}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase">Rol / Cargo</p>
                                <Badge variant="secondary" className="bg-primary/10 text-primary">{selectedProfile.roleName}</Badge>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase">Programa de Estudios</p>
                                <div className="flex items-center gap-1 text-sm">
                                    <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span>{selectedProfile.programName}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase">Estado Búsqueda</p>
                                <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                    <CheckCircle2 className="h-3 w-3 mr-1" /> Documento Validado
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Formulario de Pago */}
                <Card className="shadow-lg border-t-4 border-t-primary">
                    <CardHeader>
                        <CardTitle>Detalles del Registro de Pago</CardTitle>
                        <CardDescription>Complete la información del comprobante y adjunte el voucher.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <TreasuryRegisterPaymentForm 
                            profile={selectedProfile as any} 
                            onSuccess={resetSelection}
                        />
                    </CardContent>
                </Card>
            </div>
        )}
    </div>
  );
}

function CheckCircle2({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    )
}
