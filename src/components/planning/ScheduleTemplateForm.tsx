
"use client";

import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useToast } from '@/hooks/use-toast';
import type { ScheduleTemplate, TimeBlock, TimeBlockType } from '@/types';
import { addScheduleTemplate, updateScheduleTemplate, setDefaultScheduleTemplate } from '@/config/firebase';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Separator } from '../ui/separator';
import { Switch } from '../ui/switch';

const timeBlockSchema = z.object({
  id: z.string().optional(),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato HH:mm requerido."),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato HH:mm requerido."),
  type: z.enum(['clase', 'receso']),
  label: z.string().optional(),
});

const scheduleTemplateSchema = z.object({
  name: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres." }),
  isDefault: z.boolean().default(false),
  turnos: z.object({
    mañana: z.array(timeBlockSchema),
    tarde: z.array(timeBlockSchema),
    noche: z.array(timeBlockSchema),
  }),
});

type FormValues = z.infer<typeof scheduleTemplateSchema>;
type Turno = keyof FormValues['turnos'];

interface ScheduleTemplateFormProps {
  instituteId: string;
  isOpen: boolean;
  onClose: (updated?: boolean) => void;
  existingTemplate?: ScheduleTemplate | null;
}

const TurnoSection: React.FC<{ turno: Turno, control: any, errors: any }> = ({ turno, control, errors }) => {
    const { fields, append, remove } = useFieldArray({
        control,
        name: `turnos.${turno}`,
    });

    const addBlock = () => {
        append({ startTime: '', endTime: '', type: 'clase', label: '' });
    };
    
    return (
        <Card className="bg-muted/30">
            <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle className="capitalize text-lg">{turno}</CardTitle>
                <Button type="button" size="sm" variant="outline" onClick={addBlock}>
                    <Plus className="mr-2 h-4 w-4" /> Añadir Bloque
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {fields.map((field, index) => (
                     <div key={field.id} className="grid grid-cols-12 gap-2 items-end">
                        <FormField
                            control={control}
                            name={`turnos.${turno}.${index}.startTime`}
                            render={({ field }) => (
                                <FormItem className="col-span-3">
                                    <FormLabel>Inicio</FormLabel>
                                    <FormControl><Input type="time" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={control}
                            name={`turnos.${turno}.${index}.endTime`}
                            render={({ field }) => (
                                <FormItem className="col-span-3">
                                    <FormLabel>Fin</FormLabel>
                                    <FormControl><Input type="time" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={control}
                            name={`turnos.${turno}.${index}.type`}
                            render={({ field }) => (
                                <FormItem className="col-span-3">
                                    <FormLabel>Tipo</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="clase">Clase</SelectItem>
                                            <SelectItem value="receso">Receso</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={control}
                            name={`turnos.${turno}.${index}.label`}
                            render={({ field }) => (
                                <FormItem className="col-span-2">
                                     <FormControl><Input placeholder="Etiqueta" {...field} /></FormControl>
                                </FormItem>
                            )}
                        />
                        <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => remove(index)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                     </div>
                ))}
                {fields.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No hay bloques para este turno.</p>}
            </CardContent>
        </Card>
    )
}

export function ScheduleTemplateForm({ instituteId, isOpen, onClose, existingTemplate }: ScheduleTemplateFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!existingTemplate;

  const form = useForm<FormValues>({
    resolver: zodResolver(scheduleTemplateSchema),
    defaultValues: {
      name: '',
      isDefault: false,
      turnos: { mañana: [], tarde: [], noche: [] },
    },
  });
  
  useEffect(() => {
    if (isOpen) {
        if(isEditMode && existingTemplate) {
             form.reset({
                name: existingTemplate.name,
                isDefault: existingTemplate.isDefault || false,
                turnos: {
                    mañana: existingTemplate.turnos.mañana || [],
                    tarde: existingTemplate.turnos.tarde || [],
                    noche: existingTemplate.turnos.noche || [],
                }
             });
        } else {
             form.reset({
                name: '',
                isDefault: false,
                turnos: { mañana: [], tarde: [], noche: [] },
             });
        }
    }
  }, [isOpen, existingTemplate, isEditMode, form]);

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
        if (isEditMode && existingTemplate) {
            await updateScheduleTemplate(instituteId, existingTemplate.id, data);
            toast({ title: 'Éxito', description: 'La plantilla ha sido actualizada.' });
            if (data.isDefault) {
                await setDefaultScheduleTemplate(instituteId, existingTemplate.id);
            }
        } else {
            const newId = await addScheduleTemplate(instituteId, data);
            toast({ title: 'Éxito', description: 'La plantilla ha sido creada.' });
            if (data.isDefault) {
                await setDefaultScheduleTemplate(instituteId, newId);
            }
        }
        onClose(true);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Editar' : 'Crear'} Plantilla de Horario</DialogTitle>
          <DialogDescription>
            Define los bloques horarios para cada turno. Puedes añadir, eliminar y reordenar los bloques según sea necesario.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 flex-1 overflow-y-auto pr-2">
            <FormField name="name" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Nombre de la Plantilla</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
             <FormField name="isDefault" control={form.control} render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                        <FormLabel>Establecer como Plantilla por Defecto</FormLabel>
                        <p className="text-sm text-muted-foreground">Esta plantilla se usará por defecto al generar nuevos horarios.</p>
                    </div>
                     <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
            )} />

            <Separator />

            <div className="space-y-6">
                <TurnoSection turno="mañana" control={form.control} errors={form.formState.errors} />
                <TurnoSection turno="tarde" control={form.control} errors={form.formState.errors} />
                <TurnoSection turno="noche" control={form.control} errors={form.formState.errors} />
            </div>

             <DialogFooter className="sticky bottom-0 bg-background pt-4 z-10">
                <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isEditMode ? 'Guardar Cambios' : 'Crear Plantilla'}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
