
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { Unit, WeekData } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
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
import { Loader2 } from 'lucide-react';

interface WeekSectionProps {
    weekNumber: number; 
    unit: Unit; 
    isStudentView: boolean;
}

function WeekSection({ weekNumber, unit, isStudentView }: WeekSectionProps) {
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
            console.error(error);
            toast({ title: "Error", description: "No se pudieron cargar los datos de la semana.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [instituteId, unit.id, weekNumber, toast]);

    useEffect(() => {
        fetchWeekData();
    }, [fetchWeekData, dataVersion]);

    const handleVisibilityChange = async (isEnabled: boolean) => {
        if (!instituteId) return;
        setIsUpdating(true);
        try {
            await setWeekVisibility(instituteId, unit.id, weekNumber, isEnabled);
            setWeekData(prev => prev ? { ...prev, isVisible: isEnabled } : null);
            toast({
                title: "Visibilidad Actualizada",
                description: `La semana ${weekNumber} ahora está ${isEnabled ? 'visible' : 'oculta'} para los estudiantes.`,
            });
        } catch (error) {
            console.error("Error updating visibility:", error);
            toast({ title: "Error", description: "No se pudo actualizar la visibilidad.", variant: "destructive"});
        } finally {
            setIsUpdating(false);
        }
    };
    
    const handleSyllabusFieldChange = (field: keyof WeekData, value: string) => {
        setWeekData(prev => prev ? { ...prev, [field]: value } as WeekData : null);
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
            toast({ title: "Éxito", description: "Los campos del sílabo para la semana han sido guardados." });
        } catch (error) {
            console.error("Error saving syllabus fields:", error);
            toast({ title: "Error", description: "No se pudieron guardar los campos.", variant: "destructive" });
        } finally {
            setIsUpdating(false);
        }
    };

    if (loading) {
        return <Skeleton className="h-40 w-full" />;
    }

    if (isStudentView && !weekData?.isVisible) {
         return (
             <div className="border rounded-lg shadow-sm">
                <div className="px-6 py-4">
                    <h3 className="text-lg font-medium text-muted-foreground">Semana {weekNumber}</h3>
                    <p className="text-sm text-muted-foreground mt-2">El contenido de esta semana aún no está disponible.</p>
                </div>
            </div>
        );
    }

    return (
        <Accordion type="single" collapsible className="w-full border rounded-lg shadow-sm">
            <AccordionItem value={`week-${weekNumber}`} className="border-b-0">
                <AccordionTrigger className="text-lg font-medium px-6 py-4">
                    Semana {weekNumber}
                </AccordionTrigger>
                <AccordionContent className="space-y-6 px-6 pb-6">
                    {!isStudentView && (
                        <div className="flex items-center justify-between rounded-lg border p-4 bg-background">
                            <div className="space-y-0.5">
                                <Label htmlFor={`visibility-switch-${weekNumber}`} className="text-base">
                                    Visibilidad para Estudiantes
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    {weekData?.isVisible ? 'La semana está habilitada y es visible.' : 'La semana está deshabilitada.'}
                                </p>
                            </div>
                            <Switch
                                id={`visibility-switch-${weekNumber}`}
                                checked={weekData?.isVisible}
                                onCheckedChange={handleVisibilityChange}
                                disabled={isUpdating}
                            />
                        </div>
                    )}
                    
                    {!isStudentView && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Campos del Sílabo para la Semana</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label className="font-semibold">Elemento de Capacidad Terminal</Label>
                                    <Textarea value={weekData?.capacityElement || ''} onChange={(e) => handleSyllabusFieldChange('capacityElement', e.target.value)} placeholder="Define el objetivo de aprendizaje de la semana..." />
                                </div>
                                <div>
                                    <Label className="font-semibold">Actividades de Aprendizaje</Label>
                                    <Textarea value={weekData?.learningActivities || ''} onChange={(e) => handleSyllabusFieldChange('learningActivities', e.target.value)} placeholder="Describe las actividades a realizar en clase..." />
                                </div>
                                <div>
                                    <Label className="font-semibold">Contenidos Básicos</Label>
                                    <Textarea value={weekData?.basicContents || ''} onChange={(e) => handleSyllabusFieldChange('basicContents', e.target.value)} placeholder="Lista los temas teóricos que se cubrirán..." />
                                </div>
                                <Button size="sm" onClick={handleSaveSyllabusFields} disabled={isUpdating}>
                                    {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Guardar Campos del Sílabo
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    <ContentManager unit={unit} weekNumber={weekNumber} isStudentView={isStudentView} onDataChanged={() => setDataVersion(v => v + 1)} />
                    <Separator />
                    <TaskManager unit={unit} weekNumber={weekNumber} isStudentView={isStudentView} onDataChanged={() => setDataVersion(v => v + 1)} />

                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
}

interface WeeklyPlannerProps {
    unit: Unit;
    isStudentView: boolean;
}

export function WeeklyPlanner({ unit, isStudentView }: WeeklyPlannerProps) {
    const totalWeeks = unit.totalWeeks || 0;
   
    return (
        <Card>
            <CardHeader>
                <CardTitle>Planificación Semanal del Sílabo</CardTitle>
                <CardDescription>
                    {isStudentView
                        ? "Aquí encontrarás los materiales de estudio y tareas para cada semana."
                        : "Organiza los contenidos, actividades y tareas para cada semana de la unidad. Habilita cada semana para que los estudiantes puedan ver su contenido."
                    }
                </CardDescription>
            </CardHeader>
            <CardContent>
                {totalWeeks > 0 ? (
                     <div className="space-y-4">
                        {Array.from({ length: totalWeeks }, (_, i) => i + 1).map(weekNumber => (
                            <WeekSection 
                                key={`week-section-${weekNumber}`}
                                weekNumber={weekNumber}
                                unit={unit}
                                isStudentView={isStudentView}
                            />
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground py-4">
                        El número de semanas para esta unidad no ha sido definido. Edite la unidad para agregarlo.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
