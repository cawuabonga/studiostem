
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAcademicRecordForStudent, getScheduledDaysForUnit } from '@/config/firebase';
import { getWeeksData } from '@/services/academic-service';
import type { Unit, AcademicRecord, AttendanceStatus, WeekData } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calculator, CalendarCheck, ClipboardList, AlertTriangle, CheckCircle2, CircleDashed } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UnitProgressSummaryProps {
    unit: Unit;
}

export function UnitProgressSummary({ unit }: UnitProgressSummaryProps) {
    const { user, instituteId } = useAuth();
    const [record, setRecord] = useState<AcademicRecord | null>(null);
    const [weeksData, setWeeksData] = useState<WeekData[]>([]);
    const [scheduledDays, setScheduledDays] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    const currentYear = new Date().getFullYear().toString();

    const fetchData = useCallback(async () => {
        if (!instituteId || !user?.documentId) return;
        setLoading(true);
        try {
            const [recordData, allWeeks, days] = await Promise.all([
                getAcademicRecordForStudent(instituteId, unit.id, user.documentId, currentYear, unit.period),
                getWeeksData(instituteId, unit.id, currentYear, unit.period),
                getScheduledDaysForUnit(instituteId, unit.id, currentYear, unit.semester)
            ]);
            setRecord(recordData);
            setWeeksData(allWeeks);
            setScheduledDays(days);
        } catch (error) {
            console.error("Error fetching unit progress:", error);
        } finally {
            setLoading(false);
        }
    }, [instituteId, user?.documentId, unit.id, unit.period, unit.semester, currentYear]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Calcular promedio parcial basado en indicadores
    const partialAverage = useMemo(() => {
        if (!record?.grades) return null;
        const indicatorAverages = Object.values(record.grades).map(grades => {
            const validGrades = grades.map(g => g.grade).filter(g => typeof g === 'number') as number[];
            if (validGrades.length === 0) return null;
            return Math.round(validGrades.reduce((a, b) => a + b, 0) / validGrades.length);
        }).filter(avg => avg !== null) as number[];

        if (indicatorAverages.length === 0) return null;
        return Math.round(indicatorAverages.reduce((a, b) => a + b, 0) / indicatorAverages.length);
    }, [record]);

    // Calcular porcentaje de inasistencia sincronizado con el docente (desde el registro académico)
    const attendanceStats = useMemo(() => {
        if (!record?.attendance) return { percentage: 0, count: 0, isAtRisk: false, limitWeek: unit.attendanceLimitWeek || 16 };
        
        let absences = 0;
        const currentLimit = unit.attendanceLimitWeek || unit.totalWeeks || 16;
        
        // El total de sesiones programadas hasta el límite fijado por el docente
        const sessionsPerWeek = scheduledDays.length || 2; 
        const totalSessionsUntilLimit = currentLimit * sessionsPerWeek;

        Object.entries(record.attendance).forEach(([weekKey, statuses]) => {
            const weekNum = parseInt(weekKey.replace('week_', ''));
            // Solo contamos faltas hasta la semana de corte
            if (weekNum <= currentLimit) {
                statuses.forEach(status => {
                    if (status === 'F' || status === 'J') absences++;
                });
            }
        });

        const percentage = totalSessionsUntilLimit > 0 ? (absences / totalSessionsUntilLimit) * 100 : 0;
        return {
            percentage: Math.round(percentage),
            count: absences,
            isAtRisk: percentage >= 30,
            limitWeek: currentLimit
        };
    }, [record, unit.attendanceLimitWeek, unit.totalWeeks, scheduledDays]);

    // Resumen de tareas
    const taskStats = useMemo(() => {
        const allTasks = weeksData.flatMap(w => w.tasks || []);
        if (allTasks.length === 0) return { total: 0, completed: 0 };

        let completed = 0;
        if (record?.grades) {
            Object.values(record.grades).forEach(indicatorGrades => {
                completed += indicatorGrades.filter(g => g.type === 'task' && g.grade !== null).length;
            });
        }

        return { total: allTasks.length, completed };
    }, [weeksData, record]);

    if (loading) return <div className="grid gap-6 md:grid-cols-3"><Skeleton className="h-40 w-full" /><Skeleton className="h-40 w-full" /><Skeleton className="h-40 w-full" /></div>;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid gap-6 md:grid-cols-3">
                {/* CARD: NOTAS */}
                <Card className="border-l-4 border-l-primary shadow-lg overflow-hidden">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-sm font-black uppercase text-muted-foreground tracking-widest">Promedio Parcial</CardTitle>
                            <Calculator className="h-4 w-4 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center py-4">
                        <div className={cn(
                            "text-6xl font-black transition-colors",
                            partialAverage === null ? "text-muted" : (partialAverage < 13 ? "text-destructive" : "text-primary")
                        )}>
                            {partialAverage ?? '--'}
                        </div>
                        <p className="text-[10px] uppercase font-bold mt-2 text-muted-foreground">Sobre 20 puntos</p>
                    </CardContent>
                </Card>

                {/* CARD: ASISTENCIA */}
                <Card className={cn("border-l-4 shadow-lg", attendanceStats.isAtRisk ? "border-l-destructive" : "border-l-green-500")}>
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                            <div className="space-y-1">
                                <CardTitle className="text-sm font-black uppercase text-muted-foreground tracking-widest">Inasistencias</CardTitle>
                                <p className="text-[9px] font-bold text-primary uppercase">Corte: Sem. {attendanceStats.limitWeek}</p>
                            </div>
                            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-end">
                            <span className="text-4xl font-black">{attendanceStats.percentage}%</span>
                            <Badge variant={attendanceStats.isAtRisk ? "destructive" : "outline"} className="animate-pulse">
                                {attendanceStats.isAtRisk ? "EN RIESGO" : "REGULAR"}
                            </Badge>
                        </div>
                        <Progress value={attendanceStats.percentage} className="h-2" indicatorClassName={attendanceStats.isAtRisk ? "bg-destructive" : "bg-green-500"} />
                        <p className="text-[10px] text-muted-foreground leading-tight">
                            {attendanceStats.isAtRisk 
                                ? "Has superado el 30% de faltas. Riesgo de inhabilitación." 
                                : `Llevas ${attendanceStats.count} inasistencias en ${attendanceStats.limitWeek} semanas.`}
                        </p>
                    </CardContent>
                </Card>

                {/* CARD: TAREAS */}
                <Card className="border-l-4 border-l-accent shadow-lg">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-sm font-black uppercase text-muted-foreground tracking-widest">Cumplimiento</CardTitle>
                            <ClipboardList className="h-4 w-4 text-accent-foreground" />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-end">
                            <span className="text-4xl font-black">{taskStats.completed}/{taskStats.total}</span>
                            <p className="text-[10px] font-bold uppercase text-muted-foreground">Tareas Calificadas</p>
                        </div>
                        <Progress value={taskStats.total > 0 ? (taskStats.completed / taskStats.total) * 100 : 0} className="h-2" />
                        <div className="flex items-center gap-2 text-xs font-medium">
                            {taskStats.completed === taskStats.total && taskStats.total > 0 ? (
                                <><CheckCircle2 className="h-4 w-4 text-green-500" /> <span className="text-green-600">¡Todo al día!</span></>
                            ) : (
                                <><CircleDashed className="h-4 w-4 text-muted-foreground" /> <span>Pendientes de revisión</span></>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ALERTAS Y RECOMENDACIONES */}
            {partialAverage !== null && partialAverage < 13 && (
                <div className="p-4 bg-destructive/10 border-2 border-destructive/20 rounded-xl flex gap-4 items-center animate-bounce">
                    <AlertTriangle className="h-8 w-8 text-destructive" />
                    <div>
                        <h4 className="font-black text-destructive uppercase text-sm">Alerta de Rendimiento</h4>
                        <p className="text-xs text-destructive-foreground font-medium">Tu promedio actual es menor a la nota mínima aprobatoria (13). Te recomendamos revisar los materiales de estudio y participar activamente en el Aula Virtual.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
