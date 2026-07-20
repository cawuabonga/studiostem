"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { getUnitProjects, createUnitProject, updateUnitProject, deleteUnitProject, getProjectTeams } from '@/services/abp-service';
import type { Unit, Project, ProjectTeam } from '@/types';
import { Loader2, Save, Rocket, Plus, Trash2, CheckCircle2, Target, BookOpen, UserCheck, FileText, ArrowLeft, MoreVertical, Edit, Sparkles, LayoutGrid } from 'lucide-react';
import { Separator } from '../ui/separator';
import { Switch } from '../ui/switch';
import { ProjectMentor } from './ProjectMentor';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '../ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

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

type ViewState = 'list' | 'create' | 'edit' | 'details';

export function ProjectManager({ unit }: ProjectManagerProps) {
    const { user, instituteId } = useAuth();
    const { toast } = useToast();
    const [view, setView] = useState<ViewState>('list');
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [userTeam, setUserTeam] = useState<ProjectTeam | null>(null);

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

    const fetchData = useCallback(async () => {
        if (!instituteId) return;
        setLoading(true);
        try {
            const [fetchedProjects, teams] = await Promise.all([
                getUnitProjects(instituteId, unit.id),
                getProjectTeams(instituteId, unit.id)
            ]);
            setProjects(fetchedProjects);

            if (!isTeacher && user?.documentId) {
                const myTeam = teams.find(t => t.memberIds.includes(user.documentId!));
                if (myTeam) {
                    setUserTeam(myTeam);
                    const myProj = fetchedProjects.find(p => p.id === myTeam.projectId);
                    if (myProj) {
                        setSelectedProject(myProj);
                        setView('details');
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching projects:", error);
        } finally {
            setLoading(false);
        }
    }, [instituteId, unit.id, isTeacher, user?.documentId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const onSubmit = async (data: ProjectFormValues) => {
        if (!instituteId || !user) return;
        setIsSaving(true);
        try {
            if (view === 'create') {
                await createUnitProject(instituteId, unit.id, {
                    ...data,
                    unitId: unit.id,
                    instituteId,
                    authorId: user.uid,
                    authorName: user.displayName || 'Docente'
                });
                toast({ title: "Proyecto Publicado", description: "El nuevo reto ha sido añadido a la unidad." });
            } else if (view === 'edit' && selectedProject) {
                await updateUnitProject(instituteId, unit.id, selectedProject.id, data);
                toast({ title: "Cambios Guardados", description: "La información del reto ha sido actualizada." });
            }
            setView('list');
            fetchData();
        } catch (error) {
            toast({ title: "Error", description: "Verifica los datos ingresados.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (proj: Project) => {
        setSelectedProject(proj);
        form.reset(proj);
        setView('edit');
    };

    const handleDelete = async (id: string) => {
        if (!instituteId) return;
        try {
            await deleteUnitProject(instituteId, unit.id, id);
            toast({ title: "Proyecto Eliminado" });
            fetchData();
        } catch (error) {
            toast({ title: "Error al eliminar", variant: "destructive" });
        }
    };

    const addCriteria = () => {
        const current = form.getValues('rubrics');
        form.setValue('rubrics', [...current, { id: Date.now().toString(), label: '', description: '', maxPoints: 5 }]);
    };

    if (loading) return <div className="space-y-6"><Skeleton className="h-20 w-full" /><Skeleton className="h-96 w-full" /></div>;

    // --- RENDERIZADO DE VISTAS ---

    if (view === 'create' || view === 'edit') {
        return (
            <div className="max-w-4xl mx-auto space-y-6">
                <Button variant="ghost" onClick={() => setView('list')} className="mb-2"><ArrowLeft className="mr-2 h-4 w-4" /> Volver al listado</Button>
                <Card className="border-t-4 border-t-primary shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                            <Rocket className="h-6 w-6 text-primary" /> {view === 'create' ? 'Diseñar Nuevo Reto ABP' : 'Editar Diseño del Reto'}
                        </CardTitle>
                        <CardDescription>Defina un problema del mundo real para que sus alumnos prototipen una solución.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField control={form.control} name="title" render={({ field }) => (
                                    <FormItem><FormLabel className="font-bold">Título del Proyecto</FormLabel><FormControl><Input placeholder="Ej: Sistema de Riego Automatizado IoT" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField control={form.control} name="visibility" render={({ field }) => (
                                        <FormItem><FormLabel className="font-bold">Visibilidad</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Borrador">Borrador</SelectItem><SelectItem value="Interno">Institucional</SelectItem><SelectItem value="Ecosistema Nacional">Ecosistema STEM</SelectItem></SelectContent></Select></FormItem>
                                    )} />
                                    <FormField control={form.control} name="fabLabRequired" render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 bg-muted/20"><div className="space-y-0.5"><FormLabel className="text-xs font-bold">Requiere Fab Lab</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                                    )} />
                                </div>
                                <FormField control={form.control} name="objective" render={({ field }) => (
                                    <FormItem><FormLabel className="font-bold flex items-center gap-2"><Target className="h-4 w-4" /> Reto Real / Objetivo</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="description" render={({ field }) => (
                                    <FormItem><FormLabel className="font-bold flex items-center gap-2"><FileText className="h-4 w-4" /> Descripción Detallada</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="competencies" render={({ field }) => (
                                    <FormItem><FormLabel className="font-bold flex items-center gap-2"><UserCheck className="h-4 w-4" /> Competencias</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <Separator />
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center"><h4 className="text-sm font-black uppercase text-primary">Matriz de Evaluación</h4><Button type="button" variant="outline" size="sm" onClick={addCriteria}><Plus className="h-4 w-4 mr-2" /> Añadir Criterio</Button></div>
                                    {form.watch('rubrics').map((item, index) => (
                                        <div key={item.id} className="p-4 rounded-xl border-2 border-dashed bg-slate-50 flex gap-4 items-start">
                                            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                                                <FormField control={form.control} name={`rubrics.${index}.label`} render={({ field }) => (<FormItem className="md:col-span-1"><FormControl><Input placeholder="Criterio" {...field} /></FormControl></FormItem>)} />
                                                <FormField control={form.control} name={`rubrics.${index}.description`} render={({ field }) => (<FormItem className="md:col-span-2"><FormControl><Input placeholder="Indicador" {...field} /></FormControl></FormItem>)} />
                                                <FormField control={form.control} name={`rubrics.${index}.maxPoints`} render={({ field }) => (<FormItem className="md:col-span-1"><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                                            </div>
                                            <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => form.setValue('rubrics', form.getValues('rubrics').filter(r => r.id !== item.id))} disabled={form.watch('rubrics').length === 1}><Trash2 className="h-4 w-4" /></Button>
                                        </div>
                                    ))}
                                </div>
                                <Button type="submit" disabled={isSaving} size="lg" className="w-full font-black shadow-xl">{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {view === 'create' ? 'PUBLICAR RETO' : 'GUARDAR CAMBIOS'}</Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (view === 'details' && selectedProject) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in zoom-in-95 duration-500">
                <div className="lg:col-span-8 space-y-6">
                    <Button variant="ghost" onClick={() => setView('list')}><ArrowLeft className="mr-2 h-4 w-4" /> Volver al listado</Button>
                    <Card className="border-none shadow-xl overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                        <CardHeader className="p-8">
                            <div className="flex justify-between items-start">
                                <Badge className="bg-white/20 text-white border-none uppercase font-black">Proyecto Activo</Badge>
                                {selectedProject.fabLabRequired && <Badge className="bg-accent text-accent-foreground font-black">FAB LAB REQUERIDO</Badge>}
                            </div>
                            <CardTitle className="text-4xl font-black uppercase tracking-tighter mt-6 leading-tight">{selectedProject.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 pt-0">
                            <div className="p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 leading-relaxed font-medium">
                                {selectedProject.description}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl shadow-lg border-none">
                        <CardHeader><CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-primary">Criterios de Evaluación</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {selectedProject.rubrics.map(rub => (
                                <div key={rub.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-dashed border-primary/20">
                                    <div><p className="font-black text-sm uppercase">{rub.label}</p><p className="text-xs text-muted-foreground">{rub.description}</p></div>
                                    <Badge variant="secondary" className="text-lg font-black bg-white px-4">{rub.maxPoints} pts</Badge>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-4">
                    <ProjectMentor unit={unit} project={selectedProject} />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <LayoutGrid className="h-6 w-6 text-primary" />
                    <div>
                        <h3 className="text-2xl font-black uppercase tracking-tight text-primary">Repositorio de Retos ABP</h3>
                        <p className="text-sm text-muted-foreground font-medium">Gestione los proyectos de innovación disponibles para los grupos de trabajo.</p>
                    </div>
                </div>
                {isTeacher && <Button onClick={() => setView('create')} className="font-black shadow-lg h-12 px-6"><Plus className="mr-2 h-5 w-5" /> NUEVO RETO</Button>}
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {projects.map(proj => (
                    <Card key={proj.id} className="hover:border-primary transition-all shadow-md rounded-2xl overflow-hidden flex flex-col group border-primary/5">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start mb-4">
                                <Badge variant="secondary" className="text-[10px] font-black uppercase">{proj.visibility}</Badge>
                                {isTeacher && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleEdit(proj)}><Edit className="h-4 w-4 mr-2" /> Editar</DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(proj.id)}><Trash2 className="h-4 w-4 mr-2" /> Eliminar</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>
                            <CardTitle className="text-xl font-black uppercase tracking-tight group-hover:text-primary transition-colors leading-tight line-clamp-2 min-h-[3rem]">{proj.title}</CardTitle>
                            <CardDescription className="text-xs mt-2 line-clamp-3 font-medium">{proj.objective}</CardDescription>
                        </CardHeader>
                        <CardFooter className="pt-4 mt-auto border-t bg-muted/20">
                            <Button variant="ghost" className="w-full font-black uppercase text-xs" onClick={() => { setSelectedProject(proj); setView('details'); }}>
                                EXPLORAR PROYECTO <Sparkles className="ml-2 h-4 w-4 text-primary" />
                            </Button>
                        </CardFooter>
                    </Card>
                ))}

                {projects.length === 0 && (
                    <div className="col-span-full py-20 text-center text-muted-foreground border-2 border-dashed rounded-3xl bg-muted/5">
                        <Rocket className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p className="font-bold uppercase text-sm">No hay retos publicados para esta unidad todavía.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
