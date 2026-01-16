
"use client";

import React, { useMemo } from 'react';
import type { AccessLog } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Clock, Calendar, Hourglass } from 'lucide-react';
import { format, differenceInMinutes, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

interface StaffAttendanceSummaryProps {
    logs: AccessLog[];
}

const StatCard = ({ title, value, icon: Icon }: { title: string, value: string, icon: React.ElementType }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);


export function StaffAttendanceSummary({ logs }: StaffAttendanceSummaryProps) {
    const dailyHours = useMemo(() => {
        const groupedByDay: Record<string, AccessLog[]> = {};
        logs.forEach(log => {
            const day = format(log.timestamp.toDate(), 'yyyy-MM-dd');
            if (!groupedByDay[day]) {
                groupedByDay[day] = [];
            }
            groupedByDay[day].push(log);
        });

        const dailyTotals: Record<string, number> = {};

        for (const day in groupedByDay) {
            const dayLogs = groupedByDay[day].sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis());
            let totalMinutes = 0;
            let lastEntryTime: Date | null = null;

            dayLogs.forEach(log => {
                if (log.type === 'Entrada') {
                    if (!lastEntryTime) { // Start of a new session
                        lastEntryTime = log.timestamp.toDate();
                    }
                } else if (log.type === 'Salida') {
                    if (lastEntryTime) {
                        totalMinutes += differenceInMinutes(log.timestamp.toDate(), lastEntryTime);
                        lastEntryTime = null; // Reset for next session
                    }
                }
            });
            dailyTotals[day] = totalMinutes;
        }

        return Object.entries(dailyTotals).sort(([dayA], [dayB]) => dayB.localeCompare(dayA));
    }, [logs]);

    const totalMinutesInRange = useMemo(() => {
        return dailyHours.reduce((acc, [, minutes]) => acc + minutes, 0);
    }, [dailyHours]);

    const totalHours = Math.floor(totalMinutesInRange / 60);
    const remainingMinutes = totalMinutesInRange % 60;
    const formattedTotalTime = `${totalHours}h ${remainingMinutes}m`;
    const totalDaysWorked = dailyHours.filter(([, minutes]) => minutes > 0).length;
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Resumen de Horas Trabajadas</CardTitle>
                <CardDescription>Cálculo de horas basado en los registros de entrada y salida para el rango de fechas seleccionado.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                 <div className="grid gap-4 md:grid-cols-3">
                    <StatCard title="Horas Totales en Rango" value={formattedTotalTime} icon={Clock} />
                    <StatCard title="Días Trabajados" value={String(totalDaysWorked)} icon={Calendar} />
                    <StatCard title="Promedio Diario" value={totalDaysWorked > 0 ? `${Math.floor((totalMinutesInRange / totalDaysWorked) / 60)}h ${Math.round((totalMinutesInRange / totalDaysWorked) % 60)}m` : '0h 0m'} icon={Hourglass} />
                </div>
                <div className="rounded-md border overflow-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Fecha</TableHead>
                                <TableHead className="text-right">Horas Trabajadas</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                             {dailyHours.length > 0 ? dailyHours.map(([day, minutes]) => {
                                const hours = Math.floor(minutes / 60);
                                const mins = minutes % 60;
                                return (
                                    <TableRow key={day}>
                                        <TableCell className="font-medium">{format(new Date(day), "PPP", { locale: es })}</TableCell>
                                        <TableCell className="text-right font-semibold">{hours}h {mins}m</TableCell>
                                    </TableRow>
                                );
                            }) : (
                                <TableRow>
                                    <TableCell colSpan={2} className="h-24 text-center">
                                        No hay registros de asistencia para el período seleccionado.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
