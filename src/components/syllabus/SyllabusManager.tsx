
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
    <div className="max-w-5xl mx-auto">
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

                {/* Sección 1: Fundamentación Académica */}
                <Card className="border-t-4 border-t-primary shadow-md">
                    <CardHeader className="bg-muted/30 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-black uppercase">Fundamentación Académica</CardTitle>
                                <CardDescription>Defina la naturaleza y el objetivo central del curso.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-8 pt-6">
                        <FormField
                            control={form.control}
                            name="summary"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center justify-between mb-2">
                                        <FormLabel className="text-sm font-black uppercase text-muted-foreground tracking-widest">II. Sumilla</FormLabel>
                                        <Button type="button" variant="secondary" size="sm" onClick={handleGenerateSummary} disabled={isGenerating} className="h-8 text-[10px] font-black uppercase bg-primary/5 text-primary hover:bg-primary/10 border border-primary/20">
                                            {isGenerating ? <Loader2 className="mr-2 h-3 w-3 animate-spin"/> : <Sparkles className="mr-2 h-3 w-3" />}
                                            Generar Sumilla con IA
                                        </Button>
                                    </div>
                                    <FormControl>
                                        <Textarea rows={6} placeholder="Escriba la sumilla..." className="resize-none leading-relaxed border-primary/10 focus-visible:ring-primary/30" {...field} />
                                    </FormControl>
                                    <FormDescription className="text-[10px]">Describe la naturaleza, propósito y contenidos de la unidad.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        
                        <Separator />

                        <FormField
                            control={form.control}
                            name="competence"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-black uppercase text-muted-foreground tracking-widest block mb-2">III. Competencia de la Unidad</FormLabel>
                                    <FormControl>
                                        <Textarea rows={4} placeholder="Escriba la competencia..." className="resize-none leading-relaxed border-primary/10" {...field} />
                                    </FormControl>
                                    <FormDescription className="text-[10px]">Desempeño que el estudiante debe lograr al finalizar la unidad.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Sección 2: Secuencia Metodológica */}
                <Card className="border-t-4 border-t-primary shadow-md">
                    <CardHeader className="bg-muted/30 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <GraduationCap className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-black uppercase">Metodología de Enseñanza</CardTitle>
                                <CardDescription>Describa las estrategias y técnicas didácticas a emplear.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <FormField
                            control={form.control}
                            name="methodology"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-black uppercase text-muted-foreground tracking-widest block mb-2">VI. Secuencia Metodológica</FormLabel>
                                    <FormControl>
                                        <Textarea rows={6} placeholder="Detalle la metodología..." className="resize-none leading-relaxed border-primary/10" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Sección 3: Referencias Bibliográficas */}
                <Card className="border-t-4 border-t-primary shadow-md">
                    <CardHeader className="bg-muted/30 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Library className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-black uppercase">Recursos y Bibliografía</CardTitle>
                                <CardDescription>Fuentes de información sugeridas para el estudiante.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <FormField
                            control={form.control}
                            name="bibliography"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-black uppercase text-muted-foreground tracking-widest block mb-2">VII. Fuentes de Información</FormLabel>
                                    <FormControl>
                                        <Textarea rows={6} placeholder="Lista de libros, sitios web, etc..." className="resize-none leading-relaxed border-primary/10 font-mono text-xs" {...field} />
                                    </FormControl>
                                    <FormDescription className="text-[10px]">Utilice normas APA o Vancouver para las referencias.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>
                
                {/* Botón de guardado final en la base para mayor comodidad */}
                <div className="flex justify-end pb-12">
                     <Button type="submit" size="lg" disabled={isSaving} className="w-full md:w-auto font-black px-12 h-14 shadow-xl">
                        {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                        GUARDAR SÍLABO COMPLETO
                    </Button>
                </div>
            </form>
        </Form>
    </div>
  );
}
