

"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { Unit, StudentProfile, AchievementIndicator, AcademicRecord, Task } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getEnrolledStudentProfiles, getAchievementIndicators, getAcademicRecordsForUnit, getAllTasksForUnit } from '@/config/firebase';
import { Skeleton } from '../ui/skeleton';
import { GradebookTable } from './GradebookTable';
import { Button } from '../ui/button';
import { Save } from 'lucide-react';


interface GradebookManagerProps {
    unit: Unit;
}

export function GradebookManager({ unit }: GradebookManagerProps) {
    const { instituteId } = useAuth();
    const { toast } = useToast();
    
    const [students, setStudents] = useState<StudentProfile[]>([]);
    const [indicators, setIndicators] = useState<AchievementIndicator[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [academicRecords, setAcademicRecords] = useState<Record<string, AcademicRecord>>({});
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!instituteId) return;
        setLoading(true);
        try {
            const currentYear = new Date().getFullYear().toString();
            const [
                enrolledStudents, 
                achievementIndicators, 
                fetchedRecords,
                allTasks
            ] = await Promise.all([
                getEnrolledStudentProfiles(instituteId, unit.id, currentYear, unit.period),
                getAchievementIndicators(instituteId, unit.id),
                getAcademicRecordsForUnit(instituteId, unit.id, currentYear, unit.period),
                getAllTasksForUnit(instituteId, unit.id, unit.totalWeeks)
            ]);

            const recordsMap: Record<string, AcademicRecord> = {};
            fetchedRecords.forEach(record => {
                recordsMap[record.studentId] = record;
            });

            setStudents(enrolledStudents);
            setIndicators(achievementIndicators);
            setTasks(allTasks);
            setAcademicRecords(recordsMap);

        } catch (error) {
            console.error("Error fetching gradebook data:", error);
            toast({
                title: "Error",
                description: "No se pudieron cargar los datos para el registro de notas.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [instituteId, unit, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const handleGradeChange = (studentId: string, indicatorId: string, grade: number | null) => {
        // TODO: Implement logic to update state
    };
    
    const handleSaveChanges = () => {
         toast({
            title: "Función no implementada",
            description: "La función para guardar las calificaciones estará disponible pronto.",
        });
        // TODO: Implement batch update to Firebase
    }

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-4 w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-64 w-full" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Registro de Calificaciones</CardTitle>
                        <CardDescription>
                            Gestiona las calificaciones de los estudiantes en la unidad: {unit.name}.
                        </CardDescription>
                    </div>
                    <Button onClick={handleSaveChanges}>
                        <Save className="mr-2 h-4 w-4" />
                        Guardar Cambios
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
               <GradebookTable 
                    students={students}
                    indicators={indicators}
                    tasks={tasks}
                    records={academicRecords}
                    onGradeChange={handleGradeChange}
               />
            </CardContent>
        </Card>
    );
}
