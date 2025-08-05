
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import type { Unit, Syllabus, WeekData, AchievementIndicator, Program, Teacher, SyllabusDesignOptions } from '@/types';
import { Loader2, Save, Printer } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { useRouter } from 'next/navigation';
import '@/app/dashboard/gestion-academica/print-grades.css';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { SyllabusPrintLayout } from './SyllabusPrintLayout';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';

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
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [printableData, setPrintableData] = useState<{
        program: Program | null;
        teacher: Teacher | null;
        syllabus: Syllabus | null;
        weeklyData: WeekData[];
        indicators: AchievementIndicator[];
    } | null>(null);

  const [designOptions, setDesignOptions] = useState<SyllabusDesignOptions>({
      showLogo: true,
      showInfoTable: true,
      showSignature: true,
  });

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
        const currentYear = new Date().getFullYear().toString();
        const weekPromises = Array.from({ length: unit.totalWeeks }, (_, i) => getWeekData(instituteId, unit.id, i + 1));

        const [
            syllabusData,
            allPrograms,
            allTeachers,
            weeklyResults,
            indicators
        ] = await Promise.all([
            getSyllabus(instituteId, unit.id),
            getPrograms(instituteId),
            getTeachers(instituteId),
            Promise.all(weekPromises),
            getAchievementIndicators(instituteId, unit.id)
        ]);
      
        if (syllabusData) {
            form.reset(syllabusData);
        }

        const program = allPrograms.find(p => p.id === unit.programId) || null;
        const assignments = await getAssignments(instituteId, currentYear, unit.programId);
        const teacherId = assignments[unit.period]?.[unit.id];
        const teacher = allTeachers.find(t => t.documentId === teacherId) || null;
        
        const weeklyData = weeklyResults.map((data, index) => data || { weekNumber: index + 1, contents: [], tasks: [], capacityElement: '', learningActivities: '', basicContents: '', isVisible: false });

        setPrintableData({ program, teacher, syllabus: syllabusData, weeklyData, indicators });
    } catch (error) {
      console.error("Error fetching syllabus data:", error);
      toast({ title: "Error", description: "No se pudo cargar la información del sílabo.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [instituteId, unit, form, toast]);

  useEffect(() => {
    fetchSyllabusData();
  }, [fetchSyllabusData]);

  const onSubmit = async (data: SyllabusFormValues) => {
    if (!instituteId) return;
    setIsSaving(true);
    try {
      await saveSyllabus(instituteId, unit.id, data);
      toast({ title: "¡Éxito!", description: "La información del sílabo ha sido guardada." });
      setPrintableData(prev => prev ? { ...prev, syllabus: data } : null);
    } catch (error: any) {
      toast({ title: "Error", description: "No se pudo guardar la información del sílabo.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handlePrint = () => {
    const optionsQuery = new URLSearchParams(designOptions as any).toString();
    const printUrl = `/dashboard/docente/unidad/${unit.id}/print?${optionsQuery}`;
    window.open(printUrl, '_blank');
  };

  const handleOpenPreview = () => {
    fetchSyllabusData().then(() => setIsPreviewOpen(true));
  }

  const handleDesignOptionChange = (option: keyof SyllabusDesignOptions, value: boolean) => {
    setDesignOptions(prev => ({...prev, [option]: value }));
  }


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
                        <Button type="button" variant="outline" onClick={handleOpenPreview} disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Printer className="mr-2 h-4 w-4" />}
                            Visualizar y Diseñar Sílabo
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

        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
            <DialogContent className="max-w-6xl h-[95vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Previsualización y Diseño del Sílabo</DialogTitle>
                    <DialogDescription>
                       Modifica el diseño en tiempo real usando las opciones de la izquierda. Cuando esté listo, procede a imprimir.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
                    {/* Editor Panel */}
                    <div className="col-span-3 border-r pr-6 space-y-4">
                        <h3 className="font-semibold text-lg">Opciones de Diseño</h3>
                        <Separator />
                        <div className="space-y-4">
                             <div className="flex items-center space-x-2">
                                <Switch id="show-logo" checked={designOptions.showLogo} onCheckedChange={(val) => handleDesignOptionChange('showLogo', val)} />
                                <Label htmlFor="show-logo">Mostrar Logo</Label>
                            </div>
                             <div className="flex items-center space-x-2">
                                <Switch id="show-info-table" checked={designOptions.showInfoTable} onCheckedChange={(val) => handleDesignOptionChange('showInfoTable', val)} />
                                <Label htmlFor="show-info-table">Mostrar Tabla de Información</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch id="show-signature" checked={designOptions.showSignature} onCheckedChange={(val) => handleDesignOptionChange('showSignature', val)} />
                                <Label htmlFor="show-signature">Mostrar Firma del Docente</Label>
                            </div>
                        </div>
                    </div>
                    {/* Preview Panel */}
                    <div className="col-span-9 overflow-y-auto bg-gray-100 p-4 rounded-md">
                        {printableData ? (
                           <div style={{ transform: 'scale(0.8)', transformOrigin: 'top left' }}>
                                <SyllabusPrintLayout
                                    institute={institute}
                                    unit={unit}
                                    {...printableData}
                                    designOptions={designOptions}
                                />
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        )}
                    </div>
                </div>
                 <div className="flex justify-end gap-2 mt-4 flex-shrink-0">
                    <Button variant="ghost" onClick={() => setIsPreviewOpen(false)}>Cerrar</Button>
                    <Button onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" />
                        Proceder a Imprimir
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    </>
  );
}
