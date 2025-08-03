
"use client";

import React, { useState } from 'react';
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
import { registerPayment } from '@/config/firebase';
import { useRouter } from 'next/navigation';

// TODO: In a real app, these would be fetched from the database
const paymentConcepts = [
    'Matrícula 2024-I',
    'Matrícula 2024-II',
    'Constancia de Estudios',
    'Carnet de Estudiante',
    'Examen de Rezagado',
    'Otro',
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const paymentSchema = z.object({
  concept: z.string({ required_error: 'Debe seleccionar un concepto.' }).min(1, 'Debe seleccionar un concepto.'),
  amount: z.coerce.number().min(0.01, 'El monto debe ser mayor a cero.'),
  paymentDate: z.date({ required_error: 'La fecha de pago es requerida.' }),
  operationNumber: z.string().min(4, 'El número de operación es requerido.'),
  voucher: z.instanceof(FileList)
    .refine(files => files?.length === 1, 'Se requiere la foto del voucher.')
    .refine(files => files?.[0]?.size <= MAX_FILE_SIZE, `El tamaño máximo es de 5MB.`)
    .refine(files => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type), "Solo se aceptan formatos .jpg, .jpeg, .png y .webp."),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

export function RegisterPaymentForm() {
  const { user, instituteId } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      concept: "",
    }
  });

  const onSubmit = async (data: PaymentFormValues) => {
    if (!user || !instituteId || !user.documentId) {
      toast({ title: "Error", description: "No se pudo identificar al usuario o instituto. Asegúrate de que tu perfil esté vinculado.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await registerPayment(instituteId, { ...data, studentId: user.documentId!, studentName: user.displayName! }, data.voucher[0]);
      toast({
        title: '¡Pago Registrado!',
        description: 'Tu pago ha sido enviado para validación. Puedes ver su estado en "Mi Historial de Pagos".',
      });
      router.push('/dashboard/gestion-administrativa/mis-pagos');
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
        {/* Concept and Amount */}
        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="concept"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Concepto de Pago</FormLabel>
                <FormControl>
                    <select {...field} className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                        <option value="" disabled>Selecciona un concepto...</option>
                        {paymentConcepts.map(concept => (
                            <option key={concept} value={concept}>{concept}</option>
                        ))}
                    </select>
                </FormControl>
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
                  <Input type="number" step="0.01" placeholder="Ej: 70.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* Date and Operation Number */}
        <div className="grid md:grid-cols-2 gap-4">
             <FormField
                control={form.control}
                name="paymentDate"
                render={({ field }) => (
                    <FormItem className="flex flex-col pt-2">
                        <FormLabel className="mb-2">Fecha del Pago</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                                <FormControl>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                    )}
                                >
                                    {field.value ? (
                                    format(field.value, "PPP")
                                    ) : (
                                    <span>Seleccione la fecha del voucher</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date > new Date() || date < new Date("2020-01-01")}
                                initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                    </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="operationNumber"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Número de Operación</FormLabel>
                    <FormControl>
                    <Input placeholder="Del voucher del banco" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>

        {/* Voucher Upload */}
        <FormField
          control={form.control}
          name="voucher"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Adjuntar Voucher</FormLabel>
              <FormControl>
                 <Input 
                  type="file" 
                  accept="image/*" 
                  {...form.register('voucher')} 
                  disabled={loading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Enviando Pago...' : 'Registrar Mi Pago'}
        </Button>
      </form>
    </Form>
  );
}
