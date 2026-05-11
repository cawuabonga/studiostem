
"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, Save, Send, CreditCard, Receipt, MessageSquareText, Printer, CheckCircle2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { registerPayment, getPaymentConcepts } from '@/config/firebase';
import type { PaymentConcept, StudentProfile, StaffProfile, Payment } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { PrintReceipt } from './PrintReceipt';
import { Timestamp } from 'firebase/firestore';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const paymentSchema = z.object({
  fullName: z.string().min(3, { message: 'El nombre es requerido.' }),
  concept: z.string({ required_error: 'Debe seleccionar un concepto.' }).min(1, 'Debe seleccionar un concepto.'),
  amount: z.coerce.number().min(0.01, 'El monto debe ser mayor a cero.'),
  paymentDate: z.date({ required_error: 'La fecha de pago es requerida.' }),
  receiptNumber: z.string().min(1, { message: 'Ingrese el número de comprobante o boleta.' }),
  observations: z.string().optional(),
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
  const { user, instituteId, institute } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [paymentConcepts, setPaymentConcepts] = useState<PaymentConcept[]>([]);
  
  // Success & Print States
  const [lastRegisteredPayment, setLastRegisteredPayment] = useState<Payment | null>(null);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      fullName: profile.fullName || (profile as any).displayName || '',
      concept: "",
      amount: 0,
      receiptNumber: '',
      paymentDate: new Date(),
      observations: '',
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
        form.reset({
            fullName: profile.fullName || (profile as any).displayName || '',
            concept: "",
            amount: 0,
            receiptNumber: '',
            paymentDate: new Date(),
            observations: '',
            voucher: undefined,
        });
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
      
      const pData: Omit<Payment, 'id' | 'voucherUrl' | 'status' | 'createdAt' | 'processedAt'> = { 
          payerId: profile.documentId, 
          payerName: data.fullName,
          payerType: profile.type,
          payerAuthUid: user.uid,
          concept: data.concept,
          amount: data.amount,
          paymentDate: Timestamp.fromDate(data.paymentDate),
          operationNumber: data.receiptNumber,
          receiptNumber: data.receiptNumber,
          observations: data.observations,
      };

      const paymentId = await registerPayment(
        instituteId, 
        pData, 
        voucher?.[0],
        {
            autoApprove: true,
            receiptNumber: data.receiptNumber
        }
      );

      // Store payment for printing
      setLastRegisteredPayment({
          ...pData,
          id: paymentId,
          status: 'Aprobado',
          voucherUrl: '', // Not needed for receipt print
          createdAt: Timestamp.now(),
          processedAt: Timestamp.now(),
      });

      setIsSuccessDialogOpen(true);
      
    } catch (error: any) {
      console.error("Payment registration error:", error);
      toast({ title: "Error", description: error.message || "No se pudo registrar el pago.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('receipt-print-area')?.innerHTML;
    const styles = Array.from(document.styleSheets)
        .map(s => s.href ? `<link rel="stylesheet" href="${s.href}">` : '')
        .join('');

    const printWindow = window.open('', '_blank');
    if (printWindow && printContent) {
        printWindow.document.write(`
            <html>
                <head>
                    <title>Recibo de Caja - ${lastRegisteredPayment?.receiptNumber}</title>
                    ${styles}
                    <style>
                        @media print {
                            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; padding: 20px; }
                            .printable-area { border: 2px dashed #000; padding: 30px; }
                        }
                    </style>
                </head>
                <body>${printContent}</body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    }
  };

  const handleFinish = () => {
      setIsSuccessDialogOpen(false);
      setLastRegisteredPayment(null);
      onSuccess();
  };

  return (
    <>
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
                 <Select onValueChange={field.onChange} value={field.value}>
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
                <FormDescription>Monto fijo según tasa oficial actual.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
            control={form.control}
            name="observations"
            render={({ field }) => (
            <FormItem>
                <FormLabel className="flex items-center gap-2 font-bold">
                    <MessageSquareText className="h-4 w-4 text-primary" /> Observaciones o Detalles
                </FormLabel>
                <FormControl>
                    <Textarea 
                        {...field} 
                        placeholder="Ej: Cuota 1 de 2, Matrícula Módulo II, etc." 
                        className="resize-none h-20 border-primary/10"
                    />
                </FormControl>
                <FormMessage />
            </FormItem>
            )}
        />
        
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

    {/* Success Dialog */}
    <Dialog open={isSuccessDialogOpen} onOpenChange={(open) => !open && handleFinish()}>
        <DialogContent className="max-w-md">
            <DialogHeader className="text-center">
                <div className="mx-auto bg-green-100 p-3 rounded-full w-fit mb-4">
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <DialogTitle className="text-2xl font-black uppercase text-green-700">¡Cobro Registrado!</DialogTitle>
                <DialogDescription className="text-base font-medium">
                    La operación para <span className="font-black text-foreground">{lastRegisteredPayment?.payerName}</span> ha sido guardada correctamente en el sistema.
                </DialogDescription>
            </DialogHeader>
            
            <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
                <div className="flex justify-between"><span>Concepto:</span><span className="font-bold uppercase">{lastRegisteredPayment?.concept}</span></div>
                <div className="flex justify-between"><span>Comprobante:</span><span className="font-mono font-bold">{lastRegisteredPayment?.receiptNumber}</span></div>
                <div className="flex justify-between text-lg border-t pt-2 mt-2"><span>Total:</span><span className="font-black text-primary">S/ {lastRegisteredPayment?.amount.toFixed(2)}</span></div>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" className="flex-1 h-12 font-bold" onClick={handlePrint}>
                    <Printer className="mr-2 h-5 w-5" /> Imprimir Recibo
                </Button>
                <Button className="flex-1 h-12 font-bold" onClick={handleFinish}>
                    Nueva Operación
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    {/* Hidden Print Area */}
    <div id="receipt-print-area" className="hidden">
        {lastRegisteredPayment && institute && (
            <PrintReceipt payment={lastRegisteredPayment} institute={institute} />
        )}
    </div>
    </>
  );
}
