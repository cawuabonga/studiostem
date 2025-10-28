
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getUnits, getAssignments, getEnvironments } from '@/config/firebase';
import type { Unit, Teacher, Assignment, Environment, ScheduleBlock } from '@/types';
import { Skeleton } from '../ui/skeleton';

interface ScheduleGeneratorProps {
    programId: string;
    year: string;
    semester: number;
}

const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const hours = Array.from({ length: 15 }, (_, i) => `${(i + 7).toString().padStart(2, '0')}:00`); // 7:00 to 21:00

export function ScheduleGenerator({ programId, year, semester }: ScheduleGeneratorProps) {
    const { instituteId } = useAuth();
    const { toast } = useToast();
    
    const [units, setUnits] = useState<Unit[]>([]);
    const [environments, setEnvironments] = useState<Environment[]>([]);
    const [schedule, setSchedule] = useState<ScheduleBlock[]>([]);
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
            
            // TODO: Fetch existing schedule for this program/year/semester
            
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
    
    if (loading) {
        return (
            <Card>
                <CardHeader><Skeleton className="h-8 w-1/2"/></CardHeader>
                <CardContent><Skeleton className="h-96 w-full"/></CardContent>
            </Card>
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
                    <CardContent className="space-y-2">
                        {units.length > 0 ? units.map(unit => (
                            <div key={unit.id} className="p-3 border rounded-md bg-muted cursor-grab">
                                <p className="font-semibold">{unit.name}</p>
                                <p className="text-xs text-muted-foreground">{unit.totalHours} horas | {unit.credits} créditos</p>
                            </div>
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
                        <div className="grid grid-cols-[auto_repeat(5,minmax(120px,1fr))] gap-1">
                            {/* Header row */}
                            <div className="font-semibold p-2 text-center sticky top-0 bg-background z-10">Hora</div>
                            {days.map(day => (
                                <div key={day} className="font-semibold p-2 text-center sticky top-0 bg-background z-10">{day}</div>
                            ))}

                            {/* Grid content */}
                            {hours.map(hour => (
                                <React.Fragment key={hour}>
                                    <div className="font-semibold p-2 text-center border-t">{hour}</div>
                                    {days.map(day => (
                                        <div key={`${day}-${hour}`} className="border h-16 bg-muted/20 hover:bg-muted transition-colors">
                                            {/* Placeholder for scheduled blocks */}
                                        </div>
                                    ))}
                                </React.Fragment>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
