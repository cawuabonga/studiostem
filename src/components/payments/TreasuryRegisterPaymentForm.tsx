
"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, Save, Send, CreditCard, Receipt } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { registerPayment, getPaymentConcepts } from '@/config/firebase';
import type { PaymentConcept, StudentProfile, StaffProfile } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const paymentSchema = z.object({
  fullName: z.string().min(3, { message: 'El nombre es requerido.' }),
  concept: z.string({ required_error: 'Debe seleccionar un concepto.' }).min(1, 'Debe seleccionar un concepto.'),
  amount: z.coerce.number().min(0.01, 'El monto debe ser mayor a cero.'),
  paymentDate: z.date({ required_error: 'La fecha de pago es requerida.' }),
  receiptNumber: z.string().min(1, { message: 'Ingrese el número de comprobante o boleta.' }),
  voucher: z.instanceof(FileList).optional()
    .refine(files => !files || files.length === 0 || files[0]?.size <= MAX_FILE_SIZE, `El tamaño máximo es de 5MB.`)
    .refine(
      files => !files || files.length === 0 || ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      "Solo se aceptan formatos .jpg, .jpeg, .png y .webp."
    ),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

type PayerProfile = (StudentProfile | StaffProfile) & { type: 'student' | 'staff' | 'external' };

interface TreasuryRegisterPaymentFormProps {
    profile: PayerProfile;
    onSuccess: () => void;
}

export function TreasuryRegisterPaymentForm({ profile, onSuccess }: TreasuryRegisterPaymentFormProps) {
  const { user, instituteId } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [paymentConcepts, setPaymentConcepts] = useState<PaymentConcept[]>([]);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      fullName: profile.fullName || (profile as any).displayName || '',
      concept: "",
      amount: 0,
      receiptNumber: '',
      paymentDate: new Date(),
      voucher: undefined,
    }
  });

  useEffect(() => {
    if (instituteId) {
        getPaymentConcepts(instituteId, true)
            .then(concepts => {
                const sortedConcepts = concepts.sort((a, b) => a.name.localeCompare(b.name));
                setPaymentConcepts(sortedConcepts);
            })
            .catch(console.error);
    }
  }, [instituteId]);

  useEffect(() => {
    if (profile) {
        form.setValue('fullName', profile.fullName || (profile as any).displayName || '');
    }
  }, [profile, form]);

  const selectedConceptName = form.watch('concept');

  useEffect(() => {
      const selectedConcept = paymentConcepts.find(c => c.name === selectedConceptName);
      if (selectedConcept) {
          form.setValue('amount', selectedConcept.amount);
      }
  }, [selectedConceptName, paymentConcepts, form]);

  const onSubmit = async (data: PaymentFormValues) => {
    if (!instituteId || !user) return;
    setLoading(true);
    try {
      const { voucher, ...paymentData } = data;
      
      await registerPayment(
        instituteId, 
        { 
            ...paymentData, 
            payerId: profile.documentId, 
            payerName: data.fullName,
            payerType: profile.type,
            payerAuthUid: user.uid,
            operationNumber: data.receiptNumber,
        }, 
        voucher?.[0],
        {
            autoApprove: true,
            receiptNumber: data.receiptNumber
        }
      );

      toast({
        title: '¡Pago Registrado!',
        description: `El pago para ${data.fullName} ha sido procesado con éxito.`,
      });
      
      onSuccess();
    } catch (error: any) {
      console.error("Payment registration error:", error);
      toast({ title: "Error", description: error.message || "No se pudo registrar el pago.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {profile.type === 'external' && (
            <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                <FormItem className="animate-in slide-in-from-left-4">
                    <FormLabel className="font-bold">Nombre Completo del Pagador</FormLabel>
                    <FormControl>
                        <Input 
                            {...field} 
                            placeholder="Ingrese nombre y apellidos..." 
                            className="h-12 border-primary/30 focus-visible:ring-primary"
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        )}

        <div className="grid md:grid-cols-2 gap-8">
          <FormField
            control={form.control}
            name="concept"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 font-bold">
                    <Receipt className="h-4 w-4 text-primary" /> Concepto de Pago
                </FormLabel>
                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 border-primary/20"><SelectValue placeholder="Seleccione concepto..." /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {paymentConcepts.map((concept) => (
                        <SelectItem key={concept.id} value={concept.name}>
                          {concept.name}
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
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 font-bold">
                    <CreditCard className="h-4 w-4 text-primary" /> Monto a Cobrar (S/)
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    placeholder="0.00" 
                    {...field} 
                    readOnly 
                    className="h-12 bg-muted font-black text-xl text-primary border-dashed" 
                  />
                </FormControl>
                <FormDescription>Monto fijo según tasa oficial.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
            <FormField
                control={form.control}
                name="paymentDate"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel className="mb-2 font-bold">Fecha del Pago</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                                <FormControl>
                                <Button variant={"outline"} className={cn("w-full h-12 pl-3 text-left font-normal border-primary/20", !field.value && "text-muted-foreground")}>
                                    {field.value ? ( format(field.value, "PPP", { locale: es }) ) : ( <span>Fecha del voucher</span> )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date()} initialFocus />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                    </FormItem>
                )}
            />
                
            <FormField
                control={form.control}
                name="receiptNumber"
                render={({ field }) => (
                <FormItem>
                    <FormLabel className="font-bold">N° Comprobante Físico (Boleta)</FormLabel>
                    <FormControl>
                        <Input 
                            placeholder="Ej: B001-000123" 
                            {...field} 
                            className="h-12 border-primary/20 font-mono uppercase" 
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>

        <FormField
          control={form.control}
          name="voucher"
          render={({ field }) => (
            <FormItem className="bg-muted/50 p-6 rounded-xl border-2 border-dashed border-primary/10">
              <FormLabel className="font-bold">Digitalización de Voucher (Opcional)</FormLabel>
              <FormControl><Input type="file" accept="image/*" {...form.register('voucher')} disabled={loading} className="bg-background mt-2" /></FormControl>
              <FormDescription>Suba una captura si desea que el registro tenga respaldo digital.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-4">
            <Button type="submit" size="lg" disabled={loading} className="w-full sm:w-auto h-14 px-8 text-lg shadow-xl shadow-primary/20">
                {loading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <Save className="mr-2 h-6 w-6" />}
                Registrar y Finalizar Cobro
            </Button>
        </div>
      </form>
    </Form>
  );
}
