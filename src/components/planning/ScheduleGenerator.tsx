
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getUnits, getDefaultScheduleTemplate, saveSchedule, getSchedule, getEnvironments, getTeachers, getAssignments } from '@/config/firebase';
import type { Unit, ScheduleBlock, ScheduleTemplate, Environment, Teacher, Assignment, TimeBlock } from '@/types';
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

interface Suggestion {
    originKey: string;
    unit: Unit;
    suggestedKeys: string[];
}

const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

export function ScheduleGenerator({ programId, year, semester }: ScheduleGeneratorProps) {
    const { instituteId } = useAuth();
    const { toast } = useToast();
    
    const [units, setUnits] = useState<Unit[]>([]);
    const [environments, setEnvironments] = useState<Environment[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [assignments, setAssignments] = useState<Assignment>({});
    const [template, setTemplate] = useState<ScheduleTemplate | null>(null);
    const [schedule, setSchedule] = useState<Record<string, ScheduleBlock>>({}); // Key: `${day}-${hour}`
    const [conflicts, setConflicts] = useState<Record<string, { teacherConflict: boolean, environmentConflict: boolean }>>({});
    const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const fetchData = useCallback(async () => {
        if (!instituteId) return;
        setLoading(true);
        try {
            const [allUnits, defaultTemplate, savedSchedule, fetchedEnvironments, fetchedTeachers, fetchedAssignments] = await Promise.all([
                getUnits(instituteId),
                getDefaultScheduleTemplate(instituteId),
                getSchedule(instituteId, programId, year, semester),
                getEnvironments(instituteId),
                getTeachers(instituteId),
                getAssignments(instituteId, year, programId)
            ]);

            const unitsForSemester = allUnits.filter(u => u.programId === programId && u.semester === semester);
            setUnits(unitsForSemester);
            setTemplate(defaultTemplate);
            setSchedule(savedSchedule);
            setEnvironments(fetchedEnvironments);
            
            const teachersInProgram = fetchedTeachers.filter(t => t.programId === programId);
            setTeachers(teachersInProgram);
            
            setAssignments({ ...fetchedAssignments['MAR-JUL'], ...fetchedAssignments['AGO-DIC'] });
            
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
    
    useEffect(() => {
        const detectConflicts = () => {
            const teacherUsage: Record<string, string[]> = {};
            const environmentUsage: Record<string, string[]> = {};
            const newConflicts: Record<string, { teacherConflict: boolean, environmentConflict: boolean }> = {};

            for (const key in schedule) {
                const block = schedule[key];
                const timeSlot = `${block.dayOfWeek}-${block.startTime}`;
                
                if (block.teacherId) {
                    if (!teacherUsage[block.teacherId]) teacherUsage[block.teacherId] = [];
                    teacherUsage[block.teacherId].push(timeSlot);
                }
                if (block.environmentId) {
                    if (!environmentUsage[block.environmentId]) environmentUsage[block.environmentId] = [];
                    environmentUsage[block.environmentId].push(timeSlot);
                }
            }

            for (const key in schedule) {
                const block = schedule[key];
                const timeSlot = `${block.dayOfWeek}-${block.startTime}`;
                let teacherConflict = false;
                let environmentConflict = false;

                if (block.teacherId && teacherUsage[block.teacherId].filter(slot => slot === timeSlot).length > 1) {
                    teacherConflict = true;
                }
                if (block.environmentId && environmentUsage[block.environmentId].filter(slot => slot === timeSlot).length > 1) {
                    environmentConflict = true;
                }

                if (teacherConflict || environmentConflict) {
                    newConflicts[key] = { teacherConflict, environmentConflict };
                }
            }
            setConflicts(newConflicts);
        };

        detectConflicts();
    }, [schedule]);


    const assignedHoursMap = useMemo(() => {
        const map = new Map<string, number>();
        Object.values(schedule).forEach(block => {
            map.set(block.unitId, (map.get(block.unitId) || 0) + 1);
        });
        return map;
    }, [schedule]);


    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, unit: Unit) => {
        e.dataTransfer.setData("unitId", unit.id);
        setSuggestion(null);
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
        const assignedTeacherId = assignments[unitId];

        setSchedule(
            produce(draft => {
                draft[cellKey] = {
                    id: `${unitId}-${day}-${hour}`,
                    dayOfWeek: day as any,
                    startTime: hour,
                    endTime: timeBlock?.endTime || '',
                    unitId,
                    teacherId: assignedTeacherId || undefined,
                    environmentId: undefined,
                    programId,
                    semester,
                    year
                }
            })
        );
        
        // --- Suggestion Logic ---
        const weeklyHours = (unit.theoreticalHours || 0) + (unit.practicalHours || 0);
        const remainingHours = weeklyHours - ((assignedHoursMap.get(unitId) || 0) + 1);
        
        if (remainingHours > 0) {
            const turnoBlocks: TimeBlock[] = template?.turnos.mañana.some(b => b.startTime === hour) ? template.turnos.mañana 
                                         : template?.turnos.tarde.some(b => b.startTime === hour) ? template.turnos.tarde
                                         : template?.turnos.noche || [];
            
            const currentBlockIndex = turnoBlocks.findIndex(b => b.startTime === hour);
            const suggestedKeys: string[] = [];

            if (currentBlockIndex !== -1) {
                for (let i = currentBlockIndex + 1; i < turnoBlocks.length && suggestedKeys.length < remainingHours; i++) {
                    const nextBlock = turnoBlocks[i];
                    if (nextBlock.type === 'clase') {
                        const nextCellKey = `${day}-${nextBlock.startTime}`;
                        if (!schedule[nextCellKey]) {
                            suggestedKeys.push(nextCellKey);
                        } else {
                            break; // Stop if there's an obstacle
                        }
                    }
                }
            }
            if (suggestedKeys.length > 0) {
                setSuggestion({ originKey: cellKey, unit, suggestedKeys });
            }
        }
    };
    
    const handleAcceptSuggestion = () => {
        if (!suggestion) return;

        const allTimeBlocks = [
            ...(template?.turnos.mañana || []),
            ...(template?.turnos.tarde || []),
            ...(template?.turnos.noche || [])
        ];
        const assignedTeacherId = assignments[suggestion.unit.id];

        setSchedule(
            produce(draft => {
                suggestion.suggestedKeys.forEach(key => {
                    const [day, hour] = key.split('-');
                    const timeBlock = allTimeBlocks.find(b => b.startTime === hour);
                    draft[key] = {
                        id: `${suggestion.unit.id}-${key}`,
                        dayOfWeek: day as any,
                        startTime: hour,
                        endTime: timeBlock?.endTime || '',
                        unitId: suggestion.unit.id,
                        teacherId: assignedTeacherId || undefined,
                        environmentId: undefined, // Or copy from origin if set
                        programId,
                        semester,
                        year
                    };
                });
            })
        );
        setSuggestion(null);
    };

    const handleRejectSuggestion = () => {
        setSuggestion(null);
    };

    const removeBlock = (day: string, hour: string) => {
        setSchedule(
            produce(draft => {
                delete draft[`${day}-${hour}`];
            })
        );
        setSuggestion(null);
    }

    const updateBlock = (key: string, data: Partial<ScheduleBlock>) => {
         setSchedule(
            produce(draft => {
                if (draft[key]) {
                    draft[key] = { ...draft[key], ...data };
                }
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
                            <UnassignedUnitCard 
                                key={unit.id} 
                                unit={unit} 
                                assignedHours={assignedHoursMap.get(unit.id) || 0}
                                onDragStart={handleDragStart} 
                            />
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
                            <div className="grid grid-cols-[auto_repeat(5,minmax(200px,1fr))] gap-px bg-muted">
                                {/* Header row */}
                                <div className="font-semibold p-2 text-center sticky top-0 bg-background z-10">Hora</div>
                                {days.map(day => (
                                    <div key={day} className="font-semibold p-2 text-center sticky top-0 bg-background z-10">{day}</div>
                                ))}

                                {/* Turnos Grid */}
                                <TurnoGrid 
                                    turno="Mañana" 
                                    timeBlocks={template.turnos.mañana} 
                                    suggestion={suggestion}
                                    {...{ schedule, units, teachers, environments, conflicts, handleDrop, handleDragOver, removeBlock, updateBlock, handleAcceptSuggestion, handleRejectSuggestion }} 
                                />
                                <TurnoGrid 
                                    turno="Tarde" 
                                    timeBlocks={template.turnos.tarde} 
                                    suggestion={suggestion}
                                    {...{ schedule, units, teachers, environments, conflicts, handleDrop, handleDragOver, removeBlock, updateBlock, handleAcceptSuggestion, handleRejectSuggestion }} 
                                />
                                <TurnoGrid 
                                    turno="Noche" 
                                    timeBlocks={template.turnos.noche} 
                                    suggestion={suggestion}
                                    {...{ schedule, units, teachers, environments, conflicts, handleDrop, handleDragOver, removeBlock, updateBlock, handleAcceptSuggestion, handleRejectSuggestion }} 
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
