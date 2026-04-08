
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { Unit, WeekData } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ContentManager } from './ContentManager';
import { Separator } from '../ui/separator';
import { TaskManager } from './TaskManager';
import { useAuth } from '@/contexts/AuthContext';
import { setWeekVisibility, getWeekData, saveWeekSyllabusData } from '@/config/firebase';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '../ui/skeleton';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Loader2, ArrowLeft, Eye, EyeOff, FileText, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WeekCardProps {
    weekNumber: number;
    unit: Unit;
    isStudentView: boolean;
    onClick: () => void;
}

function WeekCard({ weekNumber, unit, isStudentView, onClick }: WeekCardProps) {
    const { instituteId } = useAuth();
    const [weekData, setWeekData] = useState<WeekData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!instituteId) return;
        getWeekData(instituteId, unit.id, weekNumber).then(setWeekData).finally(() => setLoading(false));
    }, [instituteId, unit.id, weekNumber]);

    if (loading) return <Skeleton className="h-32 w-full" />;

    const isVisible = weekData?.isVisible ?? false;
    if (isStudentView && !isVisible) return null;

    const contentCount = weekData?.contents?.length || 0;
    const taskCount = weekData?.tasks?.length || 0;

    return (
        <Card 
            className={cn(
                "cursor-pointer hover:border-primary transition-all group relative overflow-hidden",
                !isVisible && !isStudentView && "opacity-60 bg-muted/20"
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
                <CardDescription className="line-clamp-1">{weekData?.capacityElement || 'Sin descripción'}</CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
                <div className="flex gap-2">
                    <Badge variant="outline" className="text-[10px] uppercase">
                        {contentCount} Recursos
                    </Badge>
                    <Badge variant="secondary" className="text-[10px] uppercase">
                        {taskCount} Tareas
                    </Badge>
                </div>
            </CardContent>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
        </Card>
    );
}

interface WeekDetailProps {
    weekNumber: number; 
    unit: Unit; 
    isStudentView: boolean;
    onBack: () => void;
}

function WeekDetail({ weekNumber, unit, isStudentView, onBack }: WeekDetailProps) {
    const { instituteId } = useAuth();
    const { toast } = useToast();
    const [weekData, setWeekData] = useState<WeekData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [dataVersion, setDataVersion] = useState(0);

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
            toast({ title: "Error", description: "No se pudieron cargar los datos.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [instituteId, unit.id, weekNumber, toast]);

    useEffect(() => { fetchWeekData(); }, [fetchWeekData, dataVersion]);

    const handleVisibilityChange = async (isEnabled: boolean) => {
        if (!instituteId) return;
        setIsUpdating(true);
        try {
            await setWeekVisibility(instituteId, unit.id, weekNumber, isEnabled);
            setWeekData(prev => prev ? { ...prev, isVisible: isEnabled } : null);
            toast({ title: "Visibilidad Actualizada", description: isEnabled ? 'Visible para alumnos' : 'Oculto para alumnos' });
        } catch (error) {
            toast({ title: "Error", variant: "destructive" });
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
            toast({ title: "¡Éxito!", description: "Información del sílabo guardada." });
        } catch (error) {
            toast({ title: "Error", variant: "destructive" });
        } finally {
            setIsUpdating(false);
        }
    };

    if (loading) return <div className="space-y-6"><Skeleton className="h-12 w-1/4" /><Skeleton className="h-64 w-full" /></div>;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4" /> Volver a las semanas</Button>
                <h2 className="text-2xl font-bold text-primary">Semana {weekNumber}</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {!isStudentView && (
                        <Card className="border-l-4 border-l-primary">
                            <CardHeader className="pb-2"><CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Configuración de Semana</CardTitle></CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Publicar Semana</Label>
                                        <p className="text-xs text-muted-foreground">Habilita este interruptor para que los alumnos puedan ver los recursos y tareas.</p>
                                    </div>
                                    <Switch checked={weekData?.isVisible} onCheckedChange={handleVisibilityChange} disabled={isUpdating} />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5" /> Información Académica</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Capacidad Terminal</Label>
                                {isStudentView ? <p className="text-sm mt-1">{weekData?.capacityElement || 'No definido'}</p> : 
                                <Textarea value={weekData?.capacityElement || ''} onChange={e => setWeekData(p => p ? {...p, capacityElement: e.target.value} : null)} placeholder="..." />}
                            </div>
                            <div>
                                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Actividades de Aprendizaje</Label>
                                {isStudentView ? <p className="text-sm mt-1">{weekData?.learningActivities || 'No definido'}</p> : 
                                <Textarea value={weekData?.learningActivities || ''} onChange={e => setWeekData(p => p ? {...p, learningActivities: e.target.value} : null)} placeholder="..." />}
                            </div>
                            {!isStudentView && <Button size="sm" onClick={handleSaveSyllabusFields} disabled={isUpdating}>{isUpdating ? <Loader2 className="animate-spin h-4 w-4" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}Guardar Información</Button>}
                        </CardContent>
                    </Card>

                    <ContentManager unit={unit} weekNumber={weekNumber} isStudentView={isStudentView} onDataChanged={() => setDataVersion(v => v + 1)} />
                </div>

                <div className="space-y-6">
                    <TaskManager unit={unit} weekNumber={weekNumber} isStudentView={isStudentView} onDataChanged={() => setDataVersion(v => v + 1)} />
                </div>
            </div>
        </div>
    );
}

interface WeeklyPlannerProps {
    unit: Unit;
    isStudentView: boolean;
}

export function WeeklyPlanner({ unit, isStudentView }: WeeklyPlannerProps) {
    const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
    const totalWeeks = unit.totalWeeks || 16;
   
    return (
        <Card className="min-h-[600px]">
            <CardHeader>
                <CardTitle>Planificación de la Unidad Didáctica</CardTitle>
                <CardDescription>
                    {isStudentView ? "Explora los contenidos y cumple con tus tareas semanales." : "Organiza los recursos y actividades por semanas."}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {selectedWeek === null ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {Array.from({ length: totalWeeks }, (_, i) => i + 1).map(num => (
                            <WeekCard key={num} weekNumber={num} unit={unit} isStudentView={isStudentView} onClick={() => setSelectedWeek(num)} />
                        ))}
                    </div>
                ) : (
                    <WeekDetail weekNumber={selectedWeek} unit={unit} isStudentView={isStudentView} onBack={() => setSelectedWeek(null)} />
                )}
            </CardContent>
        </Card>
    );
}
