
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getUnits, getDefaultScheduleTemplate, getInstituteSchedulesForYear, getEnvironments } from '@/config/firebase';
import type { Unit, ScheduleBlock, ScheduleTemplate, Environment, TimeBlock, UnitPeriod } from '@/types';
import { Skeleton } from '../ui/skeleton';
import { cn } from '@/lib/utils';
import { AlertCircle, CalendarClock, User, MapPin, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';

const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const periods: UnitPeriod[] = ['MAR-JUL', 'AGO-DIC'];

export function ScheduleViewer() {
    const { user, instituteId } = useAuth();
    const { toast } = useToast();
    
    const [units, setUnits] = useState<Unit[]>([]);
    const [template, setTemplate] = useState<ScheduleTemplate | null>(null);
    const [environments, setEnvironments] = useState<Environment[]>([]);
    const [allSchedules, setAllSchedules] = useState<ScheduleBlock[]>([]);
    const [loading, setLoading] = useState(true);

    const year = new Date().getFullYear().toString();
    const [selectedPeriod, setSelectedPeriod] = useState<UnitPeriod>(() => {
        // Autodetect period based on current month (MAR-JUL approx)
        const month = new Date().getMonth();
        return (month >= 2 && month <= 6) ? 'MAR-JUL' : 'AGO-DIC';
    });

    const fetchData = useCallback(async () => {
        if (!instituteId || !user) return;
        setLoading(true);
        try {
            const [allUnits, defaultTemplate, fetchedSchedules, fetchedEnvironments] = await Promise.all([
                getUnits(instituteId),
                getDefaultScheduleTemplate(instituteId),
                getInstituteSchedulesForYear(instituteId, year),
                getEnvironments(instituteId)
            ]);

            setTemplate(defaultTemplate);
            setEnvironments(fetchedEnvironments);
            setUnits(allUnits);
            setAllSchedules(fetchedSchedules);
            
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

    const personalSchedule = useMemo(() => {
        const userSchedule: Record<string, ScheduleBlock> = {};

        if (user?.role === 'Student') {
            const studentSemester = user.currentSemester || 1;
            const studentTurno = (user as any).turno || 'Mañana';
            const studentProgramId = (user as any).programId;

            allSchedules.forEach((block) => {
                if (block.programId === studentProgramId && 
                    block.semester === studentSemester && 
                    block.period === selectedPeriod) {
                    const unitOfBlock = units.find(u => u.id === block.unitId);
                    if (unitOfBlock?.turno === studentTurno) {
                        userSchedule[`${block.dayOfWeek}-${block.startTime}`] = block;
                    }
                }
            });
        } else {
            // Teacher/Staff
            allSchedules.forEach((block) => {
                if (block.teacherId === user?.documentId && block.period === selectedPeriod) {
                    userSchedule[`${block.dayOfWeek}-${block.startTime}`] = block;
                }
            });
        }
        return userSchedule;
    }, [allSchedules, user, units, selectedPeriod]);

    const activeTimeBlocks = useMemo(() => {
        if (!template) return [];
        if (user?.role === 'Student') {
            const turno = (user as any).turno?.toLowerCase() || 'mañana';
            return template.turnos[turno as keyof typeof template.turnos] || [];
        }
        // For teachers, show combined blocks from all shifts
        const allBlocks = [
            ...template.turnos.mañana,
            ...template.turnos.tarde,
            ...template.turnos.noche
        ];
        return allBlocks.filter((block, index, self) =>
            index === self.findIndex((t) => t.startTime === block.startTime)
        ).sort((a, b) => a.startTime.localeCompare(b.startTime));
    }, [template, user]);

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

    return (
        <div className="space-y-6">
            <Card className="no-print">
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <Label htmlFor="period-selector" className="font-bold flex items-center gap-2 text-primary whitespace-nowrap">
                            <Filter className="h-4 w-4" /> SELECCIONAR PERIODO:
                        </Label>
                        <Select value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as UnitPeriod)}>
                            <SelectTrigger id="period-selector" className="w-[200px] h-10 font-bold">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {periods.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground italic">
                            Mostrando programación para el año {year}.
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card className="overflow-hidden shadow-xl border-primary/20">
                <CardHeader className="bg-primary text-primary-foreground">
                    <CardTitle className="flex items-center gap-2">
                        <CalendarClock className="h-6 w-6" />
                        Mi Horario Semanal - {selectedPeriod} {year}
                    </CardTitle>
                    <CardDescription className="text-primary-foreground/80">
                        {user?.role === 'Student' 
                            ? `Ciclo: ${user.currentSemester || 1}° Semestre | Turno: ${(user as any).turno}`
                            : "Horario consolidado de dictado de clases asignado para este periodo lectivo."
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                    {Object.keys(personalSchedule).length > 0 ? (
                        <div className="grid grid-cols-[80px_repeat(5,minmax(180px,1fr))] gap-px bg-muted">
                            <div className="bg-background p-3"></div>
                            {days.map(day => (
                                <div key={day} className="bg-muted/50 p-3 text-center font-bold text-sm uppercase tracking-wider">
                                    {day}
                                </div>
                            ))}

                            {activeTimeBlocks.map((timeBlock, idx) => {
                                const hasClassesInRow = days.some(day => personalSchedule[`${day}-${timeBlock.startTime}`]);
                                const isReceso = timeBlock.type === 'receso';
                                const rowHeightClass = isReceso ? "h-10" : (hasClassesInRow ? "h-32" : "h-12");

                                return (
                                    <React.Fragment key={`${timeBlock.startTime}-${idx}`}>
                                        <div className={cn(
                                            "bg-background p-2 text-center text-[10px] font-mono border-t flex flex-col justify-center leading-none text-muted-foreground",
                                            rowHeightClass
                                        )}>
                                            <span>{timeBlock.startTime}</span>
                                            {!isReceso && hasClassesInRow && <span className="my-1">|</span>}
                                            {!isReceso && hasClassesInRow && <span>{timeBlock.endTime}</span>}
                                        </div>
                                        {days.map(day => {
                                            const cellKey = `${day}-${timeBlock.startTime}`;
                                            const block = personalSchedule[cellKey];
                                            const unit = block ? units.find(u => u.id === block.unitId) : null;
                                            const environment = block ? environments.find(e => e.id === block.environmentId) : null;

                                            return (
                                                <div key={cellKey} className={cn(
                                                    "bg-background border-t p-1 transition-all duration-200",
                                                    rowHeightClass,
                                                    isReceso && "bg-muted/30"
                                                )}>
                                                    {isReceso ? (
                                                        <div className="h-full flex items-center justify-center text-[9px] uppercase font-bold text-muted-foreground/30 italic">
                                                            {timeBlock.label || 'Receso'}
                                                        </div>
                                                    ) : block && unit ? (
                                                        <div className="h-full bg-primary/5 border-l-4 border-l-primary rounded-r-md p-2 flex flex-col justify-between shadow-sm hover:bg-primary/10 transition-all">
                                                            <div>
                                                                <p className="font-bold text-[10px] leading-tight text-primary uppercase line-clamp-2">
                                                                    {unit.name}
                                                                </p>
                                                                <p className="text-[8px] font-semibold text-muted-foreground mt-0.5">
                                                                    {unit.code}
                                                                </p>
                                                            </div>
                                                            <div className="flex justify-between items-end">
                                                                {user?.role !== 'Student' && (
                                                                    <div className="flex items-center gap-1 text-[8px] font-medium text-muted-foreground">
                                                                        <User className="h-2.5 w-2.5" />
                                                                        <span>Ciclo {block.semester}°</span>
                                                                    </div>
                                                                )}
                                                                <div className="flex items-center gap-1 text-[8px] font-bold text-accent-foreground bg-accent/20 rounded px-1 w-fit">
                                                                    <MapPin className="h-2.5 w-2.5" />
                                                                    <span>{environment?.name || 'A.P.'}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            );
                                        })}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-24 text-center text-muted-foreground border-t">
                            <CalendarClock className="mx-auto h-12 w-12 opacity-20 mb-4" />
                            <p className="font-bold">No tienes clases programadas para el periodo {selectedPeriod}.</p>
                            <p className="text-xs mt-2">Prueba cambiando el periodo en el filtro superior o consulta con tu coordinación.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
