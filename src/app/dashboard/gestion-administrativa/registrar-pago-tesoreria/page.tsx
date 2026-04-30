
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Search, Briefcase, GraduationCap, ArrowLeft, UserPlus, Fingerprint, ShieldCheck, Upload, History, Info, CreditCard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getStudentProfile, getStaffProfileByDocumentId, getPrograms, getRoles, getRecentApprovedPayments } from '@/config/firebase';
import { useToast } from '@/hooks/use-toast';
import { TreasuryRegisterPaymentForm } from '@/components/payments/TreasuryRegisterPaymentForm';
import { BulkUploadPayments } from '@/components/payments/BulkUploadPayments';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import type { Payment } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';

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
    photoURL?: string;
}

export default function TreasuryPaymentRegistrationPage() {
  const { instituteId, hasPermission, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<PayerProfile | null>(null);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  
  const searchForm = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: { documentId: '' },
  });

  const fetchRecent = useCallback(async () => {
    if (!instituteId) return;
    try {
        const recent = await getRecentApprovedPayments(instituteId, 6);
        setRecentPayments(recent);
    } catch (e) {
        console.error("Error fetching recent payments", e);
    }
  }, [instituteId]);

  useEffect(() => {
    fetchRecent();
  }, [fetchRecent]);

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
            roleName: 'Estudiante',
            photoURL: student.photoURL
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
      fetchRecent();
  };

  if (authLoading || !hasPermission('admin:payments:validate')) {
    return <p className="p-8">Cargando o no autorizado...</p>;
  }

  return (
    <div className="space-y-8 pb-12">
        {/* Superior: Terminal de Cobranza y Actividad Reciente */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
            
            {/* IZQUIERDA: Estación de Cobro */}
            <div className="lg:col-span-8">
                {!selectedProfile ? (
                    <Card className="border-primary/20 shadow-xl overflow-hidden h-full">
                        <CardHeader className="bg-primary/5 border-b flex flex-row items-center gap-4 py-4">
                            <div className="bg-primary/10 p-2 rounded-full">
                                <Fingerprint className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-black uppercase tracking-tight">Terminal de Cobro</CardTitle>
                                <CardDescription>Identifique al pagador para iniciar la transacción.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-8 pb-12">
                            <Form {...searchForm}>
                                <form onSubmit={searchForm.handleSubmit(onSearch)} className="flex flex-col sm:flex-row gap-4 items-end">
                                    <FormField
                                        control={searchForm.control}
                                        name="documentId"
                                        render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <FormLabel className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Documento de Identidad</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    placeholder="DNI, Pasaporte o Carné" 
                                                    {...field} 
                                                    className="h-14 text-2xl font-mono tracking-[0.3em] text-center"
                                                    onKeyDown={(e) => e.key === 'Enter' && searchForm.handleSubmit(onSearch)()}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <Button type="submit" size="lg" disabled={loading} className="flex-1 sm:w-48 h-14 shadow-lg">
                                            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Search className="mr-2 h-5 w-5" />}
                                            BUSCAR
                                        </Button>
                                        <Button type="button" variant="outline" size="lg" onClick={handleExternalPayer} disabled={loading} className="h-14 px-6 border-2">
                                            <UserPlus className="h-6 w-6" />
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                            <div className="mt-8 p-4 bg-muted/30 rounded-lg border border-dashed flex items-center gap-3">
                                <Info className="h-5 w-5 text-muted-foreground" />
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Los perfiles registrados autocompletarán los datos y se vincularán al historial académico del alumno. 
                                    Use el botón (+) para cobros a externos.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 animate-in fade-in slide-in-from-left-4 duration-500">
                        {/* Perfil Seleccionado */}
                        <div className="md:col-span-4">
                            <Card className="bg-primary text-primary-foreground border-none shadow-xl h-full">
                                <CardHeader className="pb-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <Avatar className="w-20 h-20 border-4 border-white/20 shadow-2xl">
                                            <AvatarImage src={selectedProfile.photoURL} />
                                            <AvatarFallback className="bg-white/10 text-2xl font-black">
                                                {selectedProfile.fullName ? selectedProfile.fullName.charAt(0) : 'E'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <Button variant="ghost" size="icon" onClick={resetSelection} className="text-white/60 hover:text-white hover:bg-white/10 rounded-full">
                                            <ArrowLeft className="h-6 w-6" />
                                        </Button>
                                    </div>
                                    <CardTitle className="text-xl font-bold leading-tight uppercase tracking-tighter">
                                        {selectedProfile.fullName || 'PAGADOR EXTERNO'}
                                    </CardTitle>
                                    <CardDescription className="text-primary-foreground/70 font-mono text-sm tracking-widest">{selectedProfile.documentId}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-0 text-sm">
                                    <Separator className="bg-white/10" />
                                    <div className="flex items-center gap-3"><Briefcase className="h-5 w-5 opacity-60" /> <span>{selectedProfile.roleName}</span></div>
                                    <div className="flex items-center gap-3"><GraduationCap className="h-5 w-5 opacity-60" /> <span className="line-clamp-2 leading-snug">{selectedProfile.programName}</span></div>
                                    <Badge variant="outline" className="w-full justify-center bg-green-500/20 text-green-300 border-green-500/30 py-2 mt-4 text-xs font-bold uppercase">
                                        <ShieldCheck className="h-4 w-4 mr-2" /> Perfil Validado
                                    </Badge>
                                </CardContent>
                            </Card>
                        </div>
                        {/* Formulario de Pago */}
                        <div className="md:col-span-8">
                            <Card className="shadow-2xl border-none h-full">
                                <CardHeader className="bg-muted/30 border-b py-4">
                                    <CardTitle className="text-lg font-black uppercase text-primary">Detalles de Operación</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
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

            {/* DERECHA: Operaciones en Vivo */}
            <div className="lg:col-span-4 h-full">
                <Card className="h-full border-none bg-slate-50/50 shadow-inner">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                            <CardTitle className="text-xs font-black uppercase tracking-widest text-primary">Monitor de Caja (En Vivo)</CardTitle>
                        </div>
                        <CardDescription className="text-[10px]">Últimos cobros validados en el sistema.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {recentPayments.length > 0 ? (
                            recentPayments.map((p) => (
                                <div key={p.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-primary/5 shadow-sm hover:shadow-md transition-all group">
                                    <Avatar className="h-10 w-10 border-2 border-slate-100 group-hover:border-primary/20 transition-all">
                                        <AvatarImage src={p.voucherUrl} className="object-cover" />
                                        <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-black">
                                            {p.payerName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline">
                                            <p className="text-[11px] font-bold truncate pr-2 uppercase text-slate-800">{p.payerName}</p>
                                            <p className="text-[12px] font-black text-primary">S/ {p.amount.toFixed(0)}</p>
                                        </div>
                                        <div className="flex justify-between items-center mt-0.5">
                                            <p className="text-[9px] text-muted-foreground font-medium truncate uppercase tracking-tighter w-2/3">{p.concept}</p>
                                            <p className="text-[8px] text-slate-400 font-mono">
                                                {p.processedAt ? format(p.processedAt.toDate(), 'HH:mm') : ''}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-20 text-center opacity-30 flex flex-col items-center">
                                <History className="h-12 w-12 mb-2" />
                                <p className="text-[10px] font-black uppercase">Sin actividad hoy</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>

        {/* INFERIOR: Operaciones Masivas */}
        <div className="max-w-7xl mx-auto">
            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="bulk-upload" className="border rounded-2xl shadow-sm overflow-hidden bg-card">
                    <AccordionTrigger className="px-6 h-16 hover:no-underline hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/5 p-2 rounded-lg">
                                <Upload className="h-5 w-5 text-primary" />
                            </div>
                            <span className="text-base font-black uppercase tracking-tight text-primary">Importación Masiva de Pagos (Excel)</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-8 px-6 pb-10 border-t border-dashed">
                        <div className="max-w-4xl mx-auto">
                            <div className="bg-muted/20 rounded-2xl p-8 border-2 border-dashed">
                                <CardHeader className="px-0 pt-0">
                                    <CardTitle className="text-xl">Procesamiento por Lotes</CardTitle>
                                    <CardDescription className="text-sm">
                                        Suba archivos Excel con registros históricos o de planillas externas. El sistema vinculará cada pago al perfil correcto mediante el DNI.
                                    </CardDescription>
                                </CardHeader>
                                <div className="mt-4">
                                    <BulkUploadPayments onUploadSuccess={fetchRecent} />
                                </div>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    </div>
  );
}
