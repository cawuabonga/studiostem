
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getStaffProfiles, getAccessPoints, getMonthlyAccessLogs, getPrograms } from '@/config/firebase';
import type { StaffProfile, AccessPoint, AccessLog, Program } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { format, getDaysInMonth, isWeekend } from 'date-fns';
import { es } from 'date-fns/locale';
import { Loader2, Search, Filter, Printer } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

interface StaffMonthlyAttendanceTableProps {
    instituteId: string;
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());
const months = [
    { value: '0', label: 'Enero' }, { value: '1', label: 'Febrero' }, { value: '2', label: 'Marzo' },
    { value: '3', label: 'Abril' }, { value: '4', label: 'Mayo' }, { value: '5', label: 'Junio' },
    { value: '6', label: 'Julio' }, { value: '7', label: 'Agosto' }, { value: '8', label: 'Septiembre' },
    { value: '9', label: 'Octubre' }, { value: '10', label: 'Noviembre' }, { value: '11', label: 'Diciembre' }
];

export function StaffMonthlyAttendanceTable({ instituteId }: StaffMonthlyAttendanceTableProps) {
    const { toast } = useToast();
    const [staff, setStaff] = useState<StaffProfile[]>([]);
    const [accessPoints, setAccessPoints] = useState<AccessPoint[]>([]);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [logs, setLogs] = useState<AccessLog[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [selectedYear, setSelectedYear] = useState(currentYear.toString());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString());
    const [selectedPointId, setSelectedPointId] = useState('all');
    const [programFilter, setProgramFilter] = useState('all');

    const fetchData = useCallback(async () => {
        if (!instituteId) return;
        setLoading(true);
        try {
            const [fetchedStaff, fetchedPoints, fetchedPrograms, fetchedLogs] = await Promise.all([
                getStaffProfiles(instituteId),
                getAccessPoints(instituteId),
                getPrograms(instituteId),
                getMonthlyAccessLogs(instituteId, parseInt(selectedYear), parseInt(selectedMonth), selectedPointId)
            ]);
            setStaff(fetchedStaff);
            setAccessPoints(fetchedPoints);
            setPrograms(fetchedPrograms);
            setLogs(fetchedLogs);
        } catch (error) {
            console.error("Error fetching monthly attendance:", error);
            toast({ title: "Error", description: "No se pudieron cargar los datos de asistencia mensual.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [instituteId, selectedYear, selectedMonth, selectedPointId, toast]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const daysCount = getDaysInMonth(new Date(parseInt(selectedYear), parseInt(selectedMonth)));
    const daysArray = Array.from({ length: daysCount }, (_, i) => i + 1);

    const attendanceMatrix = useMemo(() => {
        const matrix: Record<string, Record<number, { entry: string, exit: string }>> = {};
        
        logs.forEach(log => {
            const userId = log.userDocumentId;
            if (!userId) return;
            
            const date = log.timestamp.toDate();
            const day = date.getDate();
            const time = format(date, 'HH:mm');

            if (!matrix[userId]) matrix[userId] = {};
            if (!matrix[userId][day]) matrix[userId][day] = { entry: time, exit: time };

            // For entry, we keep the earliest time. For exit, the latest.
            if (time < matrix[userId][day].entry) matrix[userId][day].entry = time;
            if (time > matrix[userId][day].exit) matrix[userId][day].exit = time;
        });

        return matrix;
    }, [logs]);

    const filteredStaff = useMemo(() => {
        return staff.filter(s => programFilter === 'all' || s.programId === programFilter);
    }, [staff, programFilter]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-6">
            <Card className="no-print border-primary/10 shadow-md">
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-primary">
                            <Filter className="h-5 w-5" />
                            <CardTitle className="text-lg">Filtros del Reporte Mensual</CardTitle>
                        </div>
                        <Button onClick={handlePrint} variant="outline" size="sm">
                            <Printer className="mr-2 h-4 w-4" />
                            Imprimir Reporte
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Año</Label>
                            <Select value={selectedYear} onValueChange={setSelectedYear}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Mes</Label>
                            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Punto de Acceso</Label>
                            <Select value={selectedPointId} onValueChange={setSelectedPointId}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los puntos</SelectItem>
                                    {accessPoints.map(p => <SelectItem key={p.id} value={p.accessPointId}>{p.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Programa de Estudios</Label>
                            <Select value={programFilter} onValueChange={setProgramFilter}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todo el personal</SelectItem>
                                    {programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-xl overflow-hidden border-none">
                <CardHeader className="bg-primary text-primary-foreground py-4">
                    <CardTitle className="text-xl flex items-center gap-2 uppercase tracking-tighter">
                        Matriz de Asistencia: {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="relative overflow-x-auto overflow-y-auto max-h-[70vh]">
                        <Table className="border-separate border-spacing-0 table-auto w-full">
                            <TableHeader className="sticky top-0 z-50">
                                <TableRow className="bg-slate-100">
                                    <TableHead className="sticky left-0 bg-slate-100 z-50 w-[200px] border-r border-b font-black text-[10px] uppercase text-center py-4">
                                        Personal
                                    </TableHead>
                                    {daysArray.map(day => {
                                        const date = new Date(parseInt(selectedYear), parseInt(selectedMonth), day);
                                        const weekend = isWeekend(date);
                                        return (
                                            <TableHead key={day} className={cn(
                                                "text-center min-w-[70px] border-r border-b font-black text-[10px] py-1",
                                                weekend ? "bg-red-50 text-red-700" : "bg-slate-50 text-slate-700"
                                            )}>
                                                <div className="flex flex-col leading-tight">
                                                    <span>{format(date, 'EEE', { locale: es }).toUpperCase()}</span>
                                                    <span className="text-lg">{day.toString().padStart(2, '0')}</span>
                                                </div>
                                            </TableHead>
                                        );
                                    })}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={daysCount + 1} className="h-60 text-center py-20"><Loader2 className="animate-spin h-10 w-10 mx-auto text-primary opacity-20" /></TableCell></TableRow>
                                ) : filteredStaff.length > 0 ? (
                                    filteredStaff.map((p) => (
                                        <TableRow key={p.documentId} className="h-14 hover:bg-slate-50 transition-colors">
                                            <TableCell className="sticky left-0 bg-white z-20 border-r border-b p-2 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                                                <div className="flex flex-col leading-none">
                                                    <span className="text-[11px] font-bold uppercase truncate max-w-[180px]">{p.displayName}</span>
                                                    <span className="text-[9px] font-mono text-muted-foreground mt-0.5">{p.documentId}</span>
                                                </div>
                                            </TableCell>
                                            {daysArray.map(day => {
                                                const date = new Date(parseInt(selectedYear), parseInt(selectedMonth), day);
                                                const weekend = isWeekend(date);
                                                const dayAttendance = attendanceMatrix[p.documentId]?.[day];

                                                return (
                                                    <TableCell key={day} className={cn(
                                                        "text-center p-1 border-r border-b text-[10px] font-mono",
                                                        weekend && "bg-red-50/30"
                                                    )}>
                                                        {dayAttendance ? (
                                                            <div className="flex flex-col items-center leading-tight">
                                                                <span className="font-black text-green-700">{dayAttendance.entry}</span>
                                                                <span className="text-[8px] text-muted-foreground my-0.5">---</span>
                                                                <span className="font-black text-blue-700">{dayAttendance.exit}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-200">-</span>
                                                        )}
                                                    </TableCell>
                                                );
                                            })}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow><TableCell colSpan={daysCount + 1} className="h-40 text-center text-muted-foreground italic">No se encontró personal bajo los criterios de búsqueda.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
            
            <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-bold uppercase px-2 bg-slate-50 p-3 rounded-lg border border-dashed no-print">
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-red-100 rounded-sm"></div> Fines de Semana</span>
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-green-100 rounded-sm"></div> Entrada</span>
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-100 rounded-sm"></div> Salida</span>
                <div className="ml-auto italic">El reporte muestra la primera entrada y la última salida capturada por el punto de acceso seleccionado.</div>
            </div>
        </div>
    );
}
