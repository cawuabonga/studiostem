"use client";

import React from 'react';
import type { StudentProfile, AttendanceRecord, AttendanceStatus, AchievementIndicator } from '@/types';
import { format, addDays, startOfWeek } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface AttendancePrintTableProps {
    students: StudentProfile[];
    attendanceRecord: AttendanceRecord | null;
    selectedIndicator: AchievementIndicator;
    scheduledDays: string[];
    periodStartDate?: Date;
    totalWeeks: number;
    limitWeek: number;
}

const dayNameToIndex: { [key: string]: number } = {
    'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6, 'Domingo': 0
};

export function AttendancePrintTable({ 
    students, 
    attendanceRecord, 
    selectedIndicator, 
    scheduledDays, 
    periodStartDate, 
    totalWeeks,
    limitWeek 
}: AttendancePrintTableProps) {
    const { user } = useAuth();
    
    const weeksInRange = Array.from(
        { length: selectedIndicator.endWeek - selectedIndicator.startWeek + 1 },
        (_, i) => selectedIndicator.startWeek + i
    );

    const getWeekDateForDay = (weekNum: number, dayName: string): string => {
        if (!periodStartDate) return '';
        try {
            const startOfFirstWeek = startOfWeek(periodStartDate, { weekStartsOn: 1 });
            const startOfTargetWeek = addDays(startOfFirstWeek, (weekNum - 1) * 7);
            const dayOffset = dayNameToIndex[dayName] - 1;
            const dateOfDay = addDays(startOfTargetWeek, dayOffset);
            return format(dateOfDay, 'dd/MM');
        } catch (e) { return ''; }
    };

    return (
        <div className="w-full overflow-visible">
            <table className="w-full border-collapse border border-black text-[8pt]">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border border-black p-1 text-center w-[30px]" rowSpan={2}>N°</th>
                        <th className="border border-black p-1 text-left w-[200px]" rowSpan={2}>APELLIDOS Y NOMBRES</th>
                        {weeksInRange.map(week => (
                            <th key={week} colSpan={scheduledDays.length} className="border border-black text-center font-bold py-1 bg-gray-50 text-[7pt]">
                                SEMANA {week}
                            </th>
                        ))}
                        <th className="border border-black text-center w-[60px]" rowSpan={2}>
                            RESUMEN (1-{limitWeek})
                        </th>
                    </tr>
                    <tr className="bg-gray-100">
                        {weeksInRange.map(week => (
                            scheduledDays.map(day => (
                                <th key={`${week}-${day}`} className="border border-black text-center p-0.5 font-bold text-[6pt]">
                                    <div className="flex flex-col leading-tight">
                                        <span>{day.substring(0,3)}</span>
                                        <span className="text-[5pt] font-normal">{getWeekDateForDay(week, day)}</span>
                                    </div>
                                </th>
                            ))
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {students.map((student, index) => {
                        const globalSummary = { P: 0, T: 0, F: 0, J: 0, U: 0 };
                        
                        if (attendanceRecord?.records[student.documentId]) {
                            // Cálculo proporcional hasta la semana de corte seleccionada
                            for (let w = 1; w <= limitWeek; w++) {
                                const weekData = attendanceRecord.records[student.documentId][`week_${w}`];
                                if (weekData) {
                                    weekData.forEach(status => {
                                        if (status in globalSummary) {
                                            globalSummary[status as AttendanceStatus]++;
                                        }
                                    });
                                }
                            }
                        }

                        const totalScheduledSessions = limitWeek * scheduledDays.length;
                        const totalAbsences = globalSummary.F + globalSummary.J;
                        const absencePercentage = totalScheduledSessions > 0 ? (totalAbsences / totalScheduledSessions) * 100 : 0;
                        const isAtRisk = absencePercentage >= 30;

                        return (
                            <tr key={`${student.documentId}-${index}`} className={cn(isAtRisk && "bg-gray-100")}>
                                <td className="border border-black text-center p-1">{index + 1}</td>
                                <td className="border border-black p-1 uppercase font-semibold text-[7pt]">
                                    {student.lastName}, {student.firstName}
                                    <span className="block text-[6pt] font-normal text-gray-500">{student.documentId}</span>
                                </td>
                                {weeksInRange.map(week => (
                                    scheduledDays.map((_, dIdx) => {
                                        const status = attendanceRecord?.records[student.documentId]?.[`week_${week}`]?.[dIdx] || 'U';
                                        return (
                                            <td key={`${week}-${dIdx}`} className={cn(
                                                "border border-black text-center p-0.5 font-bold",
                                                status === 'F' && "text-red-600"
                                            )}>
                                                {status === 'U' ? '-' : status}
                                            </td>
                                        );
                                    })
                                ))}
                                <td className="border border-black p-1 text-center text-[7pt]">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="font-bold">F:{globalSummary.F}</span>
                                        <span className={cn("font-black", isAtRisk && "text-red-700 underline")}>
                                            {absencePercentage.toFixed(0)}%
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            
            <div className="mt-4 grid grid-cols-2 gap-8 text-[7pt] uppercase">
                <div className="space-y-1">
                    <p className="font-bold">Leyenda:</p>
                    <div className="flex gap-4">
                        <p>P: Presente</p>
                        <p>F: Falta</p>
                        <p>T: Tardanza</p>
                        <p>J: Justificada</p>
                    </div>
                </div>
                <div className="text-right italic">
                    * El porcentaje de inasistencia se ha calculado proporcionalmente hasta la **Semana {limitWeek}**, sobre un total de {limitWeek * scheduledDays.length} sesiones programadas.
                </div>
            </div>

            <div className="mt-16 flex justify-around no-print-break">
                <div className="border-t border-black px-12 pt-1 text-center min-w-[250px]">
                    <p className="font-black uppercase text-[9pt] leading-tight mb-1">{user?.displayName}</p>
                    <p className="font-bold uppercase text-[7pt] text-gray-600">{user?.programName || 'DOCENTE RESPONSABLE'}</p>
                </div>
                <div className="border-t border-black px-12 pt-1 text-center min-w-[250px]">
                    <p className="font-black uppercase text-[8pt]">COORDINADOR DE {user?.programName?.toUpperCase() || 'PROGRAMA'}</p>
                </div>
            </div>
        </div>
    );
}
