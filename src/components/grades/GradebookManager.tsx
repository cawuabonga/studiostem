
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Unit, StudentProfile, AchievementIndicator, AcademicRecord, Task, ManualEvaluation, UnitPeriod, Program, Teacher, GradeEntry } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
    getEnrolledStudentProfiles, 
    getAchievementIndicators, 
    getAcademicRecordsForUnit, 
    batchUpdateAcademicRecords, 
    addManualEvaluationToRecord, 
    deleteManualEvaluationFromRecord, 
    getPrograms, 
    getTeachers, 
    getAssignments, 
    closeUnitGrades,
    getWeeksData
} from '@/config/firebase';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import { Save, Loader2, ArrowLeft, Printer, Lock, CheckCircle2 } from 'lucide-react';
import { produce } from 'immer';
import { IndicatorGradebook } from './IndicatorGradebook';
import { Badge } from '../ui/badge';
import { GradebookSummaryTable } from './GradebookSummaryTable';
import '@/app/dashboard/gestion-academica/print-grades.css';
import { PrintLayout } from '../printing/PrintLayout';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


interface GradebookManagerProps {
    unit: Unit;
}

const calculateAverage = (grades: (number | null)[]): number | null => {
    const validGrades = grades.filter(g => typeof g === 'number' && !isNaN(g)) as number[];
    if (validGrades.length === 0) return null;
    const sum = validGrades.reduce((acc, grade) => acc + grade, 0);
    return Math.round(sum / validGrades.length);
};

export function GradebookManager({ unit }: GradebookManagerProps) {
    const { instituteId, institute } = useAuth();
    const { toast } = useToast();
    
    const [students, setStudents] = useState<StudentProfile[]>([]);
    const [indicators, setIndicators] = useState<AchievementIndicator[]>([]);
    const [records, setRecords] = useState<Record<string, AcademicRecord>>({});
    const [initialRecords, setInitialRecords] = useState<Record<string, AcademicRecord>>({});
    const [program, setProgram] = useState<Program | null>(null);
    const [teacher, setTeacher] = useState<Teacher | null>(null);
    const [unitTasks, setUnitTasks] = useState<(Task & { weekNumber: number })[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [selectedIndicator, setSelectedIndicator] = useState<AchievementIndicator | null>(null);
    
    const fetchData = useCallback(async () => {
        if (!instituteId) return;
        setLoading(true);
        try {
            const currentYear = new Date().getFullYear().toString();
            
            // Fetch tasks from weeks data
            const allWeeksData = await getWeeksData(instituteId, unit.id);
            const allTasks = allWeeksData.flatMap(w => (w.tasks || []).map(t => ({ ...t, weekNumber: w.weekNumber })));
            setUnitTasks(allTasks);

            const [
                enrolledStudents, 
                achievementIndicators, 
                fetchedRecords, 
                allPrograms,
                allTeachers,
            ] = await Promise.all([
                getEnrolledStudentProfiles(instituteId, unit.id, currentYear, unit.period),
                getAchievementIndicators(instituteId, unit.id),
                getAcademicRecordsForUnit(instituteId, unit.id, currentYear, unit.period),
                getPrograms(instituteId),
                getTeachers(instituteId),
            ]);

            const currentProgram = allPrograms.find(p => p.id === unit.programId) || null;
            setProgram(currentProgram);

            const assignments = await getAssignments(instituteId, currentYear, unit.programId);
            const teacherId = assignments[unit.period]?.[unit.id];
            if (teacherId) {
                const assignedTeacher = allTeachers.find(t => t.documentId === teacherId) || null;
                setTeacher(assignedTeacher);
            }
            
            setStudents(enrolledStudents);
            const sortedIndicators = achievementIndicators.sort((a,b) => a.name.localeCompare(b.name));
            setIndicators(sortedIndicators);

            const recordsMap: Record<string, AcademicRecord> = {};
            enrolledStudents.forEach(student => {
                let existingRecord = fetchedRecords.find(r => r.studentId === student.documentId);
                if (!existingRecord) {
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
            setInitialRecords(recordsMap);
        } catch (error) {
            console.error("Error fetching gradebook data:", error);
            toast({ title: "Error", description: "No se pudieron cargar los datos.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [instituteId, unit, toast]);

    useEffect(() => { fetchData(); }, [fetchData]);
    
    const handleGradeChange = (studentId: string, indicatorId: string, refId: string, grade: number | null, type: 'task' | 'manual', label: string, weekNumber: number) => {
        setRecords(produce(draft => {
            const studentRecord = draft[studentId];
            if (!studentRecord) return;
            if (!studentRecord.grades[indicatorId]) {
                studentRecord.grades[indicatorId] = [];
            }
            const gradeEntryIndex = studentRecord.grades[indicatorId].findIndex(g => g.refId === refId);
            if (gradeEntryIndex !== -1) {
                if (grade === null) studentRecord.grades[indicatorId].splice(gradeEntryIndex, 1);
                else studentRecord.grades[indicatorId][gradeEntryIndex].grade = grade;
            } else if (grade !== null) {
                studentRecord.grades[indicatorId].push({ type, refId, label, grade, weekNumber });
            }
        }));
    };

    const handleManualEvaluationAdded = async (indicatorId: string, label: string, weekNumber: number) => {
        if (!instituteId) return;
        try {
            const currentYear = new Date().getFullYear().toString();
            await addManualEvaluationToRecord(instituteId, unit.id, currentYear, unit.period, {
                indicatorId,
                label,
                weekNumber
            });
            toast({ title: "Evaluación Añadida", description: `Se ha creado la columna "${label}" para el registro.` });
            fetchData();
        } catch (error) {
            toast({ title: "Error", description: "No se pudo añadir la evaluación manual.", variant: "destructive" });
        }
    };

    const handleManualEvaluationDeleted = async (indicatorId: string, evaluationId: string) => {
        if (!instituteId) return;
        try {
            const currentYear = new Date().getFullYear().toString();
            await deleteManualEvaluationFromRecord(instituteId, unit.id, currentYear, unit.period, indicatorId, evaluationId);
            toast({ title: "Evaluación Eliminada" });
            fetchData();
        } catch (error) {
            toast({ title: "Error", description: "No se pudo eliminar la evaluación.", variant: "destructive" });
        }
    };

    const handleSaveChanges = async () => {
        if (!instituteId) return;
        setIsSaving(true);
        try {
            const updatedRecords: AcademicRecord[] = [];
            for (const studentId in records) {
                 if (JSON.stringify(records[studentId]) !== JSON.stringify(initialRecords[studentId])) {
                    updatedRecords.push(records[studentId]);
                }
            }
            if (updatedRecords.length === 0) {
                toast({ title: "Sin Cambios", description: "No se han realizado cambios." });
                setIsSaving(false);
                return;
            }
            await batchUpdateAcademicRecords(instituteId, updatedRecords);
            toast({ title: "¡Éxito!", description: "Calificaciones guardadas correctamente." });
            setInitialRecords(records);
        } catch(error) {
            toast({ title: "Error", description: "No se pudo guardar las notas.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    }

    const handleCloseUnit = async () => {
        if (!instituteId) return;
        setIsClosing(true);
        try {
            const currentYear = new Date().getFullYear().toString();
            const results = students.map(student => {
                const record = records[student.documentId];
                const indicatorAverages = indicators.map(ind => {
                    const g = record.grades[ind.id]?.map(x => x.grade) || [];
                    return calculateAverage(g);
                });
                const finalAverage = calculateAverage(indicatorAverages);
                const status = (finalAverage ?? 0) >= 13 ? 'aprobado' : 'desaprobado';
                return { studentId: student.documentId, finalGrade: finalAverage, status: status as any };
            });

            await closeUnitGrades(instituteId, unit.id, currentYear, unit.period, results);
            toast({ title: "Acta Cerrada", description: "La unidad didáctica ha sido cerrada y las matrículas actualizadas." });
            fetchData();
        } catch (error) {
            toast({ title: "Error al cerrar", description: "Ocurrió un error técnico al intentar cerrar el acta.", variant: "destructive" });
        } finally {
            setIsClosing(false);
        }
    };

    const isAnyRecordClosed = useMemo(() => {
        return Object.values(records).some(r => r.status === 'aprobado' || r.status === 'desaprobado');
    }, [records]);

    if (loading) return <div className="space-y-6"><Skeleton className="h-24 w-full" /><Skeleton className="h-64 w-full" /></div>;

    return (
        <div className="space-y-6">
            <div className="screen-only">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Registro de Calificaciones</CardTitle>
                            <CardDescription>Gestione los promedios por indicador y cierre el acta de la unidad.</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            {isAnyRecordClosed ? (
                                <Badge variant="default" className="bg-green-600 px-4 py-2 text-sm">
                                    <CheckCircle2 className="mr-2 h-4 w-4" /> ACTA CERRADA
                                </Badge>
                            ) : (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="secondary">
                                            <Lock className="mr-2 h-4 w-4" /> Cerrar Acta
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>¿Está seguro de cerrar el acta?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Esta acción calculará los promedios finales y actualizará el estado de la matrícula de todos los estudiantes a "Aprobado" o "Desaprobado". Esto es irreversible desde este panel.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleCloseUnit} disabled={isClosing}>
                                                {isClosing ? "Cerrando..." : "Sí, Cerrar Acta Oficial"}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                            <Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" /> Imprimir</Button>
                            <Button onClick={handleSaveChanges} disabled={isSaving || isAnyRecordClosed}><Save className="mr-2 h-4 w-4" /> Guardar Cambios</Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {indicators.map(indicator => (
                                <Card key={indicator.id} className="hover:shadow-md cursor-pointer transition-all border-l-4 border-l-primary" onClick={() => setSelectedIndicator(indicator)}>
                                    <CardHeader>
                                        <CardTitle className="text-lg">{indicator.name}</CardTitle>
                                        <CardDescription className="line-clamp-2">{indicator.description}</CardDescription>
                                    </CardHeader>
                                </Card>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {selectedIndicator && (
                <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm p-4 md:p-10 overflow-y-auto">
                    <div className="max-w-6xl mx-auto space-y-6">
                        <Button variant="ghost" onClick={() => setSelectedIndicator(null)}><ArrowLeft className="mr-2 h-4 w-4" /> Volver al Resumen</Button>
                        <Card>
                            <CardHeader><CardTitle>Calificando: {selectedIndicator.name}</CardTitle></CardHeader>
                            <CardContent>
                                <IndicatorGradebook 
                                    students={students} 
                                    indicator={selectedIndicator} 
                                    records={records} 
                                    unit={unit}
                                    tasks={unitTasks}
                                    onGradeChange={handleGradeChange} 
                                    onManualEvaluationAdded={handleManualEvaluationAdded} 
                                    onManualEvaluationDeleted={handleManualEvaluationDeleted}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            <div className="print-only">
                <PrintLayout institute={institute} program={program} unit={unit} teacher={teacher} title="REGISTRO CONSOLIDADO DE EVALUACIÓN">
                    <GradebookSummaryTable students={students} indicators={indicators} records={records} />
                </PrintLayout>
            </div>
        </div>
    );
}
