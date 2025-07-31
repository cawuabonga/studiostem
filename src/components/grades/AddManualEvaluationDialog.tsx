
"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import type { AchievementIndicator, Unit } from '@/types';

const addEvalSchema = (startWeek: number, endWeek: number) => z.object({
  label: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  weekNumber: z.coerce.number()
    .min(startWeek, `La semana debe estar entre ${startWeek} y ${endWeek}.`)
    .max(endWeek, `La semana debe estar entre ${startWeek} y ${endWeek}.`),
});

interface AddManualEvaluationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (label: string, weekNumber: number) => void;
    indicator: AchievementIndicator;
    unit: Unit;
}

export function AddManualEvaluationDialog({ isOpen, onClose, onSubmit, indicator, unit }: AddManualEvaluationDialogProps) {

    const formSchema = addEvalSchema(indicator.startWeek, indicator.endWeek);
    type FormValues = z.infer<typeof formSchema>;

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            label: '',
            weekNumber: indicator.startWeek,
        },
    });

    const handleFormSubmit = (data: FormValues) => {
        onSubmit(data.label, data.weekNumber);
        form.reset();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Añadir Evaluación Manual</DialogTitle>
                    <DialogDescription>
                        Crea una nueva columna de calificación para el indicador "{indicator.name}".
                        Esta evaluación debe estar dentro del rango de semanas del indicador ({indicator.startWeek} - {indicator.endWeek}).
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="label"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Nombre de la Evaluación</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ej: Práctica Calificada 2" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="weekNumber"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Semana de la Evaluación</FormLabel>
                                <FormControl>
                                    <Input 
                                        type="number" 
                                        min={indicator.startWeek}
                                        max={indicator.endWeek}
                                        {...field} 
                                    />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="ghost">Cancelar</Button>
                            </DialogClose>
                            <Button type="submit">Añadir Columna</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

