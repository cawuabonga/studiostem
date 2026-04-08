
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getUnits, getDefaultScheduleTemplate, getInstituteSchedulesForYear, getEnvironments } from '@/config/firebase';
import type { Unit, ScheduleBlock, ScheduleTemplate, Environment, TimeBlock } from '@/types';
import { Skeleton } from '../ui/skeleton';
import { cn } from '@/lib/utils';
import { AlertCircle, CalendarClock, User, MapPin } from 'lucide-react';

const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

export function ScheduleViewer() {
    const { user, instituteId } = useAuth();
    const { toast } = useToast();
    
    const [units, setUnits] = useState<Unit[]>([]);
    const [template, setTemplate] = useState<ScheduleTemplate | null>(null);
    const [environments, setEnvironments] = useState<Environment[]>([]);
    const [personalSchedule, setPersonalSchedule] = useState<Record<string, ScheduleBlock>>({});
    const [loading, setLoading] = useState(true);

    const year = new Date().getFullYear().toString();

    const fetchData = useCallback(async () => {
        if (!instituteId || !user) return;
        setLoading(true);
        try {
            const [allUnits, defaultTemplate, allSchedules, fetchedEnvironments] = await Promise.all([
                getUnits(instituteId),
                getDefaultScheduleTemplate(instituteId),
                getInstituteSchedulesForYear(instituteId, year),
                getEnvironments(instituteId)
            ]);

            setTemplate(defaultTemplate);
            setEnvironments(fetchedEnvironments);
            setUnits(allUnits);

            const userSchedule: Record<string, ScheduleBlock> = {};

            if (user.role === 'Student') {
                // Alumno: Filtrar por su carrera, ciclo y turno
                const studentSemester = user.currentSemester || 1;
                const studentTurno = (user as any).turno || 'Mañana';
                const studentProgramId = (user as any).programId;

                Object.entries(allSchedules).forEach(([key, block]) => {
                    if (block.programId === studentProgramId && block.semester === studentSemester) {
                        // Verificamos si el turno del bloque coincide con el turno de la sección
                        // Como las keys ya separan secciones, si cargamos por semestre/programa ya tenemos los bloques correctos.
                        // Sin embargo, para seguridad, comparamos que el bloque pertenezca a una de las unidades del turno del alumno.
                        const unitOfBlock = allUnits.find(u => u.id === block.unitId);
                        if (unitOfBlock?.turno === studentTurno) {
                            userSchedule[key] = block;
                        }
                    }
                });
            } else {
                // Docente/Administrativo: Filtrar bloques donde él es el docente asignado
                Object.entries(allSchedules).forEach(([key, block]) => {
                    if (block.teacherId === user.documentId) {
                        userSchedule[key] = block;
                    }
                });
            }

            setPersonalSchedule(userSchedule);
            
        } catch (error) {
            console.error("Error fetching schedule:", error);
            toast({ title: "Error", description: "No se pudo cargar tu horario.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [instituteId, user, year, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const activeTimeBlocks = useMemo(() => {
        if (!template) return [];
        if (user?.role === 'Student') {
            const turno = (user as any).turno?.toLowerCase() || 'mañana';
            return template.turnos[turno as keyof typeof template.turnos] || [];
        }
        // Para docentes, mostrar todos los bloques que tengan al menos una clase asignada
        const allBlocks = [...template.turnos.mañana, ...template.turnos.tarde, ...template.turnos.noche];
        const assignedStartTimes = new Set(Object.values(personalSchedule).map(b => b.startTime));
        
        // Retornar bloques de clase o recesos que estén en medio de clases asignadas
        return allBlocks.filter(b => b.type === 'receso' || assignedStartTimes.has(b.startTime));
    }, [template, user, personalSchedule]);

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    if (!template) {
        return (
            <Card className="bg-muted/50 border-dashed">
                <CardContent className="py-12 text-center text-muted-foreground">
                    <AlertCircle className="mx-auto h-12 w-12 opacity-20 mb-4" />
                    <p>Aún no se ha configurado una plantilla de horario institucional.</p>
                </CardContent>
            </Card>
        );
    }

    if (Object.keys(personalSchedule).length === 0) {
        return (
            <Card className="bg-muted/50 border-dashed">
                <CardContent className="py-12 text-center text-muted-foreground">
                    <CalendarClock className="mx-auto h-12 w-12 opacity-20 mb-4" />
                    <p>No tienes clases programadas para este año académico.</p>
                    <p className="text-xs mt-2">Consulta con tu coordinador de programa.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="overflow-hidden shadow-xl border-primary/20">
            <CardHeader className="bg-primary text-primary-foreground">
                <CardTitle className="flex items-center gap-2">
                    <CalendarClock className="h-6 w-6" />
                    Mi Horario Semanal - {year}
                </CardTitle>
                <CardDescription className="text-primary-foreground/80">
                    {user?.role === 'Student' 
                        ? `Ciclo: ${user.currentSemester}° Semestre | Turno: ${(user as any).turno}`
                        : "Horario consolidado de dictado de clases en todos los programas."
                    }
                </CardDescription>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
                <div className="grid grid-cols-[80px_repeat(5,minmax(180px,1fr))] gap-px bg-muted">
                    {/* Header Row */}
                    <div className="bg-background p-3"></div>
                    {days.map(day => (
                        <div key={day} className="bg-muted/50 p-3 text-center font-bold text-sm uppercase tracking-wider">
                            {day}
                        </div>
                    ))}

                    {/* Time Rows */}
                    {activeTimeBlocks.map((timeBlock, idx) => (
                        <React.Fragment key={`${timeBlock.startTime}-${idx}`}>
                            <div className="bg-background p-3 text-center text-[10px] font-mono border-t flex flex-col justify-center leading-none text-muted-foreground">
                                <span>{timeBlock.startTime}</span>
                                <span className="my-1">|</span>
                                <span>{timeBlock.endTime}</span>
                            </div>
                            {days.map(day => {
                                const cellKey = `${day}-${timeBlock.startTime}`;
                                const block = personalSchedule[cellKey];
                                const unit = block ? units.find(u => u.id === block.unitId) : null;
                                const environment = block ? environments.find(e => e.id === block.environmentId) : null;

                                return (
                                    <div key={cellKey} className={cn(
                                        "bg-background border-t p-2 h-32 transition-colors",
                                        timeBlock.type === 'receso' && "bg-muted/30"
                                    )}>
                                        {timeBlock.type === 'receso' ? (
                                            <div className="h-full flex items-center justify-center text-[10px] uppercase font-bold text-muted-foreground/40 italic">
                                                {timeBlock.label || 'Receso'}
                                            </div>
                                        ) : block && unit ? (
                                            <div className="h-full bg-primary/5 border-l-4 border-l-primary rounded-r-md p-2 flex flex-col justify-between shadow-sm hover:bg-primary/10 transition-all">
                                                <div>
                                                    <p className="font-bold text-[11px] leading-tight text-primary uppercase line-clamp-2">
                                                        {unit.name}
                                                    </p>
                                                    <p className="text-[9px] font-semibold text-muted-foreground mt-1">
                                                        {unit.code}
                                                    </p>
                                                </div>
                                                <div className="space-y-1">
                                                    {user?.role !== 'Student' && (
                                                        <div className="flex items-center gap-1 text-[9px] font-medium text-muted-foreground">
                                                            <User className="h-2.5 w-2.5" />
                                                            <span>Ciclo {block.semester}°</span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-1 text-[9px] font-bold text-accent-foreground bg-accent/20 rounded px-1 w-fit">
                                                        <MapPin className="h-2.5 w-2.5" />
                                                        <span>{environment?.name || 'Aula Pendiente'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
