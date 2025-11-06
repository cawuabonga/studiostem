
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { Unit, StudentProfile, AttendanceRecord } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getEnrolledStudentProfiles, getAttendanceForUnit, saveAttendance, getAcademicPeriods } from '@/config/firebase';
import { Skeleton } from '../ui/skeleton';
import { produce } from 'immer';
import { AttendanceSheet } from './AttendanceSheet';
import { differenceInWeeks } from 'date-fns';

interface AttendanceManagerProps {
    unit: Unit;
}

const calculateCurrentWeek = (startDate: Date | undefined): number => {
    if (!startDate) return 1;
    const now = new Date();
    // differenceInWeeks starts counting from 0, so we add 1.
    const week = differenceInWeeks(now, startDate, { weekStartsOn: 1 }) + 1; // Assuming week starts on Monday
    return Math.max(1, week); // Ensure it's at least week 1
};


export function AttendanceManager({ unit }: AttendanceManagerProps) {
    const { instituteId } = useAuth();
    const { toast } = useToast();
    
    const [students, setStudents] = useState<StudentProfile[]>([]);
    const [attendance, setAttendance] = useState<AttendanceRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentWeek, setCurrentWeek] = useState(1);

    const fetchData = useCallback(async () => {
        if (!instituteId) return;
        setLoading(true);
        try {
            const currentYear = new Date().getFullYear().toString();
            const [enrolledStudents, attendanceRecord, academicPeriods] = await Promise.all([
                getEnrolledStudentProfiles(instituteId, unit.id, currentYear, unit.period),
                getAttendanceForUnit(instituteId, unit.id, currentYear, unit.period),
                getAcademicPeriods(instituteId, currentYear),
            ]);

            const periodStartDate = academicPeriods?.[unit.period]?.startDate?.toDate();
            setCurrentWeek(calculateCurrentWeek(periodStartDate));

            setStudents(enrolledStudents.sort((a,b) => a.fullName.localeCompare(b.fullName)));

            if (attendanceRecord) {
                setAttendance(attendanceRecord);
            } else {
                // Initialize a new record if one doesn't exist
                const initialData: { [studentId: string]: { [week: string]: string[] } } = {};
                enrolledStudents.forEach(student => {
                    initialData[student.documentId] = {};
                });
                setAttendance({
                    id: `${unit.id}_${currentYear}_${unit.period}`,
                    unitId: unit.id,
                    year: currentYear,
                    period: unit.period,
                    records: initialData
                });
            }

        } catch (error) {
            console.error("Error fetching attendance data:", error);
            toast({
                title: "Error",
                description: "No se pudieron cargar los datos de asistencia. Asegúrese de que el período académico esté configurado.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [instituteId, unit, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAttendanceChange = async (studentId: string, weekNumber: number, dayIndex: number, status: string) => {
        if (!attendance || !instituteId) return;

        const weekKey = `week_${weekNumber}`;
        const dayKey = `day_${dayIndex}`; // Not used directly in array

        const updatedAttendance = produce(attendance, draft => {
            if (!draft.records[studentId]) {
                draft.records[studentId] = {};
            }
            if (!draft.records[studentId][weekKey]) {
                // Initialize with 'U' for 'Unmarked' for all days
                draft.records[studentId][weekKey] = Array(5).fill('U'); 
            }
            draft.records[studentId][weekKey][dayIndex] = status;
        });

        setAttendance(updatedAttendance);

        try {
             await saveAttendance(instituteId, updatedAttendance);
             toast({
                 title: "Asistencia Guardada",
                 description: "El cambio se ha guardado correctamente.",
                 duration: 2000,
             });
        } catch(e) {
             console.error("Error saving attendance:", e);
             toast({ title: "Error", description: "No se pudo guardar la asistencia.", variant: 'destructive'});
             // Optionally revert state on error
             fetchData();
        }
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-4 w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-96 w-full" />
                </CardContent>
            </Card>
        );
    }

    if (students.length === 0) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Registro de Asistencias</CardTitle>
                    <CardDescription>Marque la asistencia de los estudiantes para cada día de la semana.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-center py-10 text-muted-foreground">No hay estudiantes matriculados en esta unidad.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Registro de Asistencias</CardTitle>
                <CardDescription>Marque la asistencia de los estudiantes para cada día de la semana. Los cambios se guardan automáticamente.</CardDescription>
            </CardHeader>
            <CardContent>
                <AttendanceSheet
                    students={students}
                    attendanceRecord={attendance}
                    totalWeeks={unit.totalWeeks}
                    onAttendanceChange={handleAttendanceChange}
                    defaultWeek={currentWeek}
                />
            </CardContent>
        </Card>
    );
}
