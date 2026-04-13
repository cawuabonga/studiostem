
"use client";

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { updateAchievementIndicator } from '@/config/firebase';
import { Loader2 } from 'lucide-react';
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

const editIndicatorSchema = z.object({
  name: z.string().min(3, { message: 'El nombre/código debe tener al menos 3 caracteres.' }),
  description: z.string().min(10, { message: 'La descripción debe tener al menos 10 caracteres.' }),
  startWeek: z.coerce.number().min(1, 'La semana de inicio debe ser al menos 1.'),
  endWeek: z.coerce.number().min(1, 'La semana final debe ser al menos 1.'),
}).refine(data => data.endWeek >= data.startWeek, {
    message: 'La semana final debe ser mayor o igual a la semana de inicio.',
    path: ['endWeek'],
});

type EditIndicatorFormValues = z.infer<typeof editIndicatorSchema>;

interface EditIndicatorDialogProps {
  unit: Unit;
  indicator: AchievementIndicator;
  isOpen: boolean;
  onClose: (updated?: boolean) => void;
}

export function EditIndicatorDialog({ unit, indicator, isOpen, onClose }: EditIndicatorDialogProps) {
  const { instituteId } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);

  const form = useForm<EditIndicatorFormValues>({
    resolver: zodResolver(editIndicatorSchema),
    defaultValues: {
      name: indicator.name,
      description: indicator.description,
      startWeek: indicator.startWeek,
      endWeek: indicator.endWeek,
    },
  });

  useEffect(() => {
    if (isOpen && indicator) {
        form.reset({
            name: indicator.name,
            description: indicator.description,
            startWeek: indicator.startWeek,
            endWeek: indicator.endWeek,
        });
    }
  }, [isOpen, indicator, form]);

  const onSubmit = async (data: EditIndicatorFormValues) => {
    if (!instituteId) return;
    
    if (data.endWeek > (unit.totalWeeks || 16)) {
        form.setError('endWeek', {
            type: 'manual',
            message: `La semana final no puede exceder el total de semanas de la unidad (${unit.totalWeeks || 16}).`
        });
        return;
    }

    setLoading(true);
    try {
      await updateAchievementIndicator(instituteId, unit.id, indicator.id, data);
      toast({
        title: '¡Éxito!',
        description: 'El indicador de logro ha sido actualizado.',
      });
      onClose(true);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el indicador.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Indicador de Logro</DialogTitle>
          <DialogDescription>Modifica la información del indicador y su vigencia semanal.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre o Código</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startWeek"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Semana Inicio</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endWeek"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Semana Fin</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="ghost">Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Cambios
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
