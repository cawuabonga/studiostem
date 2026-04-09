
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Unit, WeekData } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ContentManager } from './ContentManager';
import { TaskManager } from './TaskManager';
import { useAuth } from '@/contexts/AuthContext';
import { setWeekVisibility, getWeekData, saveWeekSyllabusData, getWeeksData } from '@/config/firebase';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '../ui/skeleton';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Loader2, ArrowLeft, Eye, EyeOff, CheckCircle2, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WeekCardProps {
    weekNumber: number;
    unit: { id: string; totalWeeks: number };
    weekData?: WeekData;
    isStudentView: boolean;
    onClick: () => void;
}

function WeekCard({ weekNumber, unit, weekData, isStudentView, onClick }: WeekCardProps) {
    const isVisible = weekData?.isVisible ?? false;
    
    // In student view, if the week is not visible, we don't render the card at all.
    if (isStudentView && !isVisible) return null;

    const contentCount = weekData?.contents?.length || 0;
    const taskCount = weekData?.tasks?.length || 0;

    return (
        <Card 
            className={cn(
                "cursor-pointer hover:border-primary transition-all group relative overflow-hidden h-full shadow-sm",
                !isVisible && !isStudentView && "opacity-60 bg-muted/20 border-dashed"
            )}
            onClick={onClick}
        >
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-xl font-bold">Semana {weekNumber}</CardTitle>
                    {!isStudentView && (
                        isVisible ? <Eye className="h-4 w-4 text-green-500" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                </div>
                <CardDescription className="line-clamp-2 h-10 text-xs">
                    {weekData?.capacityElement || 'Contenido académico pendiente de programar.'}
                </CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
                <div className="flex gap-2">
                    <Badge variant="outline" className="text-[10px] uppercase font-bold">
                        {contentCount} Recursos
                    </Badge>
                    <Badge variant="secondary" className="text-[10px] uppercase font-bold">
                        {taskCount} Tareas
                    </Badge>
                </div>
            </CardContent>
            <div className={cn(
                "absolute bottom-0 left-0 w-full h-1 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left",
                isVisible && "bg-primary",
                !isVisible && "bg-muted-foreground"
            )} />
        </Card>
    );
}

interface WeekDetailProps {
    weekNumber: number; 
    unit: { id: string; totalWeeks: number }; 
    isStudentView: boolean;
    onBack: () => void;
    onDataChanged: () => void;
}

function WeekDetail({ weekNumber, unit, isStudentView, onBack, onDataChanged }: WeekDetailProps) {
    const { instituteId } = useAuth();
    const { toast } = useToast();
    const [weekData, setWeekData] = useState<WeekData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    const fetchWeekData = useCallback(async () => {
        if (!instituteId) return;
        setLoading(true);
        try {
            const data = await getWeekData(instituteId, unit.id, weekNumber);
            setWeekData(data || {
                weekNumber,
                isVisible: false,
                contents: [],
                tasks: [],
                capacityElement: '',
                learningActivities: '',
                basicContents: '',
            });
        } catch (error) {
            toast({ title: "Error", description: "No se pudieron cargar los detalles de la semana.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [instituteId, unit.id, weekNumber, toast]);

    useEffect(() => { fetchWeekData(); }, [fetchWeekData]);

    const handleVisibilityChange = async (isEnabled: boolean) => {
        if (!instituteId) return;
        setIsUpdating(true);
        try {
            await setWeekVisibility(instituteId, unit.id, weekNumber, isEnabled);
            setWeekData(prev => prev ? { ...prev, isVisible: isEnabled } : null);
            toast({ title: "Visibilidad Actualizada", description: isEnabled ? 'La semana ahora es visible para los alumnos.' : 'La semana ha sido ocultada.' });
            onDataChanged();
        } catch (error) {
            toast({ title: "Error", description: "No se pudo cambiar la visibilidad.", variant: "destructive" });
        } finally {
            setIsUpdating(false);
        }
    };
    
    const handleSaveSyllabusFields = async () => {
        if (!instituteId || !weekData) return;
        setIsUpdating(true);
        try {
            await saveWeekSyllabusData(instituteId, unit.id, weekNumber, {
                capacityElement: weekData.capacityElement,
                learningActivities: weekData.learningActivities,
                basicContents: weekData.basicContents,
            });
            toast({ title: "¡Éxito!", description: "Información del sílabo guardada correctamente." });
            onDataChanged();
        } catch (error) {
            toast({ title: "Error", description: "No se pudo guardar la información.", variant: "destructive" });
        } finally {
            setIsUpdating(false);
        }
    };

    if (loading) return (
        <div className="space-y-6">
            <Button variant="ghost" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4" /> Volver</Button>
            <Skeleton className="h-12 w-1/4" />
            <Skeleton className="h-64 w-full" />
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4" /> Volver a las semanas</Button>
                <div className="text-right">
                    <h2 className="text-2xl font-bold text-primary">Programación Semanal</h2>
                    <p className="text-sm text-muted-foreground font-medium">Semana {weekNumber}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {!isStudentView && (
                        <Card className="border-l-4 border-l-primary shadow-sm relative overflow-hidden">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground font-bold">Configuración de Visibilidad</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base" htmlFor={`visibility-switch-${weekNumber}`}>Publicar para Estudiantes</Label>
                                        <p className="text-xs text-muted-foreground">Activa este control para que los alumnos puedan acceder a los materiales de esta semana.</p>
                                    </div >
                                    <Switch
                                        id={`visibility-switch-${weekNumber}`}
                                        checked={weekData?.isVisible || false}
                                        onCheckedChange={handleVisibilityChange}
                                        disabled={isUpdating}
                                    />
                                </div>
                                {isUpdating && <div className="absolute inset-0 bg-background/50 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
                            </CardContent>
                        </Card>
                    )}

                    <Card className="border-l-4 border-l-primary shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground font-bold">Descripción Académica</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1">
                                <Label htmlFor="capacityElement" className="text-xs font-bold text-muted-foreground">ELEMENTO DE CAPACIDAD</Label>
                                {isStudentView ? (
                                    <p className="p-3 bg-muted/30 rounded-md text-sm italic">"{weekData?.capacityElement || 'No definido.'}"</p>
                                ) : (
                                    <Textarea
                                        id="capacityElement"
                                        placeholder="Describe el elemento de capacidad de esta semana"
                                        value={weekData?.capacityElement || ''}
                                        onChange={e => setWeekData(prev => prev ? ({ ...prev, capacityElement: e.target.value }) : null)}
                                    />
                                )}
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="learningActivities" className="text-xs font-bold text-muted-foreground">ACTIVIDADES DE APRENDIZAJE</Label>
                                {isStudentView ? (
                                    <p className="p-3 bg-muted/30 rounded-md text-sm italic">"{weekData?.learningActivities || 'No definido.'}"</p>
                                ) : (
                                    <Textarea
                                        id="learningActivities"
                                        placeholder="Describe las actividades de aprendizaje de esta semana"
                                        value={weekData?.learningActivities || ''}
                                        onChange={e => setWeekData(prev => prev ? ({ ...prev, learningActivities: e.target.value }) : null)}
                                    />
                                )}
                            </div>
                            {!isStudentView && (
                                <Button disabled={isUpdating} onClick={handleSaveSyllabusFields} className="mt-2">
                                    {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                                    Guardar Cambios Académicos
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    <ContentManager unit={unit as any} weekNumber={weekNumber} isStudentView={isStudentView} onDataChanged={fetchWeekData} />
                </div>

                <div className="space-y-6">
                    <TaskManager unit={unit as any} weekNumber={weekNumber} isStudentView={isStudentView} onDataChanged={fetchWeekData} />
                </div>
            </div>
        </div>
    );
}

interface WeeklyPlannerProps {
    unit: { id: string; totalWeeks: number };
    isStudentView: boolean;
}

export function WeeklyPlanner({ unit, isStudentView }: WeeklyPlannerProps) {
    const { instituteId } = useAuth();
    const [weeksData, setWeeksData] = useState<WeekData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
    const totalWeeks = unit.totalWeeks || 16;
    const { toast } = useToast();

    const fetchAllWeeks = useCallback(async () => {
        if (!instituteId) {
            // Keep loading true while instituteId is being loaded
            return;
        }
        setLoading(true);
        try {
            const data = await getWeeksData(instituteId, unit.id);
            setWeeksData(data);
        } catch (error) {
            console.error("Error fetching weeks data:", error);
            toast({ title: "Error", description: "No se pudieron cargar las semanas de planificación.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [instituteId, unit.id, toast]);

    useEffect(() => {
        fetchAllWeeks();
    }, [fetchAllWeeks]);

    const handleDataChanged = useCallback(() => {
        fetchAllWeeks();
    }, [fetchAllWeeks]);

    const renderGrid = useMemo(() => {
        if (loading) {
            return (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Array.from({ length: totalWeeks }, (_, i) => (
                        <Skeleton key={i} className="h-32 w-full" />
                    ))}
                </div>
            );
        }

        // For students, we only want to show the weeks that are actually visible
        const visibleWeeksData = isStudentView ? weeksData.filter(w => w.isVisible) : weeksData;

        if (isStudentView && visibleWeeksData.length === 0) {
            return (
                <Card className="border-dashed py-12">
                    <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
                        <div className="p-4 bg-muted rounded-full">
                            <Inbox className="h-12 w-12 text-muted-foreground opacity-50" />
                        </div>
                        <div>
                            <CardTitle className="text-xl">Sin contenidos publicados</CardTitle>
                            <CardDescription className="max-w-xs mx-auto mt-2">
                                El docente aún no ha publicado el material de estudio para esta unidad didáctica.
                            </CardDescription>
                        </div>
                    </CardContent>
                </Card>
            );
        }

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: totalWeeks }, (_, i) => {
                    const weekNumber = i + 1;
                    // Improved find logic: try explicit weekNumber field first, fallback to checking id if possible
                    // but we ensure weekNumber is saved correctly in setWeekVisibility and saveWeekSyllabusData
                    const weekData = weeksData.find(week => week.weekNumber === weekNumber);
                    
                    // If student view and week is not visible, don't show the card
                    if (isStudentView && (!weekData || !weekData.isVisible)) return null;

                    return (
                        <WeekCard
                            key={weekNumber}
                            weekNumber={weekNumber}
                            unit={unit}
                            weekData={weekData}
                            isStudentView={isStudentView}
                            onClick={() => setSelectedWeek(weekNumber)}
                        />
                    );
                })}
            </div>
        );
    }, [loading, weeksData, isStudentView, unit, totalWeeks]);

    if (selectedWeek) {
        return (
            <WeekDetail
                weekNumber={selectedWeek}
                unit={unit}
                isStudentView={isStudentView}
                onBack={() => setSelectedWeek(null)}
                onDataChanged={handleDataChanged}
            />
        );
    }

    return (
        <div className="space-y-4">
            {renderGrid}
        </div>
    );
}
