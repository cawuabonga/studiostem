
"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { addTaskToWeek, updateTaskInWeek, getAchievementIndicators } from '@/config/firebase';
import type { Task, Unit, AchievementIndicator } from '@/types';

const addTaskSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres.'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres.'),
  dueDate: z.date({ required_error: 'La fecha de entrega es requerida.' }),
  indicatorId: z.string().optional(),
});

type AddTaskFormValues = z.infer<typeof addTaskSchema>;

interface AddTaskFormProps {
  unit: Unit;
  weekNumber: number;
  initialData?: Task | null;
  onDataChanged: () => void;
  onCancel: () => void;
}

export function AddTaskForm({ unit, weekNumber, initialData, onDataChanged, onCancel }: AddTaskFormProps) {
  const { instituteId } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [indicators, setIndicators] = useState<AchievementIndicator[]>([]);
  const isEditMode = !!initialData;

  useEffect(() => {
    if (instituteId && unit.id) {
        getAchievementIndicators(instituteId, unit.id).then(setIndicators).catch(console.error);
    }
  }, [instituteId, unit.id]);

  const form = useForm<AddTaskFormValues>({
    resolver: zodResolver(addTaskSchema),
    defaultValues: { 
        title: '', 
        description: '',
        dueDate: undefined,
        indicatorId: '',
    },
  });

  useEffect(() => {
    if (initialData) {
        form.reset({
            title: initialData.title,
            description: initialData.description,
            dueDate: initialData.dueDate instanceof Timestamp ? initialData.dueDate.toDate() : initialData.dueDate,
            indicatorId: initialData.indicatorId || '',
        });
    } else {
        form.reset({
            title: '',
            description: '',
            dueDate: undefined,
            indicatorId: '',
        });
    }
  }, [initialData, form]);

  const onSubmit = async (data: AddTaskFormValues) => {
    if (!instituteId) return;
    setLoading(true);
    try {
        const taskData: Partial<Task> = {
            title: data.title,
            description: data.description,
            dueDate: Timestamp.fromDate(data.dueDate),
            indicatorId: data.indicatorId || undefined,
        };
        
        if (isEditMode && initialData) {
            await updateTaskInWeek(instituteId, unit.id, weekNumber, initialData.id, taskData);
            toast({ title: '¡Éxito!', description: 'La tarea ha sido actualizada.' });
        } else {
            await addTaskToWeek(instituteId, unit.id, weekNumber, taskData as Omit<Task, 'id'>);
            toast({ title: '¡Éxito!', description: 'La tarea ha sido añadida a la semana.' });
        }
        
        form.reset();
        onDataChanged();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || `No se pudo ${isEditMode ? 'actualizar' : 'añadir'} la tarea.`,
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

        <div className="grid grid-cols-1 gap-4">
            <FormField
                control={form.control}
                name="indicatorId"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Indicador de Logro que Evalúa (Opcional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccione un indicador..." />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="none">Ninguno (No vinculada al registro)</SelectItem>
                            {indicators.map(ind => (
                                <SelectItem key={ind.id} value={ind.id}>{ind.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
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
            {isEditMode ? 'Actualizar Tarea' : 'Añadir Tarea'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
