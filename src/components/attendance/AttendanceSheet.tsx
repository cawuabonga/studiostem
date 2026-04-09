
"use client";

import React, { useState } from 'react';
import type { StudentProfile, AttendanceRecord, AttendanceStatus } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { addDays, startOfWeek, format } from 'date-fns';
import { CalendarX } from 'lucide-react';


interface AttendanceSheetProps {
    students: StudentProfile[];
    attendanceRecord: AttendanceRecord | null;
    totalWeeks: number;
    scheduledDays: string[];
    onAttendanceChange: (studentId: string, weekNumber: number, dayIndex: number, status: string) => void;
    defaultWeek?: number;
    periodStartDate?: Date;
}

const statusOptions: { value: AttendanceStatus, label: string }[] = [
    { value: 'P', label: 'Presente' },
    { value: 'T', label: 'Tarde' },
    { value: 'F', label: 'Falta' },
    { value: 'J', label: 'Falta Justificada' },
    { value: 'U', label: 'No Marcado' },
];

const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
        case 'P': return 'bg-green-100 dark:bg-green-900';
        case 'T': return 'bg-yellow-100 dark:bg-yellow-900';
        case 'F': return 'bg-red-100 dark:bg-red-900';
        case 'J': return 'bg-blue-100 dark:bg-blue-900';
        default: return 'bg-gray-100 dark:bg-gray-700';
    }
}

const dayNameToIndex: { [key: string]: number } = {
    'Lunes': 1,
    'Martes': 2,
    'Miércoles': 3,
    'Jueves': 4,
    'Viernes': 5,
    'Sábado': 6,
    'Domingo': 0
};

export function AttendanceSheet({ students, attendanceRecord, totalWeeks, scheduledDays, onAttendanceChange, defaultWeek = 1, periodStartDate }: AttendanceSheetProps) {
    const [selectedWeek, setSelectedWeek] = useState<number>(defaultWeek);
    const weekNumber = selectedWeek; 
    
    // Solo mostrar los días que vienen del horario real.
    const daysToShow = scheduledDays;

    if (daysToShow.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                <div className="p-4 bg-amber-50 rounded-full">
                    <CalendarX className="h-12 w-12 text-amber-500" />
                </div>
                <div className="max-w-md">
                    <h3 className="text-lg font-bold">Horario no asignado</h3>
                    <p className="text-sm text-muted-foreground">
                        Esta unidad didáctica aún no tiene días de clase asignados en el Generador de Horarios. 
                        Es necesario que el coordinador genere el horario para habilitar el registro de asistencia.
                    </p>
                </div>
            </div>
        );
    }

    const getWeekDateForDay = (dayName: string): string | null => {
        if (!periodStartDate) return null;
        try {
            const startOfFirstWeek = startOfWeek(periodStartDate, { weekStartsOn: 1 });
            const startOfSelectedWeek = addDays(startOfFirstWeek, (selectedWeek - 1) * 7);
            const dayIndex = dayNameToIndex[dayName];
            const dateOfDay = addDays(startOfSelectedWeek, dayIndex - 1);
            return format(dateOfDay, 'dd/MM');
        } catch (e) {
            return null;
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <Label htmlFor="week-selector" className="text-lg font-medium">Seleccionar Semana:</Label>
                <Select
                    value={String(selectedWeek)}
                    onValueChange={(value) => setSelectedWeek(Number(value))}
                >
                    <SelectTrigger id="week-selector" className="w-[180px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {Array.from({ length: totalWeeks }, (_, i) => i + 1).map(week => (
                            <SelectItem key={week} value={String(week)}>
                                Semana {week}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="relative w-full overflow-auto rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[40px] sticky left-0 bg-background z-10">N°</TableHead>
                            <TableHead className="w-[250px] sticky left-[40px] bg-background z-10">Apellidos y Nombres</TableHead>
                            {daysToShow.map(day => (
                                <TableHead key={day} className="text-center min-w-[150px]">
                                     <div>{day}</div>
                                     <div className="text-xs font-normal text-muted-foreground">
                                        {getWeekDateForDay(day)}
                                     </div>
                                </TableHead>
                            ))}
                            <TableHead className="text-center min-w-[150px] sticky right-0 bg-muted/50 z-10">Resumen Semanal</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {students.map((student, index) => {
                            const weekKey = `week_${weekNumber}`;
                            const weeklyData = attendanceRecord?.records?.[student.documentId]?.[weekKey] || Array(daysToShow.length).fill('U');
                            
                            const summary = weeklyData.reduce((acc, status) => {
                                acc[status] = (acc[status] || 0) + 1;
                                return acc;
                            }, {} as Record<string, number>);

                            return (
                                <TableRow key={student.documentId}>
                                    <TableCell className="text-center sticky left-0 bg-background z-10">{index + 1}</TableCell>
                                    <TableCell className="font-medium sticky left-[40px] bg-background z-10">{student.fullName}</TableCell>
                                    {daysToShow.map((day, dayIndex) => (
                                        <TableCell key={dayIndex} className="text-center p-1">
                                             <Select
                                                value={weeklyData[dayIndex] || 'U'}
                                                onValueChange={(value) => onAttendanceChange(student.documentId, weekNumber, dayIndex, value)}
                                            >
                                                <SelectTrigger className={cn("w-full border-0 focus:ring-0", getStatusColor(weeklyData[dayIndex] as AttendanceStatus))}>
                                                    <SelectValue placeholder="Marcar" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {statusOptions.map(opt => (
                                                        <SelectItem key={opt.value} value={opt.value}>
                                                            <span className={cn(getStatusColor(opt.value), "px-2 py-1 rounded-md")}>{opt.label}</span>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                    ))}
                                    <TableCell className="sticky right-0 bg-muted/50 z-10 text-center">
                                        <div className="flex gap-2 justify-center">
                                            {Object.entries(summary).map(([status, count]) => (
                                                 <Badge key={status} variant="secondary" className={cn("text-xs", getStatusColor(status as AttendanceStatus))}>
                                                    {status}: {count}
                                                </Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
