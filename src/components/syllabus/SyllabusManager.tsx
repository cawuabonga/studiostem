
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getSyllabus, saveSyllabus } from '@/config/firebase';
import type { Unit, Syllabus } from '@/types';
import { Loader2, Save, Printer, Sparkles, FileText, Target, GraduationCap, Library } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { generateSyllabusSummary } from '@/ai/flows/generate-syllabus-summary-flow';
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
  const { instituteId } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

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
      toast({ title: "¡Éxito!", description: "La información del sílabo ha sido guardada correctamente." });
    } catch (error: any) {
      toast({ title: "Error", description: "No se pudo guardar la información del sílabo.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    try {
        const summary = await generateSyllabusSummary({ unitName: unit.name });
        form.setValue('summary', summary, { shouldValidate: true });
        toast({ title: "Sumilla Generada", description: "La IA ha procesado una propuesta profesional basada en el nombre de la unidad." });
    } catch (error) {
        toast({ title: "Error", description: "No se pudo conectar con el motor de IA. Revisa la configuración en el panel de SuperAdmin.", variant: "destructive"});
    } finally {
        setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    setIsPrinting(true);
    const iframeId = 'silent-print-iframe';
    let iframe = document.getElementById(iframeId) as HTMLIFrameElement;
    
    if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = iframeId;
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);
    }
    
    iframe.src = `/dashboard/docente/unidad/${unit.id}/print`;
    
    setTimeout(() => {
        setIsPrinting(false);
    }, 5000);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Cabecera del Editor */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-background p-6 rounded-xl border shadow-sm sticky top-0 z-20">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-black tracking-tight text-primary uppercase">Editor del Sílabo Oficial</h2>
                        <p className="text-sm text-muted-foreground font-medium">Gestión de la estructura curricular de la unidad didáctica.</p>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <Button type="button" variant="outline" onClick={handlePrint} disabled={isPrinting} className="flex-1 md:flex-none font-bold border-2">
                            {isPrinting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
                            IMPRIMIR PDF
                        </Button>
                        <Button type="submit" disabled={isSaving} className="flex-1 md:flex-none font-bold shadow-lg shadow-primary/20">
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            GUARDAR CAMBIOS
                        </Button>
                    </div>
                </div>

                {/* Grid de Secciones Reorganizado */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                    
                    {/* Sumilla - Columna Principal (Span 2 filas) */}
                    <div className="lg:col-span-5 lg:row-span-2 h-full">
                        <Card className="h-full border-t-4 border-t-primary shadow-md flex flex-col">
                            <CardHeader className="bg-muted/30 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <FileText className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-black uppercase">II. Sumilla</CardTitle>
                                        <CardDescription>Naturaleza y propósito del curso.</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 flex-grow flex flex-col">
                                <FormField
                                    control={form.control}
                                    name="summary"
                                    render={({ field }) => (
                                        <FormItem className="h-full flex flex-col">
                                            <div className="flex items-center justify-between mb-2">
                                                <FormLabel className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Contenido Sugerido por IA</FormLabel>
                                                <Button type="button" variant="secondary" size="sm" onClick={handleGenerateSummary} disabled={isGenerating} className="h-7 text-[9px] font-black uppercase bg-primary/5 text-primary hover:bg-primary/10 border border-primary/20">
                                                    {isGenerating ? <Loader2 className="mr-2 h-3 w-3 animate-spin"/> : <Sparkles className="mr-2 h-3 w-3" />}
                                                    Generar con IA
                                                </Button>
                                            </div>
                                            <FormControl className="flex-grow">
                                                <Textarea placeholder="Escriba la sumilla..." className="h-full min-h-[350px] resize-none leading-relaxed border-primary/10 focus-visible:ring-primary/30" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Competencia - Fila 1 Columna Derecha */}
                    <div className="lg:col-span-7">
                        <Card className="border-t-4 border-t-primary shadow-md">
                            <CardHeader className="bg-muted/30 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <Target className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-black uppercase">III. Competencia</CardTitle>
                                        <CardDescription>Logro final esperado al término de la unidad.</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <FormField
                                    control={form.control}
                                    name="competence"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Textarea rows={5} placeholder="Escriba la competencia de la unidad..." className="resize-none leading-relaxed border-primary/10" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Metodología - Fila 2 Columna Derecha */}
                    <div className="lg:col-span-7">
                        <Card className="border-t-4 border-t-primary shadow-md">
                            <CardHeader className="bg-muted/30 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <GraduationCap className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-black uppercase">VI. Metodología</CardTitle>
                                        <CardDescription>Estrategias y técnicas didácticas aplicadas.</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <FormField
                                    control={form.control}
                                    name="methodology"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Textarea rows={5} placeholder="Detalle la secuencia metodológica..." className="resize-none leading-relaxed border-primary/10" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Bibliografía - Ancho Completo en la base */}
                    <div className="lg:col-span-12">
                        <Card className="border-t-4 border-t-primary shadow-md">
                            <CardHeader className="bg-muted/30 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <Library className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-black uppercase">VII. Bibliografía y Fuentes</CardTitle>
                                        <CardDescription>Recursos de información sugeridos para el estudiante.</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <FormField
                                    control={form.control}
                                    name="bibliography"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Textarea rows={6} placeholder="Lista de libros, sitios web, etc. (Formato APA recomendado)" className="resize-none leading-relaxed border-primary/10 font-mono text-xs" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Footer de Acción */}
                <div className="flex justify-end pb-12">
                     <Button type="submit" size="lg" disabled={isSaving} className="w-full md:w-auto font-black px-12 h-14 shadow-xl">
                        {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                        GUARDAR TODO EL CONTENIDO
                    </Button>
                </div>
            </form>
        </Form>
    </div>
  );
}
