

"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { addTaskToWeek } from '@/config/firebase';
import type { Unit } from '@/types';

const addTaskSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres.'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres.'),
  dueDate: z.date({ required_error: 'La fecha de entrega es requerida.' }),
});

type AddTaskFormValues = z.infer<typeof addTaskSchema>;

interface AddTaskFormProps {
  unit: Unit;
  weekNumber: number;
  onTaskAdded: () => void;
  onCancel: () => void;
}

export function AddTaskForm({ unit, weekNumber, onTaskAdded, onCancel }: AddTaskFormProps) {
  const { instituteId } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<AddTaskFormValues>({
    resolver: zodResolver(addTaskSchema),
    defaultValues: { title: '', description: '' },
  });

  const onSubmit = async (data: AddTaskFormValues) => {
    if (!instituteId) return;
    setLoading(true);
    try {
        const taskData = {
            ...data,
            dueDate: Timestamp.fromDate(data.dueDate),
        };
        
        await addTaskToWeek(instituteId, unit.id, weekNumber, taskData);
        
        toast({ title: '¡Éxito!', description: 'La tarea ha sido añadida a la semana.' });
        form.reset();
        onTaskAdded();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo añadir la tarea.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Título de la Tarea</FormLabel>
                <FormControl>
                    <Input placeholder="Ej: Ensayo sobre Mitosis" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
             <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                    <FormItem className="flex flex-col pt-2">
                        <FormLabel className="mb-2">Fecha y Hora de Entrega</FormLabel>
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
                                    <span>Seleccione una fecha</span>
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
                                disabled={(date) => date < new Date()}
                                initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                    </FormItem>
                )}
                />
        </div>

        <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
            <FormItem>
                <FormLabel>Descripción / Instrucciones</FormLabel>
                <FormControl>
                    <Textarea placeholder="Detalle aquí las instrucciones para la tarea..." {...field} rows={5} />
                </FormControl>
                <FormMessage />
            </FormItem>
            )}
        />
        
        <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Añadir Tarea
            </Button>
        </div>
      </form>
    </Form>
  );
}
