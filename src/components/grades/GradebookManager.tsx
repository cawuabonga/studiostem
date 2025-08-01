

"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { Unit, StudentProfile, AchievementIndicator, AcademicRecord, Task, ManualEvaluation, GradeEntry, UnitPeriod } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getEnrolledStudentProfiles, getAchievementIndicators, getAcademicRecordsForUnit, getAllTasksForUnit, batchUpdateAcademicRecords, addManualEvaluationToRecord, deleteManualEvaluationFromRecord } from '@/config/firebase';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import { Save, Loader2, ArrowLeft } from 'lucide-react';
import { produce } from 'immer';
import { IndicatorGradebook } from './IndicatorGradebook';
import { Badge } from '../ui/badge';
import { Timestamp } from 'firebase/firestore';

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
    const [selectedIndicator, setSelectedIndicator] = useState<AchievementIndicator | null>(null);

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
            const sortedIndicators = achievementIndicators.sort((a,b) => a.name.localeCompare(b.name));
            setIndicators(sortedIndicators);
            setTasks(allTasks);

            const recordsMap: Record<string, AcademicRecord> = {};
            
            enrolledStudents.forEach(student => {
                let existingRecord = fetchedRecords.find(r => r.studentId === student.documentId);
                
                if (existingRecord) {
                    // Ensure nested Timestamps are converted to something serializable
                    for (const indId in existingRecord.evaluations) {
                        if (existingRecord.evaluations[indId]) {
                            existingRecord.evaluations[indId] = existingRecord.evaluations[indId].map(ev => ({
                                ...ev,
                                // Convert Timestamp to ISO string immediately upon fetching
                                createdAt: (ev.createdAt as unknown as Timestamp).toDate().toISOString()
                            }));
                        }
                    }
                } else {
                     existingRecord = {
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
                 recordsMap[student.documentId] = existingRecord;
            });
            
            setRecords(recordsMap);
            setInitialRecords(JSON.parse(JSON.stringify(recordsMap))); 

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
    
    const handleGradeChange = (studentId: string, indicatorId: string, refId: string, grade: number | null, type: 'task' | 'manual', label: string, weekNumber: number) => {
        setRecords(
            produce(draft => {
                const studentRecord = draft[studentId];
                if (!studentRecord) return;

                if (!studentRecord.grades[indicatorId]) {
                    studentRecord.grades[indicatorId] = [];
                }

                const gradeEntryIndex = studentRecord.grades[indicatorId].findIndex(g => g.refId === refId);
                
                if (gradeEntryIndex !== -1) {
                    if (grade === null) {
                        studentRecord.grades[indicatorId].splice(gradeEntryIndex, 1);
                    } else {
                        studentRecord.grades[indicatorId][gradeEntryIndex].grade = grade;
                    }
                } else if (grade !== null) {
                    const newGradeEntry: GradeEntry = {
                        type,
                        refId,
                        label,
                        grade,
                        weekNumber,
                    };
                    studentRecord.grades[indicatorId].push(newGradeEntry);
                }
            })
        );
    };

     const handleManualEvaluationAdded = async (indicatorId: string, label: string, weekNumber: number) => {
        if (!instituteId) return;

        const newEvaluation: Omit<ManualEvaluation, 'id' | 'createdAt'> = {
            indicatorId,
            label,
            weekNumber,
        };
        
        try {
            await addManualEvaluationToRecord(instituteId, unit.id, new Date().getFullYear().toString(), unit.period, newEvaluation);
            
            toast({
                title: "Columna Creada",
                description: `Se añadió la evaluación "${label}" para todos los estudiantes.`,
            });
            
            fetchData();

        } catch (error) {
            console.error("Error adding manual evaluation:", error);
            toast({ title: "Error", description: "No se pudo crear la columna de evaluación.", variant: "destructive" });
        }
    };
    
    const handleManualEvaluationDeleted = async (indicatorId: string, evaluationId: string) => {
        if (!instituteId) return;

        try {
            await deleteManualEvaluationFromRecord(instituteId, unit.id, new Date().getFullYear().toString(), unit.period, indicatorId, evaluationId);
            toast({
                title: "Columna Eliminada",
                description: `La columna de evaluación ha sido eliminada para todos los estudiantes.`,
            });
            fetchData();
        } catch (error) {
             console.error("Error deleting manual evaluation:", error);
            toast({ title: "Error", description: "No se pudo eliminar la columna de evaluación.", variant: "destructive" });
        }

    }
    
    const handleSaveChanges = async () => {
        if (!instituteId) return;
        setIsSaving(true);
        try {
            const updatedRecords: AcademicRecord[] = [];
            for (const studentId in records) {
                if (JSON.stringify(records[studentId]) !== JSON.stringify(initialRecords[studentId])) {
                     // Deep copy before modifying to avoid issues with Immer proxies
                    const cleanRecord = JSON.parse(JSON.stringify(records[studentId]));
                    updatedRecords.push(cleanRecord);
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

    const MainView = () => (
         <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Registro de Calificaciones</CardTitle>
                        <CardDescription>
                            Seleccione un indicador de logro para comenzar a calificar.
                        </CardDescription>
                    </div>
                    <Button onClick={handleSaveChanges} disabled={isSaving || loading}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Guardar Cambios
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {indicators.length > 0 ? indicators.map(indicator => (
                   <Card 
                        key={indicator.id} 
                        className="hover:shadow-md hover:border-primary cursor-pointer transition-all flex flex-col"
                        onClick={() => setSelectedIndicator(indicator)}
                    >
                       <CardHeader className="flex-grow">
                           <CardTitle className="text-lg">{indicator.name}</CardTitle>
                           <CardDescription>{indicator.description}</CardDescription>
                       </CardHeader>
                       <CardFooter>
                           <Badge variant="secondary">Semanas: {indicator.startWeek} - {indicator.endWeek}</Badge>
                       </CardFooter>
                   </Card>
               )) : (
                   <p className="col-span-full text-center text-muted-foreground py-8">
                       No se han definido indicadores de logro para esta unidad. Por favor, añádalos en la pestaña 'Indicadores de Logro'.
                   </p>
               )}
            </CardContent>
        </Card>
    );

    const DetailView = () => (
        selectedIndicator && (
             <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                             <Button variant="ghost" size="sm" className="mb-2 -ml-4" onClick={() => setSelectedIndicator(null)}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Volver a Indicadores
                            </Button>
                            <CardTitle>Calificaciones para: {selectedIndicator.name}</CardTitle>
                            <CardDescription>
                                Gestiona las calificaciones de los estudiantes para este indicador. Semanas {selectedIndicator.startWeek} a la {selectedIndicator.endWeek}.
                            </CardDescription>
                        </div>
                        <Button onClick={handleSaveChanges} disabled={isSaving || loading}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Guardar Cambios
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <IndicatorGradebook 
                        students={students}
                        indicator={selectedIndicator}
                        tasks={tasks}
                        records={records}
                        unit={unit}
                        onGradeChange={handleGradeChange}
                        onManualEvaluationAdded={handleManualEvaluationAdded}
                        onManualEvaluationDeleted={handleManualEvaluationDeleted}
                    />
                </CardContent>
            </Card>
        )
    );

    return selectedIndicator ? <DetailView /> : <MainView />;
}

    
