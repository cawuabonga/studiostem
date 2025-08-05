
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getSyllabus, saveSyllabus, getWeekData, getAchievementIndicators, getPrograms, getTeachers, getAssignments } from '@/config/firebase';
import type { Unit, Syllabus, WeekData, AchievementIndicator, Program, Teacher } from '@/types';
import { Loader2, Save, Printer } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { SyllabusPrintLayout } from './SyllabusPrintLayout';
import '@/app/dashboard/gestion-academica/print-grades.css';

const syllabusSchema = z.object({
  summary: z.string().min(10, "La sumilla debe tener al menos 10 caracteres."),
  competence: z.string().min(10, "La competencia debe tener al menos 10 caracteres."),
  methodology: z.string().min(10, "La metodología debe tener al menos 10 caracteres."),
  bibliography: z.string().optional(),
});

type SyllabusFormValues = z.infer<typeof syllabusSchema>;

interface SyllabusManagerProps {
  unit: Unit;
}

export function SyllabusManager({ unit }: SyllabusManagerProps) {
  const { instituteId, institute } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // State for printable data
  const [printableData, setPrintableData] = useState<{
      program: Program | null;
      teacher: Teacher | null;
      syllabus: Syllabus | null;
      weeklyData: WeekData[];
      indicators: AchievementIndicator[];
  } | null>(null);

  const form = useForm<SyllabusFormValues>({
    resolver: zodResolver(syllabusSchema),
    defaultValues: {
      summary: '',
      competence: '',
      methodology: 'Se utilizarán los métodos: inductivo, deductivo, analítico y sintético.',
      bibliography: '',
    },
  });

  const fetchSyllabusData = useCallback(async () => {
    if (!instituteId) return;
    setLoading(true);
    try {
      const syllabusData = await getSyllabus(instituteId, unit.id);
      if (syllabusData) {
        form.reset(syllabusData);
      }
    } catch (error) {
      console.error("Error fetching syllabus data:", error);
      toast({ title: "Error", description: "No se pudo cargar la información del sílabo.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [instituteId, unit.id, form, toast]);

  useEffect(() => {
    fetchSyllabusData();
  }, [fetchSyllabusData]);

  const onSubmit = async (data: SyllabusFormValues) => {
    if (!instituteId) return;
    setIsSaving(true);
    try {
      await saveSyllabus(instituteId, unit.id, data);
      toast({ title: "¡Éxito!", description: "La información del sílabo ha sido guardada." });
    } catch (error: any) {
      toast({ title: "Error", description: "No se pudo guardar la información del sílabo.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreparePrint = async () => {
        if (!instituteId) return;
        setIsPrinting(true);
        try {
            const currentYear = new Date().getFullYear().toString();
            const weekPromises = Array.from({ length: unit.totalWeeks }, (_, i) => getWeekData(instituteId, unit.id, i + 1));
            const [
                allPrograms,
                allTeachers,
                syllabus,
                weeklyResults,
                indicators,
            ] = await Promise.all([
                getPrograms(instituteId),
                getTeachers(instituteId),
                getSyllabus(instituteId, unit.id),
                Promise.all(weekPromises),
                getAchievementIndicators(instituteId, unit.id)
            ]);

            const program = allPrograms.find(p => p.id === unit.programId) || null;
            const assignments = await getAssignments(instituteId, currentYear, unit.programId);
            const teacherId = assignments[unit.period]?.[unit.id];
            const teacher = allTeachers.find(t => t.documentId === teacherId) || null;
            
            const weeklyData = weeklyResults.map((data, index) => data || { weekNumber: index + 1, contents: [], tasks: [], capacityElement: '', learningActivities: '', basicContents: '', isVisible: false });

            setPrintableData({ program, teacher, syllabus, weeklyData, indicators });

            setTimeout(() => {
                window.print();
            }, 500);

        } catch (error) {
            console.error("Error preparing print data:", error);
            toast({ title: "Error", description: "No se pudieron cargar los datos para la impresión.", variant: "destructive" });
        } finally {
            setIsPrinting(false);
        }
    };


  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
        <Card className="screen-only">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Editor del Sílabo</CardTitle>
                        <CardDescription>
                            Complete los campos generales del sílabo. La programación semanal se obtiene de la pestaña 'Planificación Semanal'.
                        </CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={handlePreparePrint} disabled={isPrinting}>
                            {isPrinting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
                            Generar Sílabo para Imprimir
                        </Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Guardar Cambios
                        </Button>
                    </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="summary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-semibold">Sumilla</FormLabel>
                      <FormControl>
                        <Textarea rows={4} placeholder="Describe brevemente la naturaleza de la unidad didáctica, su propósito y contenido." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="competence"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-semibold">Competencia de la Unidad Didáctica</FormLabel>
                      <FormControl>
                        <Textarea rows={4} placeholder="Describe la competencia principal que los estudiantes desarrollarán al completar la unidad." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="methodology"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-semibold">Metodología</FormLabel>
                      <FormControl>
                        <Textarea rows={4} placeholder="Detalla las estrategias metodológicas que se aplicarán durante el curso." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="bibliography"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-semibold">Fuentes de Información y Bibliografía</FormLabel>
                      <FormControl>
                        <Textarea rows={4} placeholder="Lista los libros, enlaces web y otros recursos que se utilizarán." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </form>
          </Form>
        </Card>

       {printableData && (
          <div className="printable-area">
                <SyllabusPrintLayout
                    institute={institute}
                    unit={unit}
                    {...printableData}
                />
          </div>
        )}
    </>
  );
}
