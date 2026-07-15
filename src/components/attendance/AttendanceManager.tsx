
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Unit, StudentProfile, AttendanceRecord, AchievementIndicator, Program, Teacher } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
    getEnrolledStudentProfiles, 
    getAttendanceForUnit, 
    saveAttendance, 
    getAcademicPeriods, 
    getScheduledDaysForUnit, 
    getAchievementIndicators,
    getPrograms,
    getTeachers,
    getAssignments,
    saveAttendanceLimitWeek
} from '@/config/firebase';
import { Skeleton } from '../ui/skeleton';
import { produce } from 'immer';
import { AttendanceSheet } from './AttendanceSheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { BookCheck, Printer, Calculator, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { PrintLayout } from '../printing/PrintLayout';
import { AttendancePrintTable } from './AttendancePrintTable';
import '@/app/dashboard/gestion-academica/print-grades.css';

interface AttendanceManagerProps {
    unit: Unit;
    year?: string;
}

export function AttendanceManager({ unit, year }: AttendanceManagerProps) {
    const { instituteId, institute } = useAuth();
    const { toast } = useToast();
    
    const [students, setStudents] = useState<StudentProfile[]>([]);
    const [indicators, setIndicators] = useState<AchievementIndicator[]>([]);
    const [selectedIndicatorId, setSelectedIndicatorId] = useState<string>('');
    const [attendance, setAttendance] = useState<AttendanceRecord | null>(null);
    const [scheduledDays, setScheduledDays] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSavingLimit, setIsSavingLimit] = useState(false);
    const [periodStartDate, setPeriodStartDate] = useState<Date | undefined>(undefined);
    const [limitWeek, setLimitWeek] = useState<number>(unit.attendanceLimitWeek || unit.totalWeeks || 18);

    // Header data for printing
    const [program, setProgram] = useState<Program | null>(null);
    const [teacher, setTeacher] = useState<Teacher | null>(null);

    const fetchData = useCallback(async () => {
        if (!instituteId) return;
        setLoading(true);
        try {
            // Sincronización de Año: Priorizamos el año pasado por prop (ej. 2026)
            const currentYear = year || new Date().getFullYear().toString();
            
            const [
                enrolledStudents, 
                attendanceRecord, 
                academicPeriods, 
                scheduledDaysForUnit,
                unitIndicators,
                allPrograms,
                allTeachers
            ] = await Promise.all([
                getEnrolledStudentProfiles(instituteId, unit.id, currentYear, unit.period),
                getAttendanceForUnit(instituteId, unit.id, currentYear, unit.period),
                getAcademicPeriods(instituteId, currentYear),
                getScheduledDaysForUnit(instituteId, unit.id, currentYear, unit.semester),
                getAchievementIndicators(instituteId, unit.id),
                getPrograms(instituteId),
                getTeachers(instituteId)
            ]);

            const startDate = academicPeriods?.[unit.period]?.startDate?.toDate();
            setPeriodStartDate(startDate);

            // Fetch program and teacher for print headers
            const currentProgram = allPrograms.find(p => p.id === unit.programId) || null;
            setProgram(currentProgram);

            const assignments = await getAssignments(instituteId, currentYear, unit.programId);
            const teacherId = assignments[unit.period]?.[unit.id];
            if (teacherId) {
                const assignedTeacher = allTeachers.find(t => t.documentId === teacherId) || null;
                setTeacher(assignedTeacher);
            }

            // ORDENAR POR APELLIDOS Y FILTRAR DUPLICADOS
            const uniqueStudents = Array.from(new Map(enrolledStudents.map(s => [s.documentId, s])).values());
            setStudents(uniqueStudents.sort((a, b) => a.lastName.localeCompare(b.lastName, 'es')));
            
            // Lógica automática de columnas: Si no hay horario guardado pero HAY asistencia en la DB, inferimos columnas
            if (scheduledDaysForUnit.length === 0 && attendanceRecord && Object.keys(attendanceRecord.records).length > 0) {
                const firstStudentId = Object.keys(attendanceRecord.records)[0];
                const firstWeekData = attendanceRecord.records[firstStudentId]?.week_1 || attendanceRecord.records[firstStudentId]?.week_11;
                if (firstWeekData) {
                    const inferredDays = firstWeekData.map((_, i) => `Día ${i + 1}`);
                    setScheduledDays(inferredDays);
                }
            } else {
                setScheduledDays(scheduledDaysForUnit);
            }
            
            const sortedIndicators = unitIndicators.sort((a, b) => a.startWeek - b.startWeek);
            setIndicators(sortedIndicators);
            if (sortedIndicators.length > 0 && !selectedIndicatorId) {
                setSelectedIndicatorId(sortedIndicators[0].id);
            }

            if (attendanceRecord) {
                setAttendance(attendanceRecord);
            } else {
                setAttendance({
                    id: `${unit.id}_${currentYear}_${unit.period}`,
                    unitId: unit.id,
                    year: currentYear,
                    period: unit.period,
                    records: {}
                });
            }

        } catch (error) {
            console.error("Error fetching attendance data:", error);
            toast({
                title: "Error",
                description: "No se pudieron cargar los datos de asistencia.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [instituteId, unit.id, unit.period, unit.semester, unit.programId, year, toast, selectedIndicatorId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSaveLimitWeek = async (weekStr: string) => {
        if (!instituteId) return;
        const week = parseInt(weekStr);
        setIsSavingLimit(true);
        try {
            await saveAttendanceLimitWeek(instituteId, unit.id, week);
            setLimitWeek(week);
            toast({ 
                title: "Límite Guardado", 
                description: `Los estudiantes ahora verán su progreso calculado hasta la Semana ${week}.` 
            });
        } catch (error) {
            toast({ title: "Error", description: "No se pudo sincronizar el límite de semana.", variant: "destructive" });
        } finally {
            setIsSavingLimit(false);
        }
    };

    const handleAttendanceChange = async (studentId: string, weekNumber: number, dayIndex: number, status: string) => {
        if (!attendance || !instituteId) return;

        const weekKey = `week_${weekNumber}`;
        const updatedAttendance = produce(attendance, draft => {
            if (!draft.records[studentId]) draft.records[studentId] = {};
            if (!draft.records[studentId][weekKey]) {
                draft.records[studentId][weekKey] = Array(scheduledDays.length || 1).fill('U'); 
            }
            draft.records[studentId][weekKey][dayIndex] = status as any;
        });

        setAttendance(updatedAttendance);
        try {
             await saveAttendance(instituteId, updatedAttendance);
        } catch(e) {
             toast({ title: "Error", description: "No se pudo guardar.", variant: 'destructive'});
             fetchData();
        }
    };

    const handleBulkMarkDay = async (weekNumber: number, dayIndex: number, status: string) => {
        if (!attendance || !instituteId) return;

        const weekKey = `week_${weekNumber}`;
        const updatedAttendance = produce(attendance, draft => {
            students.forEach(student => {
                if (!draft.records[student.documentId]) draft.records[student.documentId] = {};
                if (!draft.records[student.documentId][weekKey]) {
                    draft.records[student.documentId][weekKey] = Array(scheduledDays.length || 1).fill('U');
                }
                draft.records[student.documentId][weekKey][dayIndex] = status as any;
            });
        });

        setAttendance(updatedAttendance);
        try {
            await saveAttendance(instituteId, updatedAttendance);
            toast({ title: "Actualización Masiva", description: `Se ha marcado a todos como ${status === 'P' ? 'Presente' : 'Falta'}.` });
        } catch(e) {
            toast({ title: "Error", variant: 'destructive'});
            fetchData();
        }
    };

    const selectedIndicator = useMemo(() => 
        indicators.find(i => i.id === selectedIndicatorId), 
    [indicators, selectedIndicatorId]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <div className="space-y-6"><Skeleton className="h-24 w-full" /><Skeleton className="h-64 w-full" /></div>;

    return (
        <div className="space-y-6">
            <div className="screen-only">
                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <CardTitle>Control de Asistencias por Indicador</CardTitle>
                                <CardDescription>Gestione la asistencia agrupada por los logros de aprendizaje de la unidad.</CardDescription>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                                <Button variant="outline" size="sm" onClick={handlePrint} disabled={!selectedIndicator} className="font-bold">
                                    <Printer className="mr-2 h-4 w-4" />
                                    Imprimir Reporte
                                </Button>
                                
                                <div className="flex items-center gap-2 bg-muted/50 p-1.5 rounded-lg border border-primary/10">
                                    <Label htmlFor="limit-week-select" className="text-[10px] font-black uppercase text-muted-foreground whitespace-nowrap pl-2">
                                        Calcular al:
                                    </Label>
                                    <div className="flex items-center gap-2">
                                        <Select 
                                            value={String(limitWeek)} 
                                            onValueChange={handleSaveLimitWeek}
                                            disabled={isSavingLimit}
                                        >
                                            <SelectTrigger id="limit-week-select" className="w-[100px] h-8 text-xs font-bold">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Array.from({ length: unit.totalWeeks || 18 }, (_, i) => i + 1).map(w => (
                                                    <SelectItem key={w} value={String(w)}>Semana {w}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {isSavingLimit && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Label htmlFor="indicator-select" className="whitespace-nowrap font-bold text-xs uppercase text-muted-foreground">Indicador:</Label>
                                    <Select value={selectedIndicatorId} onValueChange={setSelectedIndicatorId}>
                                        <SelectTrigger id="indicator-select" className="w-full md:w-[280px] h-8 text-xs font-medium">
                                            <SelectValue placeholder="Seleccione indicador..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {indicators.map(ind => (
                                                <SelectItem key={ind.id} value={ind.id} className="text-xs">
                                                    {ind.name} (Sem. {ind.startWeek}-{ind.endWeek})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {selectedIndicator ? (
                            <AttendanceSheet
                                students={students}
                                attendanceRecord={attendance}
                                selectedIndicator={selectedIndicator}
                                scheduledDays={scheduledDays}
                                onAttendanceChange={handleAttendanceChange}
                                onBulkMark={handleBulkMarkDay}
                                periodStartDate={periodStartDate}
                                totalWeeks={unit.totalWeeks}
                                limitWeek={limitWeek}
                            />
                        ) : (
                            <div className="py-20 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                                <BookCheck className="mx-auto h-12 w-12 opacity-20 mb-4" />
                                <p>Debe definir Indicadores de Logro para habilitar el registro de asistencia.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Printable version */}
            <div className="print-only">
                {selectedIndicator && (
                    <PrintLayout 
                        institute={institute} 
                        program={program} 
                        unit={unit} 
                        teacher={teacher} 
                        title={`REGISTRO DE ASISTENCIA - INDICADOR: ${selectedIndicator.name}`}
                    >
                        <AttendancePrintTable 
                            students={students}
                            attendanceRecord={attendance}
                            selectedIndicator={selectedIndicator}
                            scheduledDays={scheduledDays}
                            periodStartDate={periodStartDate}
                            totalWeeks={unit.totalWeeks}
                            limitWeek={limitWeek}
                        />
                    </PrintLayout>
                )}
            </div>
        </div>
    );
}
