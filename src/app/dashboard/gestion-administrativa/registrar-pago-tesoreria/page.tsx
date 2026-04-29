
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Search, UserCircle, Briefcase, GraduationCap, ArrowLeft, UserPlus, Fingerprint, ShieldCheck, Upload, History, User, CreditCard } from 'lucide-react';
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
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
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
        {/* Superior: Terminal de Cobranza */}
        <div className="max-w-6xl mx-auto">
            {!selectedProfile ? (
                <Card className="border-primary/20 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                    <CardHeader className="bg-primary/5 border-b flex flex-row items-center gap-4 py-4">
                        <div className="bg-primary/10 p-2 rounded-full">
                            <Fingerprint className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-xl">Terminal de Cobranza Manual</CardTitle>
                            <CardDescription>Ingrese el documento del pagador para iniciar el registro.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <Form {...searchForm}>
                            <form onSubmit={searchForm.handleSubmit(onSearch)} className="flex flex-col sm:flex-row gap-4 items-end">
                                <FormField
                                    control={searchForm.control}
                                    name="documentId"
                                    render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormLabel className="text-xs font-bold uppercase text-muted-foreground">Número de Documento</FormLabel>
                                        <FormControl>
                                            <Input 
                                                placeholder="DNI, Pasaporte o Carné" 
                                                {...field} 
                                                className="h-12 text-lg font-mono tracking-widest"
                                                onKeyDown={(e) => e.key === 'Enter' && searchForm.handleSubmit(onSearch)()}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <Button type="submit" size="lg" disabled={loading} className="flex-1 sm:w-48 h-12 shadow-md">
                                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                                        Buscar
                                    </Button>
                                    <Button type="button" variant="ghost" size="lg" onClick={handleExternalPayer} disabled={loading} className="h-12 px-4">
                                        <UserPlus className="h-5 w-5" />
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                    {/* Perfil Seleccionado */}
                    <div className="md:col-span-4">
                        <Card className="bg-primary text-primary-foreground border-t-8 border-t-accent shadow-lg sticky top-20">
                            <CardHeader className="pb-4">
                                <div className="flex justify-between items-start mb-2">
                                    <Avatar className="w-16 h-16 border-2 border-white/20">
                                        <AvatarImage src={selectedProfile.photoURL} />
                                        <AvatarFallback className="bg-white/10 text-xl font-bold">
                                            {selectedProfile.fullName ? selectedProfile.fullName.charAt(0) : 'E'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <Button variant="ghost" size="icon" onClick={resetSelection} className="text-white/60 hover:text-white hover:bg-white/10">
                                        <ArrowLeft className="h-5 w-5" />
                                    </Button>
                                </div>
                                <CardTitle className="text-lg leading-tight">{selectedProfile.fullName || 'PAGADOR EXTERNO'}</CardTitle>
                                <CardDescription className="text-primary-foreground/70 font-mono text-xs">{selectedProfile.documentId}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3 pt-0 text-sm">
                                <Separator className="bg-white/10 mb-4" />
                                <div className="flex items-center gap-2"><Briefcase className="h-4 w-4 opacity-70" /> <span>{selectedProfile.roleName}</span></div>
                                <div className="flex items-center gap-2"><GraduationCap className="h-4 w-4 opacity-70" /> <span className="line-clamp-1">{selectedProfile.programName}</span></div>
                                <Badge variant="outline" className="w-full justify-center bg-green-500/10 text-green-300 border-green-500/20 py-1 mt-4">
                                    <ShieldCheck className="h-3 w-3 mr-2" /> Validado
                                </Badge>
                            </CardContent>
                        </Card>
                    </div>
                    {/* Formulario Principal */}
                    <div className="md:col-span-8">
                        <Card className="shadow-2xl border-none">
                            <CardHeader className="bg-muted/30 border-b py-4">
                                <CardTitle className="text-lg font-bold">Detalles del Cobro</CardTitle>
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

        {/* Actividad Reciente: Diseño en 3 Columnas con Tarjetas Pequeñas */}
        <div className="max-w-6xl mx-auto space-y-4">
            <div className="flex items-center gap-2 px-1">
                <History className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold uppercase tracking-tight text-primary">Actividad Reciente</h2>
            </div>
            
            {recentPayments.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {recentPayments.map((p) => (
                        <Card key={p.id} className="hover:shadow-md transition-shadow group border-primary/5 bg-card/50 backdrop-blur-sm overflow-hidden">
                            <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                    <Avatar className="h-10 w-10 border-2 border-primary/10 group-hover:border-primary/30 transition-all shrink-0">
                                        <AvatarFallback className="bg-primary/5 text-primary text-xs font-black">
                                            {p.payerName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start gap-1">
                                            <p className="text-xs font-bold truncate text-foreground group-hover:text-primary transition-colors">{p.payerName}</p>
                                            <p className="text-xs font-black text-primary whitespace-nowrap">S/ {p.amount.toFixed(0)}</p>
                                        </div>
                                        <div className="mt-1 flex flex-col gap-0.5">
                                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter truncate">{p.concept}</p>
                                            <p className="text-[9px] text-muted-foreground/60 flex items-center gap-1">
                                                <History className="h-2.5 w-2.5" />
                                                {p.processedAt ? format(p.processedAt.toDate(), 'dd/MM HH:mm') : ''}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="bg-muted/30 border-dashed">
                    <CardContent className="py-10 text-center opacity-30 flex flex-col items-center">
                        <User className="h-12 w-12 mb-2" />
                        <p className="text-sm font-bold uppercase">Sin pagos recientes hoy</p>
                    </CardContent>
                </Card>
            )}
        </div>

        {/* Inferior: Carga Masiva */}
        <div className="max-w-6xl mx-auto">
            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="bulk-upload" className="border rounded-xl shadow-sm overflow-hidden bg-card">
                    <AccordionTrigger className="px-6 hover:no-underline hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/5 p-2 rounded-lg">
                                <Upload className="h-5 w-5 text-primary" />
                            </div>
                            <span className="text-base font-bold text-primary">Carga Masiva de Pagos (Importar Excel)</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-6 px-6 pb-8 border-t border-dashed">
                        <div className="max-w-4xl mx-auto">
                            <Card className="border-dashed bg-muted/20">
                                <CardHeader>
                                    <CardTitle className="text-lg">Herramienta de Importación por Lotes</CardTitle>
                                    <CardDescription>
                                        Ideal para registrar pagos de convenios, planillas o saldos históricos. 
                                        Los montos del Excel serán respetados individualmente.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <BulkUploadPayments onUploadSuccess={fetchRecent} />
                                </CardContent>
                            </Card>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    </div>
  );
}
