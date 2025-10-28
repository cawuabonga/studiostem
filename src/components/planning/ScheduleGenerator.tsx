
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getUnits, getEnvironments, getDefaultScheduleTemplate } from '@/config/firebase';
import type { Unit, Environment, ScheduleBlock, ScheduleTemplate, TimeBlock, TimeBlockType } from '@/types';
import { Skeleton } from '../ui/skeleton';
import { produce } from 'immer';
import { UnassignedUnitCard } from './UnassignedUnitCard';
import { ScheduleBlockCard } from './ScheduleBlockCard';
import { Separator } from '../ui/separator';

interface ScheduleGeneratorProps {
    programId: string;
    year: string;
    semester: number;
}

const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

const TurnoGrid = ({
    turno,
    timeBlocks,
    schedule,
    units,
    handleDrop,
    handleDragOver,
    removeBlock
}: {
    turno: string,
    timeBlocks: TimeBlock[],
    schedule: Record<string, ScheduleBlock>,
    units: Unit[],
    handleDrop: (e: React.DragEvent<HTMLDivElement>, day: string, hour: string) => void,
    handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void,
    removeBlock: (day: string, hour: string) => void
}) => {
    if (timeBlocks.length === 0) return null;
    
    return (
        <>
            <div className="col-span-6 bg-muted p-2 text-center font-bold text-sm sticky top-[48px] z-10">{turno}</div>
            {timeBlocks.map(block => (
                <React.Fragment key={block.startTime}>
                    <div className="font-semibold p-2 text-center text-xs border-t bg-background flex flex-col justify-center">
                        <span>{block.startTime}</span>
                        <span>-</span>
                        <span>{block.endTime}</span>
                    </div>
                    {days.map(day => {
                        const cellKey = `${day}-${block.startTime}`;
                        const scheduleBlock = schedule[cellKey];
                        const unit = scheduleBlock ? units.find(u => u.id === scheduleBlock.unitId) : null;
                        const isReceso = block.type === 'receso';

                        return (
                            <div 
                                key={cellKey} 
                                className={`border h-24 p-1 ${isReceso ? 'bg-muted/60' : 'bg-background hover:bg-muted/50 transition-colors'}`}
                                onDragOver={!isReceso ? handleDragOver : undefined}
                                onDrop={!isReceso ? (e) => handleDrop(e, day, block.startTime) : undefined}
                            >
                               {isReceso ? (
                                    <div className="flex items-center justify-center h-full text-muted-foreground text-xs font-semibold">
                                        {block.label || 'Receso'}
                                    </div>
                                ) : scheduleBlock && unit ? (
                                     <ScheduleBlockCard 
                                        block={scheduleBlock} 
                                        unit={unit} 
                                        onRemove={() => removeBlock(day, block.startTime)}
                                    />
                                ) : null}
                            </div>
                        )
                    })}
                </React.Fragment>
            ))}
        </>
    )
}


export function ScheduleGenerator({ programId, year, semester }: ScheduleGeneratorProps) {
    const { instituteId } = useAuth();
    const { toast } = useToast();
    
    const [units, setUnits] = useState<Unit[]>([]);
    const [template, setTemplate] = useState<ScheduleTemplate | null>(null);
    const [schedule, setSchedule] = useState<Record<string, ScheduleBlock>>({}); // Key: `${day}-${hour}`
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!instituteId) return;
        setLoading(true);
        try {
            const [allUnits, defaultTemplate] = await Promise.all([
                getUnits(instituteId),
                getDefaultScheduleTemplate(instituteId),
            ]);

            const unitsForSemester = allUnits.filter(u => u.programId === programId && u.semester === semester);
            setUnits(unitsForSemester);
            setTemplate(defaultTemplate);
            
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

        setSchedule(
            produce(draft => {
                draft[cellKey] = {
                    id: `${unitId}-${day}-${hour}`,
                    dayOfWeek: day as any,
                    startTime: hour,
                    endTime: template?.turnos.mañana.find(b => b.startTime === hour)?.endTime || '', // Simplified, needs better logic
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
                        <CardTitle>Horario Semanal - {template?.name || 'Sin Plantilla'}</CardTitle>
                        <CardDescription>Arrastra una unidad a un bloque horario para asignarla.</CardDescription>
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
