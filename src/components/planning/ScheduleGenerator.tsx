
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getUnits, getAssignments, getEnvironments } from '@/config/firebase';
import type { Unit, Assignment, Environment, ScheduleBlock } from '@/types';
import { Skeleton } from '../ui/skeleton';
import { produce } from 'immer';
import { UnassignedUnitCard } from './UnassignedUnitCard';
import { ScheduleBlockCard } from './ScheduleBlockCard';

interface ScheduleGeneratorProps {
    programId: string;
    year: string;
    semester: number;
}

const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const hours = Array.from({ length: 15 }, (_, i) => `${(i + 7).toString().padStart(2, '0')}:00`);

export function ScheduleGenerator({ programId, year, semester }: ScheduleGeneratorProps) {
    const { instituteId } = useAuth();
    const { toast } = useToast();
    
    const [units, setUnits] = useState<Unit[]>([]);
    const [environments, setEnvironments] = useState<Environment[]>([]);
    const [schedule, setSchedule] = useState<Record<string, ScheduleBlock>>({}); // Key: `${day}-${hour}`
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!instituteId) return;
        setLoading(true);
        try {
            const [allUnits, allEnvironments] = await Promise.all([
                getUnits(instituteId),
                getEnvironments(instituteId)
            ]);

            const unitsForSemester = allUnits.filter(u => u.programId === programId && u.semester === semester);
            setUnits(unitsForSemester);
            setEnvironments(allEnvironments);
            
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
                    endTime: `${(parseInt(hour.split(':')[0]) + 1).toString().padStart(2, '0')}:00`,
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
                        <CardTitle>Horario Semanal</CardTitle>
                        <CardDescription>Arrastra una unidad a un bloque horario para asignarla.</CardDescription>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <div className="grid grid-cols-[auto_repeat(5,minmax(150px,1fr))] gap-px bg-muted">
                            {/* Header row */}
                            <div className="font-semibold p-2 text-center sticky top-0 bg-background z-10">Hora</div>
                            {days.map(day => (
                                <div key={day} className="font-semibold p-2 text-center sticky top-0 bg-background z-10">{day}</div>
                            ))}

                            {/* Grid content */}
                            {hours.map(hour => (
                                <React.Fragment key={hour}>
                                    <div className="font-semibold p-2 text-center border-t bg-background">{hour}</div>
                                    {days.map(day => {
                                        const cellKey = `${day}-${hour}`;
                                        const block = schedule[cellKey];
                                        const unit = block ? units.find(u => u.id === block.unitId) : null;
                                        
                                        return (
                                            <div 
                                                key={cellKey} 
                                                className="border h-24 bg-background hover:bg-muted/50 transition-colors p-1"
                                                onDragOver={handleDragOver}
                                                onDrop={(e) => handleDrop(e, day, hour)}
                                            >
                                                {block && unit && (
                                                    <ScheduleBlockCard 
                                                        block={block} 
                                                        unit={unit} 
                                                        onRemove={() => removeBlock(day, hour)}
                                                    />
                                                )}
                                            </div>
                                        )
                                    })}
                                </React.Fragment>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
