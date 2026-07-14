
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getUnitProject, saveUnitProject } from '@/config/firebase';
import type { Unit, Project, ProjectVisibility, RubricCriteria } from '@/types';
import { Loader2, Save, Rocket, Globe, Shield, Plus, Trash2, CheckCircle2, MessageSquare, Info } from 'lucide-react';
import { Separator } from '../ui/separator';
import { Switch } from '../ui/switch';
import { ProjectMentor } from './ProjectMentor';

const criteriaSchema = z.object({
    id: z.string(),
    label: z.string().min(3, "Requerido"),
    description: z.string().min(5, "Requerido"),
    maxPoints: z.coerce.number().min(1).max(20),
});

const projectSchema = z.object({
    title: z.string().min(5, "El título debe ser descriptivo."),
    description: z.string().min(20, "Explique el reto real a solucionar."),
    objective: z.string().min(10, "Defina el objetivo principal."),
    competencies: z.string().min(10, "Qué competencias desarrollará el alumno."),
    visibility: z.enum(['Borrador', 'Interno', 'Ecosistema Nacional']),
    fabLabRequired: z.boolean().default(false),
    rubrics: z.array(criteriaSchema).min(1, "Añada al menos un criterio de evaluación."),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

interface ProjectManagerProps {
    unit: Unit;
}

export function ProjectManager({ unit }: ProjectManagerProps) {
    const { user, instituteId } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [project, setProject] = useState<Project | null>(null);

    const isTeacher = user?.role !== 'Student';

    const form = useForm<ProjectFormValues>({
        resolver: zodResolver(projectSchema),
        defaultValues: {
            title: '',
            description: '',
            objective: '',
            competencies: '',
            visibility: 'Borrador',
            fabLabRequired: false,
            rubrics: [{ id: '1', label: 'Funcionalidad', description: 'El prototipo cumple el objetivo.', maxPoints: 5 }],
        },
    });

    const fetchProject = useCallback(async () => {
        if (!instituteId) return;
        setLoading(true);
        try {
            const data = await getUnitProject(instituteId, unit.id);
            if (data) {
                setProject(data);
                form.reset(data);
            }
        } catch (error) {
            console.error("Error fetching project:", error);
        } finally {
            setLoading(false);
        }
    }, [instituteId, unit.id, form]);

    useEffect(() => { fetchProject(); }, [fetchProject]);

    const onSubmit = async (data: ProjectFormValues) => {
        if (!instituteId || !user) return;
        setIsSaving(true);
        try {
            const projectId = await saveUnitProject(instituteId, unit.id, {
                ...data,
                unitId: unit.id,
                instituteId,
                authorId: user.uid,
                authorName: user.displayName || 'Docente'
            });
            toast({ title: "Proyecto Guardado", description: "La configuración ABP ha sido actualizada." });
            fetchProject();
        } catch (error) {
            toast({ title: "Error", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const addCriteria = () => {
        const current = form.getValues('rubrics');
        form.setValue('rubrics', [...current, { id: Date.now().toString(), label: '', description: '', maxPoints: 5 }]);
    };

    const removeCriteria = (id: string) => {
        const current = form.getValues('rubrics');
        form.setValue('rubrics', current.filter(c => c.id !== id));
    };

    if (loading) return <Skeleton className="h-96 w-full" />;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Columna Principal: Configuración o Información */}
            <div className="lg:col-span-8 space-y-6">
                {isTeacher ? (
                    <Card className="border-t-4 border-t-primary shadow-xl">
                        <CardHeader>
                            <CardTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                                <Rocket className="h-6 w-6 text-primary" /> Diseño del Proyecto ABP
                            </CardTitle>
                            <CardDescription>Configure el reto que los estudiantes resolverán durante el curso.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                    <FormField control={form.control} name="title" render={({ field }) => (
                                        <FormItem><FormLabel className="font-bold">Título del Proyecto</FormLabel><FormControl><Input placeholder="Ej: Sistema de Riego Automatizado IoT" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField control={form.control} name="visibility" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-bold">Visibilidad en Repositorio</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Borrador">Borrador (Privado)</SelectItem>
                                                        <SelectItem value="Interno">Comunidad Institucional</SelectItem>
                                                        <SelectItem value="Ecosistema Nacional">Ecosistema STEM Nacional</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="fabLabRequired" render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 bg-muted/20">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-xs font-bold">Requiere Fab Lab</FormLabel>
                                                    <FormDescription className="text-[10px]">Habilita validación física.</FormDescription>
                                                </div>
                                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                            </FormItem>
                                        )} />
                                    </div>

                                    <FormField control={form.control} name="objective" render={({ field }) => (
                                        <FormItem><FormLabel className="font-bold">Reto Real / Objetivo</FormLabel><FormControl><Textarea rows={3} placeholder="¿Qué problema del mundo real vamos a solucionar?" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />

                                    <Separator />

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h4 className="text-sm font-black uppercase text-primary tracking-widest">Matriz de Evaluación (Rúbrica)</h4>
                                            <Button type="button" variant="outline" size="sm" onClick={addCriteria}><Plus className="h-4 w-4 mr-2" /> Añadir Criterio</Button>
                                        </div>
                                        {form.watch('rubrics').map((item, index) => (
                                            <div key={item.id} className="p-4 rounded-xl border-2 border-dashed bg-slate-50 flex gap-4 items-start">
                                                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                                                    <FormField control={form.control} name={`rubrics.${index}.label`} render={({ field }) => (
                                                        <FormItem className="md:col-span-1"><FormLabel className="text-[10px] font-bold">Criterio</FormLabel><FormControl><Input placeholder="Nombre" {...field} /></FormControl></FormItem>
                                                    )} />
                                                    <FormField control={form.control} name={`rubrics.${index}.description`} render={({ field }) => (
                                                        <FormItem className="md:col-span-2"><FormLabel className="text-[10px] font-bold">Indicador de Logro</FormLabel><FormControl><Input placeholder="¿Qué se evalúa?" {...field} /></FormControl></FormItem>
                                                    )} />
                                                    <FormField control={form.control} name={`rubrics.${index}.maxPoints`} render={({ field }) => (
                                                        <FormItem className="md:col-span-1"><FormLabel className="text-[10px] font-bold">Puntos</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                                                    )} />
                                                </div>
                                                <Button type="button" variant="ghost" size="icon" className="text-destructive mt-6" onClick={() => removeCriteria(item.id)} disabled={form.watch('rubrics').length === 1}><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <Button type="submit" disabled={isSaving} size="lg" className="px-12 font-black shadow-xl">
                                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                            PUBLICAR PROYECTO
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        <Card className="border-none shadow-xl overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                            <CardHeader className="p-8">
                                <div className="flex justify-between items-start">
                                    <Badge className="bg-white/20 text-white border-none uppercase font-black px-4 py-1">Proyecto de Innovación</Badge>
                                    {project?.fabLabRequired && <Badge className="bg-accent text-accent-foreground font-black"><CheckCircle2 className="h-3 w-3 mr-1" /> VALIDACIÓN FAB LAB</Badge>}
                                </div>
                                <CardTitle className="text-4xl font-black uppercase tracking-tighter mt-6 leading-none">{project?.title || "Proyecto Pendiente"}</CardTitle>
                                <CardDescription className="text-primary-foreground/70 text-lg font-medium mt-2">{project?.objective}</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 pt-0">
                                <div className="p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 leading-relaxed font-medium">
                                    {project?.description}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-3xl shadow-lg border-none">
                            <CardHeader>
                                <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-primary">Criterios de Éxito (Rúbrica)</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {project?.rubrics.map(rub => (
                                    <div key={rub.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-dashed border-primary/20">
                                        <div>
                                            <p className="font-black text-sm uppercase">{rub.label}</p>
                                            <p className="text-xs text-muted-foreground">{rub.description}</p>
                                        </div>
                                        <Badge variant="secondary" className="text-lg font-black bg-white px-4">{rub.maxPoints} pts</Badge>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>

            {/* Columna Lateral: Mentor IA */}
            <div className="lg:col-span-4">
                <ProjectMentor unit={unit} project={project} />
            </div>
        </div>
    );
}
