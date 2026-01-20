
"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { registerPayment, getPaymentConcepts } from '@/config/firebase';
import { useRouter } from 'next/navigation';
import type { PaymentConcept, StudentProfile, StaffProfile } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const paymentSchema = z.object({
  concept: z.string({ required_error: 'Debe seleccionar un concepto.' }).min(1, 'Debe seleccionar un concepto.'),
  amount: z.coerce.number().min(0.01, 'El monto debe ser mayor a cero.'),
  paymentDate: z.date({ required_error: 'La fecha de pago es requerida.' }),
  receiptNumber: z.string().optional(),
  voucher: z.instanceof(FileList).optional()
    .refine(files => !files || files.length === 0 || files?.[0]?.size <= MAX_FILE_SIZE, `El tamaño máximo es de 5MB.`)
    .refine(
      files => !files || files.length === 0 || ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      "Solo se aceptan formatos .jpg, .jpeg, .png y .webp."
    ),
});


type PaymentFormValues = z.infer<typeof paymentSchema>;

type PayerProfile = (StudentProfile | StaffProfile) & { type: 'student' | 'staff' | 'external' };
interface TreasuryRegisterPaymentFormProps {
    profile: PayerProfile;
}

export function TreasuryRegisterPaymentForm({ profile }: TreasuryRegisterPaymentFormProps) {
  const { user, instituteId } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [paymentConcepts, setPaymentConcepts] = useState<PaymentConcept[]>([]);

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

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      concept: "",
      amount: 0,
      receiptNumber: '',
      paymentDate: new Date(),
      voucher: undefined,
    }
  });

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
            payerName: (profile as StudentProfile).fullName || (profile as StaffProfile).displayName,
            payerType: profile.type,
            payerAuthUid: user.uid,
        }, 
        voucher?.[0],
        {
            autoApprove: true,
            receiptNumber: data.receiptNumber
        }
      );
      toast({
        title: '¡Pago Registrado y Aprobado!',
        description: `El pago para ${profile.fullName || profile.displayName} ha sido guardado correctamente.`,
      });
      router.push('/dashboard/gestion-administrativa/validar-pagos');
    } catch (error: any) {
      console.error("Payment registration error:", error);
      toast({ title: "Error", description: error.message || "No se pudo registrar el pago.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="concept"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Concepto de Pago</FormLabel>
                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Selecciona un concepto..." /></SelectTrigger>
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
                <FormLabel>Monto Pagado (S/)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} readOnly className="bg-muted" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
            control={form.control}
            name="paymentDate"
            render={({ field }) => (
                <FormItem className="flex flex-col pt-2">
                    <FormLabel className="mb-2">Fecha del Pago</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                            <FormControl>
                            <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                {field.value ? ( format(field.value, "PPP") ) : ( <span>Seleccione la fecha del voucher</span> )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("2020-01-01")} initialFocus />
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
                <FormLabel>Comprobante de banco o boleta electronica</FormLabel>
                <FormControl><Input placeholder="Ej: B001-0012345" {...field} /></FormControl>
                <FormMessage />
            </FormItem>
            )}
        />

        <FormField
          control={form.control}
          name="voucher"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Adjuntar Voucher</FormLabel>
              <FormControl><Input type="file" accept="image/*" {...form.register('voucher')} disabled={loading} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Registrando...' : 'Registrar y Aprobar Pago'}
        </Button>
      </form>
    </Form>
  );
}
