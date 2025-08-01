

"use client";

import React from 'react';
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

const addEvalSchema = z.object({
  label: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
});

interface AddManualEvaluationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (label: string) => void;
    indicator: AchievementIndicator;
    unit: Unit;
    weekNumber: number;
}

export function AddManualEvaluationDialog({ isOpen, onClose, onSubmit, indicator, unit, weekNumber }: AddManualEvaluationDialogProps) {
    type FormValues = z.infer<typeof addEvalSchema>;

    const form = useForm<FormValues>({
        resolver: zodResolver(addEvalSchema),
        defaultValues: {
            label: '',
        },
    });

    const handleFormSubmit = (data: FormValues) => {
        onSubmit(data.label);
        form.reset();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Añadir Evaluación Manual</DialogTitle>
                    <DialogDescription>
                        Crea una nueva columna de calificación para la <span className="font-bold">Semana {weekNumber}</span> del indicador "{indicator.name}".
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
