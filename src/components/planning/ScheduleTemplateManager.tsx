
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { ScheduleTemplate } from '@/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getScheduleTemplates, deleteScheduleTemplate } from '@/config/firebase';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { ScheduleTemplateForm } from './ScheduleTemplateForm';
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '../ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Badge } from '../ui/badge';

interface ScheduleTemplateManagerProps {
    instituteId: string;
}

export function ScheduleTemplateManager({ instituteId }: ScheduleTemplateManagerProps) {
  const [templates, setTemplates] = useState<ScheduleTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ScheduleTemplate | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<ScheduleTemplate | null>(null);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedData = await getScheduleTemplates(instituteId);
      setTemplates(fetchedData);
    } catch (error) {
      toast({ title: "Error", description: "No se pudieron cargar las plantillas de horario.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [instituteId, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenForm = (template?: ScheduleTemplate) => {
    setSelectedTemplate(template || null);
    setIsFormOpen(true);
  };
  
  const handleCloseForm = (updated?: boolean) => {
      setIsFormOpen(false);
      setSelectedTemplate(null);
      if (updated) {
          fetchData();
      }
  }

  const handleDelete = async () => {
    if (!templateToDelete) return;
    try {
        await deleteScheduleTemplate(instituteId, templateToDelete.id);
        toast({ title: "Plantilla Eliminada" });
        fetchData();
    } catch (error) {
         toast({ title: "Error", description: "No se pudo eliminar la plantilla.", variant: "destructive" });
    } finally {
        setTemplateToDelete(null);
    }
  };

  if (loading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="space-y-4">
        <div className="flex justify-end">
            <Button onClick={() => handleOpenForm()}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Crear Nueva Plantilla
            </Button>
        </div>
        <div className="rounded-md border p-4">
            {templates.length > 0 ? (
                <div className="space-y-4">
                    {templates.map(template => (
                        <Card key={template.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4">
                           <div>
                                <CardTitle className="text-lg">{template.name}</CardTitle>
                                <CardDescription>
                                    Bloques: {template.turnos.mañana.length} (M), {template.turnos.tarde.length} (T), {template.turnos.noche.length} (N)
                                </CardDescription>
                           </div>
                           <div className="flex items-center gap-2 mt-4 sm:mt-0">
                                {template.isDefault && <Badge>Por Defecto</Badge>}
                                <Button variant="outline" size="icon" onClick={() => handleOpenForm(template)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="destructive" size="icon" onClick={() => setTemplateToDelete(template)} disabled={template.isDefault}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                           </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <p className="py-10 text-center text-muted-foreground">
                    No hay plantillas de horario creadas. ¡Crea una para empezar!
                </p>
            )}
        </div>
        
        <ScheduleTemplateForm
            instituteId={instituteId}
            isOpen={isFormOpen}
            onClose={handleCloseForm}
            existingTemplate={selectedTemplate}
        />

        <AlertDialog open={!!templateToDelete} onOpenChange={(open) => !open && setTemplateToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
                    <AlertDialogDescription>Esta acción eliminará la plantilla "{templateToDelete?.name}" y no se puede deshacer.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setTemplateToDelete(null)}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
