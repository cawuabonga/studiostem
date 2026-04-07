
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getUnits, getDefaultScheduleTemplate, saveSchedule, getAllSchedules, getEnvironments, getTeachers, getAllAssignmentsForYear } from '@/config/firebase';
import type { Unit, ScheduleBlock, ScheduleTemplate, Environment, Teacher, Assignment, TimeBlock, UnitTurno } from '@/types';
import { Skeleton } from '../ui/skeleton';
import { produce } from 'immer';
import { UnassignedUnitCard } from './UnassignedUnitCard';
import { TurnoGrid } from './TurnoGrid';
import { Button } from '../ui/button';
import { Loader2, Save, AlertCircle, Info } from 'lucide-react';
import { OccupiedBlockCard } from './OccupiedBlockCard';
import Link from 'next/link';

interface ScheduleGeneratorProps {
    programId: string;
    year: string;
    semester: number;
    turno: UnitTurno;
}

interface Suggestion {
    originKey: string;
    unit: Unit;
    suggestedKeys: string[];
}

const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

export function ScheduleGenerator({ programId, year, semester, turno }: ScheduleGeneratorProps) {
    const { instituteId } = useAuth();
    const { toast } = useToast();
    
    const [units, setUnits] = useState<Unit[]>([]);
    const [environments, setEnvironments] = useState<Environment[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [assignments, setAssignments] = useState<Assignment>({});
    const [template, setTemplate] = useState<ScheduleTemplate | null>(null);
    const [allSchedules, setAllSchedules] = useState<Record<string, ScheduleBlock>>({});
    const [conflicts, setConflicts] = useState<Record<string, { teacherConflict: boolean; environmentConflict: boolean }>>({});
    const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const fetchData = useCallback(async () => {
        if (!instituteId) return;
        setLoading(true);
        try {
            const [allUnits, defaultTemplate, savedSchedules, fetchedEnvironments, fetchedTeachers, allAssignmentsForYear] = await Promise.all([
                getUnits(instituteId),
                getDefaultScheduleTemplate(instituteId),
                getAllSchedules(instituteId, year, semester), 
                getEnvironments(instituteId),
                getTeachers(instituteId),
                getAllAssignmentsForYear(instituteId, year)
            ]);

            // Filter units specifically for THIS semester AND THIS turno
            const unitsForTurno = allUnits.filter(u => 
                u.programId === programId && 
                u.semester === semester && 
                u.turno === turno
            );
            setUnits(unitsForTurno);
            setTemplate(defaultTemplate);
            setAllSchedules(savedSchedules);
            setEnvironments(fetchedEnvironments);
            setTeachers(fetchedTeachers);
            setAssignments({ ...allAssignmentsForYear['MAR-JUL'], ...allAssignmentsForYear['AGO-DIC'] });
            
        } catch (error) {
            console.error("Error fetching data for schedule generator:", error);
            toast({ title: "Error", description: "No se pudieron cargar los datos necesarios. Verifica la configuración.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [instituteId, programId, year, semester, turno, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
     useEffect(() => {
        const detectConflicts = () => {
            const teacherUsage: Record<string, string[]> = {};
            const environmentUsage: Record<string, string[]> = {};
            const newConflicts: Record<string, { teacherConflict: boolean, environmentConflict: boolean }> = {};

            for (const key in allSchedules) {
                const block = allSchedules[key];
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

            for (const key in allSchedules) {
                const block = allSchedules[key];
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
    }, [allSchedules]);


    const assignedHoursMap = useMemo(() => {
        const map = new Map<string, number>();
        Object.values(allSchedules).forEach(block => {
            if(block.programId === programId && block.semester === semester) {
                map.set(block.unitId, (map.get(block.unitId) || 0) + 1);
            }
        });
        return map;
    }, [allSchedules, programId, semester]);


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

        if (allSchedules[cellKey]) {
            toast({ title: "Conflicto", description: "Este bloque ya está ocupado.", variant: "destructive"});
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

        setAllSchedules(
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
        
        const weeklyHours = (unit.theoreticalHours || 0) + (unit.practicalHours || 0);
        const currentAssigned = Object.values(allSchedules).filter(b => b.unitId === unitId).length;
        const remainingHours = weeklyHours - (currentAssigned + 1);
        
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
                        if (!allSchedules[nextCellKey]) {
                            suggestedKeys.push(nextCellKey);
                        } else {
                            break; 
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

        setAllSchedules(
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
                        environmentId: undefined, 
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
        setAllSchedules(
            produce(draft => {
                delete draft[`${day}-${hour}`];
            })
        );
        setSuggestion(null);
    }

    const updateBlock = (key: string, data: Partial<ScheduleBlock>) => {
         setAllSchedules(
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
            // Filter only the blocks belonging to this specific section (Program, Semester, Turno)
            const scheduleToSave = Object.fromEntries(
                Object.entries(allSchedules).filter(([key, block]) => 
                    block.programId === programId && 
                    block.semester === semester &&
                    units.some(u => u.id === block.unitId) // Verify it belongs to this shift's units
                )
            );
            await saveSchedule(instituteId, programId, year, semester, turno, scheduleToSave);
            toast({ title: "Horario Guardado", description: "Se ha guardado el horario de esta sección." });
        } catch (error) {
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

    if (!template) {
        return (
            <Card className="border-destructive/50 bg-destructive/5">
                <CardHeader className="text-center py-12">
                    <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
                    <CardTitle className="text-destructive">Falta Configuración de Plantilla</CardTitle>
                    <CardDescription className="max-w-md mx-auto mt-2">
                        No se ha encontrado una plantilla de horario por defecto. 
                        Es necesario definir los bloques horarios (mañana, tarde, noche) antes de generar el horario.
                    </CardDescription>
                    <div className="mt-6">
                        <Button asChild variant="outline">
                            <Link href="/dashboard/planificacion/configuracion-horario">
                                Ir a Configurar Plantilla
                            </Link>
                        </Button>
                    </div>
                </CardHeader>
            </Card>
        )
    }

    // Pass the relevant blocks to the grid view
    const currentViewSchedule = Object.fromEntries(
        Object.entries(allSchedules).filter(([key, block]) => 
            block.programId === programId && 
            block.semester === semester
        )
    );

    return (
        <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 md:col-span-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Info className="h-4 w-4" />
                            Unidades ({turno})
                        </CardTitle>
                        <CardDescription>Arrastra para asignar bloques.</CardDescription>
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
                            <p className="text-sm text-muted-foreground text-center py-8">
                                No hay unidades registradas para el turno {turno} en este semestre.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="col-span-12 md:col-span-9">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>Sección: {semester}° Semestre - {turno}</CardTitle>
                                <CardDescription>Gestión de horario para este grupo específico.</CardDescription>
                            </div>
                            <Button onClick={handleSaveSchedule} disabled={isSaving}>
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                                Guardar Sección
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <div className="grid grid-cols-[auto_repeat(5,minmax(200px,1fr))] gap-px bg-muted">
                            <div className="font-semibold p-2 text-center sticky top-0 bg-background z-10">Hora</div>
                            {days.map(day => (
                                <div key={day} className="font-semibold p-2 text-center sticky top-0 bg-background z-10">{day}</div>
                            ))}

                            <TurnoGrid 
                                turno={turno} 
                                timeBlocks={template?.turnos[turno.toLowerCase() as keyof typeof template.turnos] || []}
                                schedule={currentViewSchedule}
                                allSchedules={allSchedules}
                                currentProgramId={programId}
                                suggestion={suggestion}
                                {...{ units, teachers, environments, conflicts, handleDrop, handleDragOver, removeBlock, updateBlock, handleAcceptSuggestion, handleRejectSuggestion }} 
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
