
"use client";

import React from 'react';
import type { StudentProfile, AttendanceRecord, AttendanceStatus, AchievementIndicator } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { addDays, startOfWeek, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarX, CheckCircle2, AlertTriangle, UserX } from 'lucide-react';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface AttendanceSheetProps {
    students: StudentProfile[];
    attendanceRecord: AttendanceRecord | null;
    selectedIndicator: AchievementIndicator;
    scheduledDays: string[];
    onAttendanceChange: (studentId: string, weekNumber: number, dayIndex: number, status: string) => void;
    onBulkMark: (weekNumber: number, dayIndex: number, status: string) => void;
    periodStartDate?: Date;
    totalWeeks: number;
}

const statusOptions: { value: AttendanceStatus, label: string, short: string }[] = [
    { value: 'P', label: 'Presente', short: 'P' },
    { value: 'T', label: 'Tarde', short: 'T' },
    { value: 'F', label: 'Falta', short: 'F' },
    { value: 'J', label: 'Justificada', short: 'J' },
    { value: 'U', label: 'S.M.', short: 'U' },
];

const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
        case 'P': return 'bg-green-100 text-green-700 dark:bg-green-900/30';
        case 'T': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30';
        case 'F': return 'bg-red-100 text-red-700 dark:bg-red-900/30';
        case 'J': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30';
        default: return 'bg-gray-100 text-gray-500';
    }
}

const dayNameToIndex: { [key: string]: number } = {
    'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6, 'Domingo': 0
};

export function AttendanceSheet({ students, attendanceRecord, selectedIndicator, scheduledDays, onAttendanceChange, onBulkMark, periodStartDate, totalWeeks }: AttendanceSheetProps) {
    
    const weeksInRange = Array.from(
        { length: selectedIndicator.endWeek - selectedIndicator.startWeek + 1 },
        (_, i) => selectedIndicator.startWeek + i
    );

    if (scheduledDays.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                <CalendarX className="h-12 w-12 text-amber-500" />
                <p className="max-w-md text-muted-foreground">Esta unidad no tiene días de clase asignados en el horario.</p>
            </div>
        );
    }

    const getWeekDateForDay = (weekNum: number, dayName: string): string | null => {
        if (!periodStartDate) return null;
        try {
            const startOfFirstWeek = startOfWeek(periodStartDate, { weekStartsOn: 1 });
            const startOfSelectedWeek = addDays(startOfFirstWeek, (weekNum - 1) * 7);
            const dayIndex = dayNameToIndex[dayName];
            const dateOfDay = addDays(startOfSelectedWeek, dayIndex - 1);
            return format(dateOfDay, 'dd/MM');
        } catch (e) { return null; }
    }

    return (
        <div className="space-y-4">
            <div className="relative w-full overflow-auto rounded-xl border shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="w-[40px] sticky left-0 bg-muted/80 backdrop-blur z-30 text-center font-bold">N°</TableHead>
                            <TableHead className="w-[280px] sticky left-[40px] bg-muted/80 backdrop-blur z-30 font-bold">Apellidos y Nombres</TableHead>
                            {weeksInRange.map(week => (
                                <React.Fragment key={week}>
                                    <TableHead colSpan={scheduledDays.length} className="text-center border-l border-r border-muted-foreground/20 bg-primary/5 font-black py-2">
                                        SEMANA {week}
                                    </TableHead>
                                </React.Fragment>
                            ))}
                            <TableHead className="text-center min-w-[180px] sticky right-0 bg-primary/10 backdrop-blur z-30 font-black">RESUMEN UNIDAD (1-{totalWeeks})</TableHead>
                        </TableRow>
                        <TableRow className="bg-muted/30">
                            <TableHead className="sticky left-0 bg-background z-20"></TableHead>
                            <TableHead className="sticky left-[40px] bg-background z-20"></TableHead>
                            {weeksInRange.map(week => (
                                scheduledDays.map((day, dIdx) => (
                                    <TableHead key={`${week}-${day}`} className="text-center p-2 min-w-[100px] border-r border-muted/20">
                                        <div className="flex flex-col items-center gap-1">
                                            <span className="text-[10px] uppercase font-bold text-muted-foreground">{day}</span>
                                            <span className="text-xs font-mono">{getWeekDateForDay(week, day)}</span>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-6 w-6 text-green-600 hover:bg-green-100"
                                                            onClick={() => onBulkMark(week, dIdx, 'P')}
                                                        >
                                                            <CheckCircle2 className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent><p>Marcar todos como Presente</p></TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                    </TableHead>
                                ))
                            ))}
                            <TableHead className="sticky right-0 bg-background z-20 text-center text-[10px] uppercase font-bold text-muted-foreground">Estado Crítico</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {students.map((student, index) => {
                            // CALCULATE GLOBAL TOTALS ACROSS ALL WEEKS
                            const globalSummary = { P: 0, T: 0, F: 0, J: 0, U: 0 };
                            let totalSessionsRecorded = 0;
                            
                            if (attendanceRecord?.records[student.documentId]) {
                                Object.values(attendanceRecord.records[student.documentId]).forEach(weekData => {
                                    weekData.forEach(status => {
                                        globalSummary[status as AttendanceStatus]++;
                                        if (status !== 'U') totalSessionsRecorded++;
                                    });
                                });
                            }

                            const totalScheduledSessions = totalWeeks * scheduledDays.length;
                            const totalAbsences = globalSummary.F + globalSummary.J;
                            const absencePercentage = totalScheduledSessions > 0 ? (totalAbsences / totalScheduledSessions) * 100 : 0;
                            const isAtRisk = absencePercentage >= 30;

                            return (
                                <TableRow key={student.documentId} className={cn("hover:bg-muted/20", isAtRisk && "bg-red-50/50 dark:bg-red-900/10")}>
                                    <TableCell className="text-center sticky left-0 bg-background z-10 font-mono text-xs text-muted-foreground">{index + 1}</TableCell>
                                    <TableCell className="sticky left-[40px] bg-background z-10 font-bold border-r">
                                        <div className="flex flex-col">
                                            <span className={cn(isAtRisk && "text-destructive")}>{student.fullName}</span>
                                            <span className="text-[9px] font-mono text-muted-foreground">{student.documentId}</span>
                                        </div>
                                    </TableCell>
                                    {weeksInRange.map(week => (
                                        scheduledDays.map((day, dIdx) => {
                                            const status = attendanceRecord?.records[student.documentId]?.[`week_${week}`]?.[dIdx] || 'U';
                                            return (
                                                <TableCell key={`${week}-${dIdx}`} className="p-1 text-center border-r border-muted/10">
                                                     <Select
                                                        value={status}
                                                        onValueChange={(val) => onAttendanceChange(student.documentId, week, dIdx, val)}
                                                    >
                                                        <SelectTrigger className={cn("w-full h-8 border-0 focus:ring-0 text-[10px] font-bold px-1", getStatusColor(status as AttendanceStatus))}>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {statusOptions.map(opt => (
                                                                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                                                    {opt.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                            );
                                        })
                                    ))}
                                    <TableCell className="sticky right-0 bg-background z-10 text-center border-l shadow-[-4px_0_10px_rgba(0,0,0,0.05)]">
                                        <div className="flex flex-col gap-1 items-center">
                                            <div className="flex gap-1">
                                                <Badge variant="outline" className="text-[9px] bg-green-50 text-green-700">P:{globalSummary.P}</Badge>
                                                <Badge variant="outline" className="text-[9px] bg-red-50 text-red-700">F:{globalSummary.F}</Badge>
                                                <Badge variant="outline" className="text-[9px] bg-blue-50 text-blue-700">J:{globalSummary.J}</Badge>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className={cn("text-[10px] font-black", isAtRisk ? "text-destructive animate-pulse" : "text-primary")}>
                                                    {absencePercentage.toFixed(1)}% Inasist.
                                                </span>
                                                {isAtRisk && (
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger><AlertTriangle className="h-3 w-3 text-destructive" /></TooltipTrigger>
                                                            <TooltipContent className="bg-destructive text-white border-destructive"><p>¡Superó el 30% de inasistencias!</p></TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                )}
                                            </div>
                                            {isAtRisk && (
                                                <Badge variant="destructive" className="h-4 text-[8px] uppercase tracking-tighter">Inhabilitado</Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>
            <div className="flex justify-between items-center px-4 text-xs text-muted-foreground italic">
                <div className="flex gap-4">
                    <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" /> Marcado Rápido disponible por día.</span>
                    <span className="flex items-center gap-1"><UserX className="h-3 w-3 text-red-500" /> Alerta de 30% calculada sobre el total de la unidad.</span>
                </div>
                <p>Estudiantes ordenados alfabéticamente por apellidos.</p>
            </div>
        </div>
    );
}
