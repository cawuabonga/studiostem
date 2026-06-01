"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, Info, Paperclip, Link as LinkIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfDay } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { addTaskToWeek, updateTaskInWeek, getAchievementIndicators } from '@/config/firebase';
import type { Task, Unit, AchievementIndicator } from '@/types';
import { Separator } from '../ui/separator';

const addTaskSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres.'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres.'),
  dueDate: z.date({ required_error: 'La fecha de entrega es requerida.' }),
  indicatorId: z.string().optional(),
  referenceLink: z.string().url({ message: 'Por favor, ingrese una URL válida.' }).or(z.literal('')).optional(),
  file: z.instanceof(FileList).optional(),
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

  const [time, setTime] = useState(() => {
    if (initialData?.dueDate) {
      const date = (initialData.dueDate as Timestamp).toDate();
      return format(date, "HH:mm");
    }
    return "23:59";
  });

  useEffect(() => {
    if (instituteId && unit.id) {
        getAchievementIndicators(instituteId, unit.id).then(setIndicators).catch(console.error);
    }
  }, [instituteId, unit.id]);

  const suggestedIndicator = useMemo(() => {
      return indicators.find(ind => weekNumber >= ind.startWeek && weekNumber <= ind.endWeek);
  }, [indicators, weekNumber]);

  const form = useForm<AddTaskFormValues>({
    resolver: zodResolver(addTaskSchema),
    defaultValues: { 
        title: initialData?.title || '', 
        description: initialData?.description || '',
        dueDate: initialData?.dueDate ? (initialData.dueDate as Timestamp).toDate() : undefined,
        indicatorId: initialData?.indicatorId || '',
        referenceLink: initialData?.referenceLink || '',
    },
  });

  const onSubmit = async (data: AddTaskFormValues) => {
    if (!instituteId) return;
    setLoading(true);
    try {
        const combinedDate = new Date(data.dueDate);
        const [hours, minutes] = time.split(':').map(Number);
        combinedDate.setHours(hours, minutes, 0, 0);

        const taskData: any = {
            title: data.title,
            description: data.description,
            dueDate: Timestamp.fromDate(combinedDate),
            indicatorId: data.indicatorId || suggestedIndicator?.id || undefined,
            referenceLink: data.referenceLink || '',
        };
        
        const fileToUpload = data.file?.[0];

        if (isEditMode && initialData) {
            await updateTaskInWeek(instituteId, unit.id, weekNumber, initialData.id, taskData, fileToUpload);
            toast({ title: '¡Éxito!', description: 'La tarea ha sido actualizada.' });
        } else {
            await addTaskToWeek(instituteId, unit.id, weekNumber, taskData, fileToUpload);
            toast({ title: '¡Éxito!', description: 'La tarea ha sido añadida a la semana.' });
        }
        
        form.reset();
        onDataChanged();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || `No se pudo procesar la tarea.`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
        <div className="bg-primary/5 p-4 rounded-xl border-2 border-dashed border-primary/20">
            <div className="flex items-center gap-2 mb-1">
                <Info className="h-4 w-4 text-primary" />
                <span className="text-[10px] font-black uppercase text-primary tracking-widest">Asignación Automática</span>
            </div>
            {suggestedIndicator ? (
                <p className="text-xs text-muted-foreground">
                    Se vinculará a: <span className="font-bold text-foreground">"{suggestedIndicator.name}"</span>
                </p>
            ) : (
                <p className="text-xs text-destructive font-bold">
                    Atención: No hay un indicador definido para esta semana.
                </p>
            )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="font-bold uppercase text-[10px] text-muted-foreground">Título de la Actividad</FormLabel>
                        <FormControl>
                            <Input placeholder="Ej: Laboratorio N°1" {...field} className="h-11" />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            
            <div className="grid grid-cols-2 gap-2">
                <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel className="font-bold uppercase text-[10px] text-muted-foreground mb-2">Fecha de Entrega</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full h-11 pl-3 text-left font-normal border-primary/10",
                                                !field.value && "text-muted-foreground"
                                            )}
                                        >
                                            {field.value ? format(field.value, "dd/MM/yy") : <span>Fecha</span>}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        disabled={(date) => date < startOfDay(new Date())}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="space-y-2">
                    <Label className="font-bold uppercase text-[10px] text-muted-foreground">Hora Límite</Label>
                    <Input 
                        type="time" 
                        value={time} 
                        onChange={(e) => setTime(e.target.value)} 
                        className="h-11 border-primary/10 font-mono"
                    />
                </div>
            </div>
        </div>

        <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
            <FormItem>
                <FormLabel className="font-bold uppercase text-[10px] text-muted-foreground">Instrucciones Detalladas</FormLabel>
                <FormControl>
                    <Textarea placeholder="Indique qué debe realizar el estudiante..." {...field} rows={4} className="resize-none border-primary/10" />
                </FormControl>
                <FormMessage />
            </FormItem>
            )}
        />

        <Separator />

        <div className="space-y-4">
            <h4 className="text-xs font-black uppercase text-primary tracking-tighter flex items-center gap-2">
                <Paperclip className="h-4 w-4" /> Recursos de Apoyo (Opcional)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="file"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-[10px] font-bold uppercase">Adjuntar Guía o Material</FormLabel>
                            <FormControl>
                                <Input type="file" {...form.register('file')} className="h-10 text-xs bg-muted/50" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="referenceLink"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-[10px] font-bold uppercase">Enlace de Referencia (URL)</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                                    <Input placeholder="https://..." {...field} className="h-10 pl-8 text-xs font-mono" />
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>
        
        <DialogFooter className="pt-4 border-t">
            <Button type="button" variant="ghost" onClick={onCancel} disabled={loading} className="font-bold">Cancelar</Button>
            <Button type="submit" disabled={loading} className="px-8 font-black shadow-lg">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? 'GUARDAR CAMBIOS' : 'CREAR TAREA OFICIAL'}
            </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}