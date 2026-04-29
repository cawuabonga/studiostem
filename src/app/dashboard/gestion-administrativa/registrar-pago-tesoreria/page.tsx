
"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Search, UserCircle, Briefcase, GraduationCap, ArrowLeft, UserPlus, Fingerprint, ShieldCheck, Upload } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getStudentProfile, getStaffProfileByDocumentId, getPrograms, getRoles } from '@/config/firebase';
import { useToast } from '@/hooks/use-toast';
import { TreasuryRegisterPaymentForm } from '@/components/payments/TreasuryRegisterPaymentForm';
import { BulkUploadPayments } from '@/components/payments/BulkUploadPayments';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

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
  
  const searchForm = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: { documentId: '' },
  });

  const onSearch = async (data: SearchFormValues) => {
    if (!instituteId) return;
    setLoading(true);
    try {
      const [programs, roles] = await Promise.all([
          getPrograms(instituteId),
          getRoles(instituteId)
      ]);
      const programMap = new Map(programs.map(p => [p.id, p.name]));
      const roleMap = new Map(roles.map(r => [r.id, r.name]));

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
      const docId = searchForm.getValues('documentId');
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
      searchForm.reset({ documentId: '' });
  };

  if (authLoading || !hasPermission('admin:payments:validate')) {
    return <p className="p-8">Cargando o no autorizado...</p>;
  }

  return (
    <div className="space-y-6 pb-12">
        <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="bulk-upload" className="border-none">
                <AccordionTrigger className="bg-muted/50 px-6 rounded-lg hover:no-underline">
                    <div className="flex items-center gap-2">
                        <Upload className="h-5 w-5 text-primary" />
                        <span className="text-base font-bold">Carga Masiva de Pagos desde Excel</span>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="pt-6 px-4">
                    <Card className="border-dashed">
                        <CardHeader>
                            <CardTitle>Importación por Lotes</CardTitle>
                            <CardDescription>
                                Utilice esta herramienta para registrar múltiples pagos a la vez. Los montos ingresados en el Excel serán respetados independientemente de las tasas actuales.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <BulkUploadPayments onUploadSuccess={resetSelection} />
                        </CardContent>
                    </Card>
                </AccordionContent>
            </AccordionItem>
        </Accordion>

        <Separator className="my-6" />

        {!selectedProfile ? (
            <div className="max-w-xl mx-auto pt-12 animate-in fade-in zoom-in-95 duration-500">
                <Card className="border-primary/20 shadow-2xl">
                    <CardHeader className="text-center bg-primary/5 rounded-t-lg">
                        <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                            <Fingerprint className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle className="text-2xl">Terminal de Cobranza Manual</CardTitle>
                        <CardDescription>
                            Ingrese el documento del pagador para iniciar el registro.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-8">
                        <Form {...searchForm}>
                            <form onSubmit={searchForm.handleSubmit(onSearch)} className="space-y-6">
                                <FormField
                                    control={searchForm.control}
                                    name="documentId"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold">Número de Documento de Identidad</FormLabel>
                                        <FormControl>
                                            <Input 
                                                placeholder="DNI, Pasaporte o Carné" 
                                                {...field} 
                                                className="h-12 text-lg text-center font-mono tracking-widest"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                <div className="flex flex-col gap-2">
                                    <Button type="submit" size="lg" disabled={loading} className="w-full h-12 text-base">
                                        {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Search className="mr-2 h-5 w-5" />}
                                        Buscar Pagador
                                    </Button>
                                    <Button type="button" variant="ghost" onClick={handleExternalPayer} disabled={loading} className="text-muted-foreground">
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Registrar como Pagador Externo
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Lateral: Búsqueda y Perfil */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="border-primary/20 shadow-sm">
                        <CardHeader className="py-4">
                            <CardTitle className="text-sm font-bold uppercase text-muted-foreground">Cambiar Pagador</CardTitle>
                        </CardHeader>
                        <CardContent className="pb-4">
                             <Button type="button" variant="outline" onClick={resetSelection} className="w-full justify-start text-muted-foreground">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Nueva Búsqueda
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="bg-primary text-primary-foreground border-t-8 border-t-accent shadow-lg sticky top-20">
                        <CardHeader className="pb-2">
                             <div className="flex justify-between items-center mb-4">
                                <div className="bg-white/20 p-2 rounded-lg">
                                    <UserCircle className="h-8 w-8 text-white" />
                                </div>
                                <Badge variant="secondary" className="bg-accent text-accent-foreground border-none font-black uppercase text-[10px]">
                                    {selectedProfile.roleName}
                                </Badge>
                             </div>
                             <CardTitle className="text-xl leading-tight">{selectedProfile.fullName || 'PAGADOR EXTERNO'}</CardTitle>
                             <CardDescription className="text-primary-foreground/70 font-mono">
                                ID: {selectedProfile.documentId}
                             </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-2">
                            <Separator className="bg-white/10" />
                            <div className="space-y-3">
                                <div className="flex gap-3">
                                    <Briefcase className="h-4 w-4 shrink-0 opacity-70" />
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] uppercase font-bold opacity-60">Categoría</p>
                                        <p className="text-sm font-medium">{selectedProfile.type.toUpperCase()}</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <GraduationCap className="h-4 w-4 shrink-0 opacity-70" />
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] uppercase font-bold opacity-60">Programa de Estudios</p>
                                        <p className="text-sm font-medium leading-tight">{selectedProfile.programName}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-4">
                                <Badge variant="outline" className="w-full justify-center bg-green-500/10 text-green-300 border-green-500/20 py-1">
                                    <ShieldCheck className="h-3 w-3 mr-2" /> Identidad Validada
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Principal: Formulario de Pago */}
                <div className="lg:col-span-8">
                    <Card className="shadow-2xl border-none h-full">
                        <CardHeader className="bg-muted/30 border-b">
                            <CardTitle className="text-2xl font-black text-primary">Detalles del Registro de Pago</CardTitle>
                            <CardDescription>Ingrese la información del comprobante físico entregado al usuario.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-8">
                            <TreasuryRegisterPaymentForm 
                                profile={selectedProfile as any} 
                                onSuccess={resetSelection}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        )}
    </div>
  );
}
