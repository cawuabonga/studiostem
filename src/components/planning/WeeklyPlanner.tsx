
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { Unit } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ContentManager } from './ContentManager';
import { Separator } from '../ui/separator';
import { TaskManager } from './TaskManager';
import { useAuth } from '@/contexts/AuthContext';
import { setWeekVisibility, getWeeksVisibility } from '@/config/firebase';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '../ui/skeleton';

interface WeekSectionProps {
    weekNumber: number; 
    unit: Unit; 
    isStudentView: boolean;
    initialVisibility: boolean;
}

// Internal component for a single week's section
function WeekSection({ weekNumber, unit, isStudentView, initialVisibility }: WeekSectionProps) {
    const { instituteId } = useAuth();
    const { toast } = useToast();
    const [isVisible, setIsVisible] = useState(initialVisibility);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        setIsVisible(initialVisibility);
    }, [initialVisibility]);

    const handleVisibilityChange = async (isEnabled: boolean) => {
        if (!instituteId) return;
        setIsUpdating(true);
        try {
            await setWeekVisibility(instituteId, unit.id, weekNumber, isEnabled);
            setIsVisible(isEnabled);
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

    if (isStudentView && !isVisible) {
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
                                    {isVisible ? 'La semana está habilitada y es visible.' : 'La semana está deshabilitada.'}
                                </p>
                            </div>
                            <Switch
                                id={`visibility-switch-${weekNumber}`}
                                checked={isVisible}
                                onCheckedChange={handleVisibilityChange}
                                disabled={isUpdating}
                            />
                        </div>
                    )}
                    
                    <ContentManager unit={unit} weekNumber={weekNumber} isStudentView={isStudentView} />

                    <Separator />
                    
                    <TaskManager unit={unit} weekNumber={weekNumber} isStudentView={isStudentView} />

                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
}


export function WeeklyPlanner({ unit, isStudentView }: WeeklyPlannerProps) {
    const totalWeeks = unit.totalWeeks || 0;
    const { instituteId } = useAuth();
    const [visibilityMap, setVisibilityMap] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(true);

    const fetchVisibility = useCallback(async () => {
        if (!instituteId) return;
        setLoading(true);
        try {
            const map = await getWeeksVisibility(instituteId, unit.id);
            setVisibilityMap(map);
        } catch (error) {
            console.error("Error fetching week visibility:", error);
        } finally {
            setLoading(false);
        }
    }, [instituteId, unit.id]);

    useEffect(() => {
        fetchVisibility();
    }, [fetchVisibility]);

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
                {loading ? (
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
                    </div>
                ) : totalWeeks > 0 ? (
                     <div className="space-y-4">
                        {Array.from({ length: totalWeeks }, (_, i) => i + 1).map(weekNumber => (
                            <WeekSection 
                                key={`week-section-${weekNumber}`}
                                weekNumber={weekNumber}
                                unit={unit}
                                isStudentView={isStudentView}
                                initialVisibility={visibilityMap[`week_${weekNumber}`] || false}
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
