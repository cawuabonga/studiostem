
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Unit, StudentProfile, AttendanceRecord, AchievementIndicator } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getEnrolledStudentProfiles, getAttendanceForUnit, saveAttendance, getAcademicPeriods, getScheduledDaysForUnit, getAchievementIndicators } from '@/config/firebase';
import { Skeleton } from '../ui/skeleton';
import { produce } from 'immer';
import { AttendanceSheet } from './AttendanceSheet';
import { differenceInWeeks } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { BookCheck } from 'lucide-react';

interface AttendanceManagerProps {
    unit: Unit;
}

export function AttendanceManager({ unit }: AttendanceManagerProps) {
    const { instituteId } = useAuth();
    const { toast } = useToast();
    
    const [students, setStudents] = useState<StudentProfile[]>([]);
    const [indicators, setIndicators] = useState<AchievementIndicator[]>([]);
    const [selectedIndicatorId, setSelectedIndicatorId] = useState<string>('');
    const [attendance, setAttendance] = useState<AttendanceRecord | null>(null);
    const [scheduledDays, setScheduledDays] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [periodStartDate, setPeriodStartDate] = useState<Date | undefined>(undefined);

    const fetchData = useCallback(async () => {
        if (!instituteId) return;
        setLoading(true);
        try {
            const currentYear = new Date().getFullYear().toString();
            const [
                enrolledStudents, 
                attendanceRecord, 
                academicPeriods, 
                scheduledDaysForUnit,
                unitIndicators
            ] = await Promise.all([
                getEnrolledStudentProfiles(instituteId, unit.id, currentYear, unit.period),
                getAttendanceForUnit(instituteId, unit.id, currentYear, unit.period),
                getAcademicPeriods(instituteId, currentYear),
                getScheduledDaysForUnit(instituteId, unit.id, currentYear, unit.semester),
                getAchievementIndicators(instituteId, unit.id)
            ]);

            const startDate = academicPeriods?.[unit.period]?.startDate?.toDate();
            setPeriodStartDate(startDate);

            // 1. ORDENAR POR APELLIDOS
            setStudents(enrolledStudents.sort((a, b) => a.lastName.localeCompare(b.lastName)));
            setScheduledDays(scheduledDaysForUnit);
            
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
    }, [instituteId, unit, toast, selectedIndicatorId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAttendanceChange = async (studentId: string, weekNumber: number, dayIndex: number, status: string) => {
        if (!attendance || !instituteId) return;

        const weekKey = `week_${weekNumber}`;
        const updatedAttendance = produce(attendance, draft => {
            if (!draft.records[studentId]) draft.records[studentId] = {};
            if (!draft.records[studentId][weekKey]) {
                draft.records[studentId][weekKey] = Array(scheduledDays.length).fill('U'); 
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
                    draft.records[student.documentId][weekKey] = Array(scheduledDays.length).fill('U');
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

    if (loading) return <div className="space-y-6"><Skeleton className="h-24 w-full" /><Skeleton className="h-64 w-full" /></div>;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <CardTitle>Control de Asistencias por Indicador</CardTitle>
                            <CardDescription>Gestione la asistencia agrupada por los logros de aprendizaje de la unidad.</CardDescription>
                        </div>
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <Label htmlFor="indicator-select" className="whitespace-nowrap font-bold">Ver Indicador:</Label>
                            <Select value={selectedIndicatorId} onValueChange={setSelectedIndicatorId}>
                                <SelectTrigger id="indicator-select" className="w-full md:w-[300px]">
                                    <SelectValue placeholder="Seleccione indicador..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {indicators.map(ind => (
                                        <SelectItem key={ind.id} value={ind.id}>
                                            {ind.name} (Sem. {ind.startWeek}-{ind.endWeek})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
    );
}
