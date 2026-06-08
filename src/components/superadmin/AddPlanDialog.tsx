
"use client";

import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { addPlan, updatePlan } from '@/config/firebase';
import type { Plan } from '@/types';
import { Loader2, Plus, Trash2, CheckCircle2 } from 'lucide-react';

const planSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres.'),
  price: z.coerce.number().min(0, 'El precio no puede ser negativo.'),
  billingCycle: z.enum(['mensual', 'anual']),
  isActive: z.boolean().default(true),
  features: z.array(z.object({ value: z.string().min(1, 'La característica no puede estar vacía.') })),
});

type FormValues = z.infer<typeof planSchema>;

interface AddPlanDialogProps {
  isOpen: boolean;
  onClose: (updated?: boolean) => void;
  existingPlan?: Plan | null;
}

export function AddPlanDialog({ isOpen, onClose, existingPlan }: AddPlanDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!existingPlan;

  const form = useForm<FormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      billingCycle: 'mensual',
      isActive: true,
      features: [{ value: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "features"
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && existingPlan) {
        form.reset({
          name: existingPlan.name,
          description: existingPlan.description,
          price: existingPlan.price,
          billingCycle: existingPlan.billingCycle,
          isActive: existingPlan.isActive,
          features: existingPlan.features.map(f => ({ value: f })),
        });
      } else {
        form.reset({
          name: '',
          description: '',
          price: 0,
          billingCycle: 'mensual',
          isActive: true,
          features: [{ value: '' }],
        });
      }
    }
  }, [isOpen, existingPlan, isEditMode, form]);

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    const planData = {
        ...data,
        features: data.features.map(f => f.value)
    };

    try {
      if (isEditMode && existingPlan) {
        await updatePlan(existingPlan.id, planData);
        toast({ title: 'Plan Actualizado', description: 'Los cambios se han guardado.' });
      } else {
        await addPlan(planData);
        toast({ title: 'Plan Creado', description: 'El nuevo plan está disponible para los institutos.' });
      }
      onClose(true);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'No se pudo procesar el plan.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Editar Plan de Servicio' : 'Nuevo Plan LMS'}</DialogTitle>
          <DialogDescription>Define el precio, ciclo y características incluidas en este paquete.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 overflow-y-auto flex-1 pr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Nombre del Plan</FormLabel><FormControl><Input placeholder="Ej: Premium Institucional" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="billingCycle" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Ciclo de Facturación</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent><SelectItem value="mensual">Mensual</SelectItem><SelectItem value="anual">Anual</SelectItem></SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="price" render={({ field }) => (
                    <FormItem><FormLabel>Precio Base (S/)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="isActive" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-muted/20">
                        <div className="space-y-0.5">
                            <FormLabel>Estado del Plan</FormLabel>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Visible para Institutos</p>
                        </div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                )} />
            </div>

            <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Descripción Breve</FormLabel><FormControl><Textarea placeholder="Resume el valor de este plan..." {...field} /></FormControl><FormMessage /></FormItem>
            )} />

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" /> Características Incluidas
                    </h3>
                    <Button type="button" size="sm" variant="outline" onClick={() => append({ value: '' })}>
                        <Plus className="mr-1 h-3 w-3" /> Añadir
                    </Button>
                </div>
                <div className="space-y-2">
                    {fields.map((field, index) => (
                        <div key={field.id} className="flex gap-2">
                            <FormField
                                control={form.control}
                                name={`features.${index}.value`}
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormControl><Input placeholder="Ej: Hasta 500 alumnos matriculados" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => remove(index)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            </div>

             <DialogFooter className="sticky bottom-0 bg-background pt-4 border-t">
              <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
              <Button type="submit" disabled={isSubmitting} className="font-black px-8">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'GUARDAR PLAN'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
