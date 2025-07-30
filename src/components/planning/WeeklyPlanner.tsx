
"use client";

import React, { useState } from 'react';
import type { Unit } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ContentManager } from './ContentManager';
import { Separator } from '../ui/separator';
import { TaskManager } from './TaskManager';

interface WeeklyPlannerProps {
    unit: Unit;
}

// Internal component for a single week's section
function WeekSection({ weekNumber, unit }: { weekNumber: number; unit: Unit; }) {
    // In a real implementation, this state would come from Firestore
    const [isVisible, setIsVisible] = useState(false);

    const handleVisibilityChange = (isEnabled: boolean) => {
        setIsVisible(isEnabled);
        // TODO: Add a call to a Firestore function to save this state
        console.log(`Week ${weekNumber} visibility set to ${isEnabled}`);
    };

    return (
        <Accordion type="single" collapsible className="w-full border rounded-lg shadow-sm">
            <AccordionItem value={`week-${weekNumber}`} className="border-b-0">
                <AccordionTrigger className="text-lg font-medium px-6 py-4">
                    Semana {weekNumber}
                </AccordionTrigger>
                <AccordionContent className="space-y-6 px-6 pb-6">
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
                        />
                    </div>
                    
                    <ContentManager unit={unit} weekNumber={weekNumber} />

                    <Separator />
                    
                    <TaskManager unit={unit} weekNumber={weekNumber} />

                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
}


export function WeeklyPlanner({ unit }: WeeklyPlannerProps) {
    const totalWeeks = unit.totalWeeks || 0;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Planificación Semanal del Sílabo</CardTitle>
                <CardDescription>
                    Organiza los contenidos, actividades y tareas para cada semana de la unidad. Habilita cada semana para que los estudiantes puedan ver su contenido.
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
