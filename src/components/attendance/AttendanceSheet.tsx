
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
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '../ui/tooltip';

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
        case 'P': return 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200';
        case 'T': return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200';
        case 'F': return 'bg-red-100 text-red-700 hover:bg-red-200 border-red-200';
        case 'J': return 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200';
        default: return 'bg-gray-50 text-gray-400 border-gray-200';
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
            // Asumimos que el periodo empieza en la semana 1. 
            // Calculamos el lunes de la semana 1
            const startOfFirstWeek = startOfWeek(periodStartDate, { weekStartsOn: 1 });
            // Calculamos el lunes de la semana objetivo
            const startOfTargetWeek = addDays(startOfFirstWeek, (weekNum - 1) * 7);
            // Obtenemos el índice del día (Lunes=0 en el offset de addDays si empezamos desde lunes)
            const dayOffset = dayNameToIndex[dayName] - 1;
            const dateOfDay = addDays(startOfTargetWeek, dayOffset);
            return format(dateOfDay, 'dd/MM');
        } catch (e) { return null; }
    }

    return (
        <div className="space-y-4">
            <div className="relative w-full overflow-auto rounded-xl border shadow-md">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-100 hover:bg-slate-100 h-10">
                            <TableHead className="w-[40px] sticky left-0 bg-slate-100 z-40 text-center font-bold text-[10px] uppercase border-r">N°</TableHead>
                            <TableHead className="w-[280px] sticky left-[40px] bg-slate-100 z-40 font-bold text-[10px] uppercase border-r">Apellidos y Nombres</TableHead>
                            {weeksInRange.map(week => (
                                <TableHead key={week} colSpan={scheduledDays.length} className="text-center border-r bg-primary/5 font-black text-[11px] py-1">
                                    SEMANA {week}
                                </TableHead>
                            ))}
                            <TableHead className="text-center min-w-[150px] sticky right-0 bg-slate-200 z-40 font-black text-[10px] uppercase">RESUMEN (1-{totalWeeks})</TableHead>
                        </TableRow>
                        <TableRow className="bg-slate-50 hover:bg-slate-50 h-12">
                            <TableHead className="sticky left-0 bg-slate-50 z-30 border-r"></TableHead>
                            <TableHead className="sticky left-[40px] bg-slate-50 z-30 border-r"></TableHead>
                            {weeksInRange.map(week => (
                                scheduledDays.map((day, dIdx) => (
                                    <TableHead key={`${week}-${day}`} className="text-center p-1 min-w-[60px] border-r">
                                        <div className="flex flex-col items-center leading-tight">
                                            <span className="text-[9px] uppercase font-black text-muted-foreground">{day.substring(0,3)}</span>
                                            <span className="text-[10px] font-mono font-bold text-primary">{getWeekDateForDay(week, day)}</span>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-5 w-5 mt-1 text-green-600 hover:bg-green-100 rounded-full"
                                                onClick={() => onBulkMark(week, dIdx, 'P')}
                                            >
                                                <CheckCircle2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </TableHead>
                                ))
                            ))}
                            <TableHead className="sticky right-0 bg-slate-50 z-30 text-center text-[9px] uppercase font-black text-muted-foreground border-l">Inasistencias</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {students.map((student, index) => {
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
                                <TableRow key={student.documentId} className={cn("h-9 hover:bg-slate-50 transition-colors", isAtRisk && "bg-red-50/70")}>
                                    <TableCell className="text-center sticky left-0 bg-white z-20 font-mono text-[10px] text-muted-foreground border-r">{index + 1}</TableCell>
                                    <TableCell className="sticky left-[40px] bg-white z-20 border-r py-1">
                                        <div className="flex flex-col leading-none">
                                            <span className={cn("text-[11px] font-bold uppercase", isAtRisk ? "text-red-700" : "text-slate-700")}>
                                                {student.lastName}, {student.firstName}
                                            </span>
                                            <span className="text-[9px] font-mono text-muted-foreground mt-0.5">{student.documentId}</span>
                                        </div>
                                    </TableCell>
                                    {weeksInRange.map(week => (
                                        scheduledDays.map((day, dIdx) => {
                                            const status = attendanceRecord?.records[student.documentId]?.[`week_${week}`]?.[dIdx] || 'U';
                                            return (
                                                <TableCell key={`${week}-${dIdx}`} className="p-0.5 text-center border-r">
                                                     <Select
                                                        value={status}
                                                        onValueChange={(val) => onAttendanceChange(student.documentId, week, dIdx, val)}
                                                    >
                                                        <SelectTrigger className={cn(
                                                            "w-full h-7 border rounded-sm focus:ring-0 text-[11px] font-black p-0 justify-center", 
                                                            getStatusColor(status as AttendanceStatus)
                                                        )}>
                                                            <SelectValue>
                                                                {statusOptions.find(o => o.value === status)?.short}
                                                            </SelectValue>
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {statusOptions.map(opt => (
                                                                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                                                    <span className="font-bold mr-2">{opt.short}</span> {opt.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                            );
                                        })
                                    ))}
                                    <TableCell className="sticky right-0 bg-white z-20 text-center border-l shadow-[-4px_0_8px_rgba(0,0,0,0.05)] py-1">
                                        <div className="flex flex-col gap-0.5 items-center">
                                            <div className="flex gap-1">
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild><Badge variant="outline" className="text-[9px] px-1 h-4 border-red-200 text-red-700">F:{globalSummary.F}</Badge></TooltipTrigger>
                                                        <TooltipContent><p>Faltas Totales</p></TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                                <Badge variant="outline" className={cn(
                                                    "text-[10px] font-black px-1.5 h-4", 
                                                    isAtRisk ? "bg-red-600 text-white border-red-600 animate-pulse" : "bg-slate-100 text-slate-700"
                                                )}>
                                                    {absencePercentage.toFixed(0)}%
                                                </Badge>
                                            </div>
                                            {isAtRisk && (
                                                <span className="text-[8px] font-black text-red-600 uppercase tracking-tighter">Inhabilitado</span>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>
            <div className="flex flex-wrap justify-between items-center px-2 text-[10px] text-muted-foreground font-medium bg-slate-50 p-2 rounded-lg border border-dashed">
                <div className="flex gap-4">
                    <div className="flex items-center gap-1"><span className="w-3 h-3 bg-green-100 border border-green-200 rounded-sm"></span> <span>P: Presente</span></div>
                    <div className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded-sm"></span> <span>T: Tarde</span></div>
                    <div className="flex items-center gap-1"><span className="w-3 h-3 bg-red-100 border border-red-200 rounded-sm"></span> <span>F: Falta</span></div>
                    <div className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-100 border border-blue-200 rounded-sm"></span> <span>J: Justificada</span></div>
                    <div className="flex items-center gap-1"><span className="w-3 h-3 bg-gray-50 border border-gray-200 rounded-sm"></span> <span>S.M: Sin Marcar</span></div>
                </div>
                <div className="flex gap-3 items-center">
                    <p className="italic">Estudiantes ordenados por apellidos.</p>
                    <div className="flex items-center gap-1 text-red-600 font-bold"><AlertTriangle className="h-3 w-3" /> Límite 30% Inasistencias</div>
                </div>
            </div>
        </div>
    );
}
