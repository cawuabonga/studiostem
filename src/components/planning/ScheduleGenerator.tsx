
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getUnits, getDefaultScheduleTemplate, saveSchedule, getSchedule } from '@/config/firebase';
import type { Unit, ScheduleBlock, ScheduleTemplate } from '@/types';
import { Skeleton } from '../ui/skeleton';
import { produce } from 'immer';
import { UnassignedUnitCard } from './UnassignedUnitCard';
import { TurnoGrid } from './TurnoGrid';
import { Button } from '../ui/button';
import { Loader2, Save } from 'lucide-react';

interface ScheduleGeneratorProps {
    programId: string;
    year: string;
    semester: number;
}

const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

export function ScheduleGenerator({ programId, year, semester }: ScheduleGeneratorProps) {
    const { instituteId } = useAuth();
    const { toast } = useToast();
    
    const [units, setUnits] = useState<Unit[]>([]);
    const [template, setTemplate] = useState<ScheduleTemplate | null>(null);
    const [schedule, setSchedule] = useState<Record<string, ScheduleBlock>>({}); // Key: `${day}-${hour}`
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const fetchData = useCallback(async () => {
        if (!instituteId) return;
        setLoading(true);
        try {
            const [allUnits, defaultTemplate, savedSchedule] = await Promise.all([
                getUnits(instituteId),
                getDefaultScheduleTemplate(instituteId),
                getSchedule(instituteId, programId, year, semester)
            ]);

            const unitsForSemester = allUnits.filter(u => u.programId === programId && u.semester === semester);
            setUnits(unitsForSemester);
            setTemplate(defaultTemplate);
            setSchedule(savedSchedule);
            
            if (!defaultTemplate) {
                toast({
                    title: "Plantilla no encontrada",
                    description: "No se encontró una plantilla de horario por defecto. Por favor, crea y asigna una en la configuración de horarios.",
                    variant: "destructive",
                    duration: 7000
                });
            }
            
        } catch (error) {
            console.error("Error fetching data for schedule generator:", error);
            toast({ title: "Error", description: "No se pudieron cargar los datos necesarios.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [instituteId, programId, year, semester, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, unit: Unit) => {
        e.dataTransfer.setData("unitId", unit.id);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); 
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, day: string, hour: string) => {
        e.preventDefault();
        const unitId = e.dataTransfer.getData("unitId");
        const cellKey = `${day}-${hour}`;

        if (schedule[cellKey]) {
            toast({ title: "Conflicto de Horario", description: "Ya existe un bloque asignado en esta celda.", variant: "destructive"});
            return;
        }

        const unit = units.find(u => u.id === unitId);
        if (!unit) return;

        const allTimeBlocks = [
            ...(template?.turnos.mañana || []),
            ...(template?.turnos.tarde || []),
            ...(template?.turnos.noche || [])
        ];
        const timeBlock = allTimeBlocks.find(b => b.startTime === hour);

        setSchedule(
            produce(draft => {
                draft[cellKey] = {
                    id: `${unitId}-${day}-${hour}`,
                    dayOfWeek: day as any,
                    startTime: hour,
                    endTime: timeBlock?.endTime || '',
                    unitId,
                    teacherId: '', // To be assigned later
                    environmentId: '', // To be assigned later
                    programId,
                    semester,
                    year
                }
            })
        )
    };
    
    const removeBlock = (day: string, hour: string) => {
        setSchedule(
            produce(draft => {
                delete draft[`${day}-${hour}`];
            })
        );
    }
    
    const handleSaveSchedule = async () => {
        if (!instituteId) return;
        setIsSaving(true);
        try {
            await saveSchedule(instituteId, programId, year, semester, schedule);
            toast({
                title: "Horario Guardado",
                description: "Los cambios en el horario han sido guardados correctamente."
            });
        } catch (error) {
             console.error("Error saving schedule:", error);
            toast({ title: "Error", description: "No se pudo guardar el horario.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };
    
    if (loading) {
        return (
            <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 md:col-span-3"><Skeleton className="h-[500px] w-full"/></div>
                <div className="col-span-12 md:col-span-9"><Skeleton className="h-[500px] w-full"/></div>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-12 gap-6">
            {/* Unassigned Units Panel */}
            <div className="col-span-12 md:col-span-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Unidades por Asignar</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 max-h-[70vh] overflow-y-auto">
                        {units.length > 0 ? units.map(unit => (
                            <UnassignedUnitCard key={unit.id} unit={unit} onDragStart={handleDragStart} />
                        )) : (
                            <p className="text-sm text-muted-foreground text-center py-4">No hay unidades para este semestre.</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Schedule Grid Panel */}
            <div className="col-span-12 md:col-span-9">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>Horario Semanal - {template?.name || 'Sin Plantilla'}</CardTitle>
                                <CardDescription>Arrastra una unidad a un bloque horario para asignarla.</CardDescription>
                            </div>
                            <Button onClick={handleSaveSchedule} disabled={isSaving}>
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                                Guardar Horario
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        {!template ? (
                            <p className="text-center text-destructive py-10">
                                No hay una plantilla de horario por defecto. No se puede generar la cuadrícula.
                            </p>
                        ) : (
                            <div className="grid grid-cols-[auto_repeat(5,minmax(150px,1fr))] gap-px bg-muted">
                                {/* Header row */}
                                <div className="font-semibold p-2 text-center sticky top-0 bg-background z-10">Hora</div>
                                {days.map(day => (
                                    <div key={day} className="font-semibold p-2 text-center sticky top-0 bg-background z-10">{day}</div>
                                ))}

                                {/* Turnos Grid */}
                                <TurnoGrid turno="Mañana" timeBlocks={template.turnos.mañana} {...{ schedule, units, handleDrop, handleDragOver, removeBlock }} />
                                <TurnoGrid turno="Tarde" timeBlocks={template.turnos.tarde} {...{ schedule, units, handleDrop, handleDragOver, removeBlock }} />
                                <TurnoGrid turno="Noche" timeBlocks={template.turnos.noche} {...{ schedule, units, handleDrop, handleDragOver, removeBlock }} />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
