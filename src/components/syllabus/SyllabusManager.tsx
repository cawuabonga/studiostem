
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getSyllabus, saveSyllabus } from '@/services/academic-service';
import type { Unit, Syllabus } from '@/types';
import { Loader2, Save, Printer, Sparkles, FileText, Target, GraduationCap, Library, BookOpen, UserCheck, ClipboardCheck } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { generateSyllabusSummary } from '@/ai/flows/generate-syllabus-summary-flow';
import { Separator } from '../ui/separator';
import { cn } from '@/lib/utils';

const syllabusSchema = z.object({
  summary: z.string().min(10, "La sumilla debe tener al menos 10 caracteres."),
  competence: z.string().min(10, "La competencia debe tener al menos 10 caracteres."),
  capacity: z.string().optional(),
  transversalCompetencies: z.string().optional(),
  methodology: z.string().min(10, "La metodología debe tener al menos 10 caracteres."),
  evaluation: z.string().optional(),
  bibliography: z.string().optional(),
});

type SyllabusFormValues = z.infer<typeof syllabusSchema>;

/**
 * Componente Textarea que se ajusta automáticamente al tamaño del texto.
 */
const AutoResizeTextarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<typeof Textarea>>(
  ({ className, ...props }, ref) => {
    const internalRef = useRef<HTMLTextAreaElement>(null);
    
    // Sincronizar refs
    React.useImperativeHandle(ref, () => internalRef.current!);

    const adjustHeight = () => {
      const textarea = internalRef.current;
      if (textarea) {
        textarea.style.height = "auto";
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    };

    useEffect(() => {
      adjustHeight();
    }, [props.value]);

    return (
      <Textarea
        {...props}
        ref={internalRef}
        onInput={(e) => {
            adjustHeight();
            props.onInput?.(e);
        }}
        className={cn("min-h-[80px] overflow-hidden leading-relaxed", className)}
      />
    );
  }
);
AutoResizeTextarea.displayName = "AutoResizeTextarea";


interface SyllabusManagerProps {
  unit: Unit;
  year: string;
}

export function SyllabusManager({ unit, year }: SyllabusManagerProps) {
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
      capacity: '',
      transversalCompetencies: '',
      methodology: 'Se utilizarán los métodos: inductivo, deductivo, analítico y sintético.',
      evaluation: 'La evaluación es permanente e integral basada en el dominio de los indicadores de logro.',
      bibliography: '',
    },
  });

  const fetchSyllabusData = useCallback(async () => {
    if (!instituteId) return;
    setLoading(true);
    try {
        const syllabusData = await getSyllabus(instituteId, unit.id, year, unit.period);
        if (syllabusData) {
            form.reset({
                summary: syllabusData.summary || '',
                competence: syllabusData.competence || '',
                capacity: syllabusData.capacity || '',
                transversalCompetencies: syllabusData.transversalCompetencies || '',
                methodology: syllabusData.methodology || '',
                evaluation: syllabusData.evaluation || '',
                bibliography: syllabusData.bibliography || '',
            });
        }
    } catch (error) {
      console.error("Error fetching syllabus data:", error);
      toast({ title: "Error", description: "No se pudo cargar la información del sílabo.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [instituteId, unit.id, unit.period, year, form, toast]);

  useEffect(() => {
    fetchSyllabusData();
  }, [fetchSyllabusData]);

  const onSubmit = async (data: SyllabusFormValues) => {
    if (!instituteId) return;
    setIsSaving(true);
    try {
      await saveSyllabus(instituteId, unit.id, year, unit.period, data as any);
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
        toast({ title: "Error", description: "No se pudo conectar con el motor de IA.", variant: "destructive"});
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
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-background p-6 rounded-xl border shadow-sm sticky top-0 z-20">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-black tracking-tight text-primary uppercase">Editor del Sílabo Oficial ({year})</h2>
                        <p className="text-sm text-muted-foreground font-medium">Gestión de la estructura curricular para el periodo {unit.period}.</p>
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

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                    <div className="lg:col-span-5 lg:row-span-5 h-full">
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
                                                <AutoResizeTextarea placeholder="Escriba la sumilla..." className="border-primary/10 focus-visible:ring-primary/30" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-7">
                        <Card className="border-t-4 border-t-primary shadow-md">
                            <CardHeader className="bg-muted/30 pb-2">
                                <div className="flex items-center gap-3">
                                    <Target className="h-5 w-5 text-primary" />
                                    <CardTitle className="text-sm font-black uppercase">III. Competencia de la Unidad</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <FormField
                                    control={form.control}
                                    name="competence"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <AutoResizeTextarea placeholder="Desempeño final esperado..." className="border-primary/10" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-7">
                        <Card className="border-t-4 border-t-primary shadow-md">
                            <CardHeader className="bg-muted/30 pb-2">
                                <div className="flex items-center gap-3">
                                    <BookOpen className="h-5 w-5 text-primary" />
                                    <CardTitle className="text-sm font-black uppercase">IV. Capacidad de la Unidad</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <FormField
                                    control={form.control}
                                    name="capacity"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <AutoResizeTextarea placeholder="Logros específicos a desarrollar..." className="border-primary/10" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-7">
                        <Card className="border-t-4 border-t-primary shadow-md">
                            <CardHeader className="bg-muted/30 pb-2">
                                <div className="flex items-center gap-3">
                                    <UserCheck className="h-5 w-5 text-primary" />
                                    <CardTitle className="text-sm font-black uppercase">V. Competencias Transversales</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <FormField
                                    control={form.control}
                                    name="transversalCompetencies"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <AutoResizeTextarea placeholder="Habilidades para la empleabilidad..." className="border-primary/10" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-7">
                        <Card className="border-t-4 border-t-primary shadow-md">
                            <CardHeader className="bg-muted/30 pb-2">
                                <div className="flex items-center gap-3">
                                    <GraduationCap className="h-5 w-5 text-primary" />
                                    <CardTitle className="text-sm font-black uppercase">VI. Metodología</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <FormField
                                    control={form.control}
                                    name="methodology"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <AutoResizeTextarea placeholder="Secuencia metodológica..." className="border-primary/10" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-12">
                         <Card className="border-t-4 border-t-primary shadow-md">
                            <CardHeader className="bg-muted/30 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <ClipboardCheck className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-black uppercase">VII. Sistema de Evaluación</CardTitle>
                                        <CardDescription>Criterios y procedimientos de calificación.</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <FormField
                                    control={form.control}
                                    name="evaluation"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <AutoResizeTextarea placeholder="Indique cómo evaluará el aprendizaje..." className="border-primary/10" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-12">
                        <Card className="border-t-4 border-t-primary shadow-md">
                            <CardHeader className="bg-muted/30 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <Library className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-black uppercase">VIII. Bibliografía y Fuentes</CardTitle>
                                        <CardDescription>Recursos de información sugeridos.</CardDescription>
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
                                                <AutoResizeTextarea placeholder="Fuentes de información (APA)..." className="border-primary/10 font-mono text-xs" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="flex justify-end pb-12">
                     <Button type="submit" size="lg" disabled={isSaving} className="w-full md:w-auto font-black px-12 h-14 shadow-xl">
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        GUARDAR SÍLABO COMPLETO
                    </Button>
                </div>
            </form>
        </Form>
    </div>
  );
}

