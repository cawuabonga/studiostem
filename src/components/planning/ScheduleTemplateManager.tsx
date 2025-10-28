"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { ScheduleTemplate } from '@/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle } from 'lucide-react';

interface ScheduleTemplateManagerProps {
    instituteId: string;
}

export function ScheduleTemplateManager({ instituteId }: ScheduleTemplateManagerProps) {
  const [templates, setTemplates] = useState<ScheduleTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // TODO: Implement getScheduleTemplates in firebase.ts
      // const fetchedData = await getScheduleTemplates(instituteId);
      // setTemplates(fetchedData);
      setTemplates([]); // Placeholder
    } catch (error) {
      toast({ title: "Error", description: "No se pudieron cargar las plantillas de horario.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [instituteId, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="space-y-4">
        <div className="flex justify-end">
            <Button onClick={() => { /* TODO: Open form dialog */ }}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Crear Nueva Plantilla
            </Button>
        </div>
        <div className="rounded-md border p-4">
            {templates.length > 0 ? (
                <div>{/* TODO: List templates here */}</div>
            ) : (
                <p className="py-10 text-center text-muted-foreground">
                    No hay plantillas de horario creadas. ¡Crea una para empezar!
                </p>
            )}
        </div>
    </div>
  );
}
