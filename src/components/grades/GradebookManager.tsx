

"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Unit, StudentProfile, AchievementIndicator, AcademicRecord, Task, GradeEntry } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getEnrolledStudentProfiles, getAchievementIndicators, getAcademicRecordsForUnit, getAllTasksForUnit, batchUpdateAcademicRecords } from '@/config/firebase';
import { Skeleton } from '../ui/skeleton';
import { GradebookTable } from './GradebookTable';
import { Button } from '../ui/button';
import { Save, Loader2 } from 'lucide-react';
import { produce } from 'immer';

interface GradebookManagerProps {
    unit: Unit;
}

export function GradebookManager({ unit }: GradebookManagerProps) {
    const { instituteId } = useAuth();
    const { toast } = useToast();
    
    const [students, setStudents] = useState<StudentProfile[]>([]);
    const [indicators, setIndicators] = useState<AchievementIndicator[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [records, setRecords] = useState<Record<string, AcademicRecord>>({});
    const [initialRecords, setInitialRecords] = useState<Record<string, AcademicRecord>>({});
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const fetchData = useCallback(async () => {
        if (!instituteId) return;
        setLoading(true);
        try {
            const currentYear = new Date().getFullYear().toString();
            const [enrolledStudents, achievementIndicators, fetchedRecords, allTasks] = await Promise.all([
                getEnrolledStudentProfiles(instituteId, unit.id, currentYear, unit.period),
                getAchievementIndicators(instituteId, unit.id),
                getAcademicRecordsForUnit(instituteId, unit.id, currentYear, unit.period),
                getAllTasksForUnit(instituteId, unit.id, unit.totalWeeks)
            ]);
            
            setStudents(enrolledStudents);
            setIndicators(achievementIndicators);
            setTasks(allTasks);

            const recordsMap: Record<string, AcademicRecord> = {};
            // Initialize records for all enrolled students
            enrolledStudents.forEach(student => {
                const existingRecord = fetchedRecords.find(r => r.studentId === student.documentId);
                if (existingRecord) {
                    recordsMap[student.documentId] = existingRecord;
                } else {
                    // Create a new blank record if none exists
                    recordsMap[student.documentId] = {
                        id: `${unit.id}_${student.documentId}_${currentYear}_${unit.period}`,
                        studentId: student.documentId,
                        unitId: unit.id,
                        programId: unit.programId,
                        year: currentYear,
                        period: unit.period,
                        grades: {},
                        evaluations: {},
                        finalGrade: null,
                        attendancePercentage: 100,
                        status: 'cursando',
                    };
                }
            });
            
            setRecords(recordsMap);
            setInitialRecords(JSON.parse(JSON.stringify(recordsMap))); // Deep copy for initial state

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
    
    const handleGradeChange = (studentId: string, indicatorId: string, taskId: string, grade: number | null) => {
        setRecords(
            produce(draft => {
                const studentRecord = draft[studentId];
                if (!studentRecord) return;

                // Ensure the grades object for the indicator exists
                if (!studentRecord.grades[indicatorId]) {
                    studentRecord.grades[indicatorId] = [];
                }

                const gradeEntryIndex = studentRecord.grades[indicatorId].findIndex(g => g.refId === taskId);
                const task = tasks.find(t => t.id === taskId);
                
                if (gradeEntryIndex !== -1) {
                    // Update existing grade entry
                    if (grade === null) {
                         // Remove the entry if grade is cleared
                        studentRecord.grades[indicatorId].splice(gradeEntryIndex, 1);
                    } else {
                        studentRecord.grades[indicatorId][gradeEntryIndex].grade = grade;
                    }
                } else if (grade !== null && task) {
                    // Add new grade entry if it doesn't exist and grade is not null
                    const newGradeEntry: GradeEntry = {
                        type: 'task',
                        refId: taskId,
                        label: task.title,
                        grade: grade,
                        weekNumber: task.weekNumber,
                    };
                    studentRecord.grades[indicatorId].push(newGradeEntry);
                }
            })
        );
    };
    
    const handleSaveChanges = async () => {
        if (!instituteId) return;
        setIsSaving(true);
        try {
            const updatedRecords: AcademicRecord[] = [];
            for (const studentId in records) {
                // Only update if the record has changed from its initial state
                if (JSON.stringify(records[studentId]) !== JSON.stringify(initialRecords[studentId])) {
                    updatedRecords.push(records[studentId]);
                }
            }

            if (updatedRecords.length === 0) {
                toast({
                    title: "Sin Cambios",
                    description: "No se han realizado cambios para guardar.",
                });
                return;
            }

            await batchUpdateAcademicRecords(instituteId, updatedRecords);
            
            toast({
                title: "¡Éxito!",
                description: `Se han guardado las calificaciones para ${updatedRecords.length} estudiante(s).`,
            });
            
            // Update the initial state to match the newly saved state
            setInitialRecords(JSON.parse(JSON.stringify(records)));

        } catch(error) {
            console.error("Error saving grades:", error);
            toast({ title: "Error", description: "No se pudieron guardar las calificaciones.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
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
                    <Button onClick={handleSaveChanges} disabled={isSaving || loading}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Guardar Cambios
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
               <GradebookTable 
                    students={students}
                    indicators={indicators}
                    tasks={tasks}
                    records={records}
                    onGradeChange={handleGradeChange}
               />
            </CardContent>
        </Card>
    );
}
