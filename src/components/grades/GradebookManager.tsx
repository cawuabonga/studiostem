
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Unit, StudentProfile, AchievementIndicator, AcademicRecord, Task, Program, Teacher } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Save, Loader2, Printer, Lock, CheckCircle2, LayoutDashboard, NotebookPen } from 'lucide-react';
import { produce } from 'immer';
import { IndicatorGradebook } from './IndicatorGradebook';
import { Badge } from '../ui/badge';
import { GradebookSummaryTable } from './GradebookSummaryTable';
import '@/app/dashboard/gestion-academica/print-grades.css';
import { PrintLayout } from '../printing/PrintLayout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '../ui/label';
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
import { IndicatorGradebookPrint } from './IndicatorGradebookPrint';

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
    
    const [viewMode, setViewMode] = useState<string>('summary'); 

    const fetchData = useCallback(async () => {
        if (!instituteId) return;
        setLoading(true);
        try {
            const currentYear = new Date().getFullYear().toString();
            
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
            
            setStudents(enrolledStudents.sort((a, b) => a.lastName.localeCompare(b.lastName)));
            const sortedIndicators = achievementIndicators.sort((a, b) => a.startWeek - b.startWeek);
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
                } else {
                    if (!existingRecord.grades) existingRecord.grades = {};
                    if (!existingRecord.evaluations) existingRecord.evaluations = {};
                }
                 recordsMap[student.documentId] = existingRecord;
            });
            setRecords(recordsMap);
            setInitialRecords(JSON.parse(JSON.stringify(recordsMap)));
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
            if (!studentRecord.grades) studentRecord.grades = {};
            if (!studentRecord.grades[indicatorId]) studentRecord.grades[indicatorId] = [];
            
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
            const studentIds = students.map(s => s.documentId);
            await addManualEvaluationToRecord(instituteId, unit.id, currentYear, unit.period, studentIds, {
                indicatorId,
                label,
                weekNumber
            });
            toast({ title: "Evaluación Añadida", description: `Se ha creado la columna "${label}".` });
            fetchData();
        } catch (error) {
            toast({ title: "Error", description: "No se pudo añadir la evaluación.", variant: "destructive" });
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
                toast({ title: "Sin Cambios", description: "No se han realizado modificaciones." });
                setIsSaving(false);
                return;
            }
            await batchUpdateAcademicRecords(instituteId, updatedRecords);
            toast({ title: "¡Éxito!", description: "Calificaciones guardadas correctamente." });
            setInitialRecords(JSON.parse(JSON.stringify(records)));
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
            toast({ title: "Acta Cerrada", description: "La unidad didáctica ha sido cerrada oficialmente." });
            fetchData();
        } catch (error) {
            toast({ title: "Error al cerrar", variant: "destructive" });
        } finally {
            setIsClosing(false);
        }
    };

    const isAnyRecordClosed = useMemo(() => {
        return Object.values(records).some(r => r.status === 'aprobado' || r.status === 'desaprobado');
    }, [records]);

    const selectedIndicator = useMemo(() => 
        indicators.find(i => i.id === viewMode),
    [indicators, viewMode]);

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
                                <CardTitle>Control de Calificaciones</CardTitle>
                                <CardDescription>Registro auxiliar de evaluación modular por indicadores.</CardDescription>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {isAnyRecordClosed ? (
                                    <Badge variant="default" className="bg-green-600 px-4 py-2 text-sm h-10">
                                        <CheckCircle2 className="mr-2 h-4 w-4" /> ACTA CERRADA
                                    </Badge>
                                ) : (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="secondary" className="h-10">
                                                <Lock className="mr-2 h-4 w-4" /> Cerrar Acta
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>¿Cerrar acta de evaluación?</AlertDialogTitle>
                                                <AlertDialogDescription>Esta acción es irreversible y actualizará la situación académica de todos los estudiantes matriculados.</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleCloseUnit} disabled={isClosing}>Confirmar Cierre</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}
                                <Button variant="outline" onClick={handlePrint} className="h-10">
                                    <Printer className="mr-2 h-4 w-4" /> Imprimir Registro
                                </Button>
                                <Button onClick={handleSaveChanges} disabled={isSaving || isAnyRecordClosed} className="h-10">
                                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Guardar Cambios
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col md:flex-row items-center gap-4 p-4 bg-muted/30 rounded-lg border border-dashed">
                            <Label htmlFor="indicator-select" className="font-bold text-primary flex items-center gap-2 whitespace-nowrap">
                                <LayoutDashboard className="h-4 w-4" /> VISTA ACTUAL:
                            </Label>
                            <Select value={viewMode} onValueChange={setViewMode}>
                                <SelectTrigger id="indicator-select" className="w-full md:w-[450px] bg-background">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="summary" className="font-bold">RESUMEN CONSOLIDADO (ACTA DE PROMEDIOS)</SelectItem>
                                    <SelectItem value="sep" disabled className="text-muted-foreground text-center">--- INDICADORES DE LOGRO ---</SelectItem>
                                    {indicators.map(ind => (
                                        <SelectItem key={ind.id} value={ind.id}>
                                            {ind.name} (Semanas {ind.startWeek}-{ind.endWeek})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <div className="mt-6">
                    {viewMode === 'summary' ? (
                        <GradebookSummaryTable students={students} indicators={indicators} records={records} />
                    ) : selectedIndicator ? (
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
                    ) : null}
                </div>
            </div>

            <div className="print-only">
                <PrintLayout 
                    institute={institute} 
                    program={program} 
                    unit={unit} 
                    teacher={teacher} 
                    title={viewMode === 'summary' ? "REGISTRO CONSOLIDADO DE EVALUACIÓN MODULAR" : `DETALLE DE EVALUACIÓN - INDICADOR: ${selectedIndicator?.name}`}
                >
                    {viewMode === 'summary' ? (
                        <GradebookSummaryTable students={students} indicators={indicators} records={records} />
                    ) : selectedIndicator ? (
                        <IndicatorGradebookPrint 
                            students={students} 
                            indicator={selectedIndicator} 
                            records={records} 
                            tasks={unitTasks}
                        />
                    ) : null}
                </PrintLayout>
            </div>
        </div>
    );
}
