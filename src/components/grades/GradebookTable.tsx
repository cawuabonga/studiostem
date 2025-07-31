

"use client";

import React, { useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { StudentProfile, AchievementIndicator, AcademicRecord, Task, ManualEvaluation, Unit } from '@/types';
import { PlusCircle } from 'lucide-react';
import { AddManualEvaluationDialog } from './AddManualEvaluationDialog';

interface GradebookTableProps {
    students: StudentProfile[];
    indicators: AchievementIndicator[];
    tasks: Task[];
    manualEvals: Record<string, ManualEvaluation[]>;
    records: Record<string, AcademicRecord>;
    unit: Unit;
    onGradeChange: (studentId: string, indicatorId: string, refId: string, grade: number | null, type: 'task' | 'manual', label: string, weekNumber: number) => void;
    onManualEvaluationAdded: (indicatorId: string, label: string, weekNumber: number) => void;
}

const calculateAverage = (grades: (number | null)[]): number | null => {
    const validGrades = grades.filter(g => g !== null && g !== undefined) as number[];
    if (validGrades.length === 0) return null;
    const sum = validGrades.reduce((acc, grade) => acc + grade, 0);
    return Math.round(sum / validGrades.length);
};

export function GradebookTable({ students, indicators, tasks, manualEvals, records, unit, onGradeChange, onManualEvaluationAdded }: GradebookTableProps) {

    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedIndicator, setSelectedIndicator] = useState<AchievementIndicator | null>(null);

    const evaluationsByIndicator = useMemo(() => {
        const grouped: Record<string, { tasks: Task[], manual: ManualEvaluation[] }> = {};
        
        indicators.forEach(indicator => {
            grouped[indicator.id] = {
                tasks: tasks.filter(task => 
                    task.weekNumber >= indicator.startWeek && task.weekNumber <= indicator.endWeek
                ),
                manual: manualEvals[indicator.id] || []
            };
        });

        return grouped;
    }, [indicators, tasks, manualEvals]);

    const handleAddManualEval = (indicator: AchievementIndicator) => {
        setSelectedIndicator(indicator);
        setDialogOpen(true);
    }
    
    const handleDialogSubmit = (label: string, weekNumber: number) => {
        if(selectedIndicator) {
            onManualEvaluationAdded(selectedIndicator.id, label, weekNumber);
        }
        setDialogOpen(false);
        setSelectedIndicator(null);
    }

    if (students.length === 0) {
        return <p className="text-center text-muted-foreground py-8">No hay estudiantes matriculados en esta unidad para el período seleccionado.</p>;
    }

    if (indicators.length === 0) {
        return <p className="text-center text-muted-foreground py-8">No se han definido indicadores de logro para esta unidad. Por favor, añádalos en la pestaña 'Indicadores de Logro'.</p>;
    }
    
    return (
        <>
            <div className="rounded-md border overflow-x-auto">
                <Table className="min-w-full">
                    <TableHeader>
                        <TableRow>
                            <TableHead rowSpan={2} className="sticky left-0 bg-background z-10 min-w-[200px]">Estudiante</TableHead>
                            {indicators.map(indicator => {
                                const evalTasks = evaluationsByIndicator[indicator.id]?.tasks || [];
                                const evalManuals = evaluationsByIndicator[indicator.id]?.manual || [];
                                const colSpan = evalTasks.length + evalManuals.length + 2; 
                                return (
                                    <TableHead key={indicator.id} colSpan={colSpan} className="text-center border-l border-r">
                                        {indicator.name}
                                    </TableHead>
                                )
                            })}
                            <TableHead rowSpan={2} className="text-center min-w-[100px]">Promedio Final</TableHead>
                            <TableHead rowSpan={2} className="text-center min-w-[100px]">% Asistencias</TableHead>
                            <TableHead rowSpan={2} className="min-w-[120px]">Estado</TableHead>
                        </TableRow>
                        <TableRow>
                            {indicators.map(indicator => {
                                const evalTasks = evaluationsByIndicator[indicator.id]?.tasks || [];
                                const evalManuals = evaluationsByIndicator[indicator.id]?.manual || [];
                                return (
                                    <React.Fragment key={`subhead-${indicator.id}`}>
                                        {evalTasks.map(task => (
                                            <TableHead key={task.id} className="text-center text-xs font-normal border-l min-w-[120px]">{task.title}</TableHead>
                                        ))}
                                        {evalManuals.map(manual => (
                                            <TableHead key={manual.id} className="text-center text-xs font-normal border-l min-w-[120px] bg-sky-100 dark:bg-sky-900">{manual.label}</TableHead>
                                        ))}
                                        <TableHead className="text-center border-l min-w-[50px]">
                                            <Button variant="ghost" size="sm" className="w-full h-full p-1" onClick={() => handleAddManualEval(indicator)}>
                                                <PlusCircle className="h-4 w-4" />
                                            </Button>
                                        </TableHead>
                                        <TableHead className="text-center font-semibold border-l bg-muted/50 min-w-[100px]">Prom. Indicador</TableHead>
                                    </React.Fragment>
                                )
                            })}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {students.map(student => {
                            const record = records[student.documentId];
                            const finalAverages: (number | null)[] = [];

                            return (
                                <TableRow key={student.documentId}>
                                    <TableCell className="font-medium sticky left-0 bg-background z-10">{student.fullName}</TableCell>
                                    {indicators.map(indicator => {
                                        const evalTasks = evaluationsByIndicator[indicator.id]?.tasks || [];
                                        const evalManuals = evaluationsByIndicator[indicator.id]?.manual || [];
                                        const gradesForIndicator = record?.grades?.[indicator.id]?.map(g => g.grade) || [];
                                        const indicatorAverage = calculateAverage(gradesForIndicator);
                                        if (indicatorAverage !== null) finalAverages.push(indicatorAverage);

                                        return (
                                            <React.Fragment key={`${student.documentId}-${indicator.id}`}>
                                                {evalTasks.map(task => {
                                                    const gradeEntry = record?.grades?.[indicator.id]?.find(g => g.refId === task.id);
                                                    return (
                                                        <TableCell key={task.id} className="text-center border-l">
                                                            <Input 
                                                                type="number" 
                                                                className="mx-auto max-w-[80px] text-center"
                                                                value={gradeEntry?.grade ?? ''}
                                                                onChange={(e) => onGradeChange(student.documentId, indicator.id, task.id, e.target.value === '' ? null : Number(e.target.value), 'task', task.title, task.weekNumber)}
                                                                min="0"
                                                                max="20"
                                                            />
                                                        </TableCell>
                                                    )
                                                })}
                                                 {evalManuals.map(manual => {
                                                    const gradeEntry = record?.grades?.[indicator.id]?.find(g => g.refId === manual.id);
                                                    return (
                                                         <TableCell key={manual.id} className="text-center border-l bg-sky-50 dark:bg-sky-900/50">
                                                            <Input 
                                                                type="number" 
                                                                className="mx-auto max-w-[80px] text-center"
                                                                value={gradeEntry?.grade ?? ''}
                                                                onChange={(e) => onGradeChange(student.documentId, indicator.id, manual.id, e.target.value === '' ? null : Number(e.target.value), 'manual', manual.label, manual.weekNumber)}
                                                                min="0"
                                                                max="20"
                                                            />
                                                        </TableCell>
                                                    )
                                                 })}
                                                <TableCell className="text-center border-l"></TableCell>
                                                <TableCell className="text-center font-bold border-l bg-muted/50">
                                                    {indicatorAverage ?? '-'}
                                                </TableCell>
                                            </React.Fragment>
                                        )
                                    })}

                                    <TableCell className="text-center font-bold">
                                        {calculateAverage(finalAverages) ?? '-'}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {record ? `${record.attendancePercentage}%` : '100%'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={record?.status === 'aprobado' ? 'default' : 'secondary'}>
                                            {record?.status || 'cursando'}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
            {selectedIndicator && (
                 <AddManualEvaluationDialog 
                    isOpen={dialogOpen}
                    onClose={() => setDialogOpen(false)}
                    onSubmit={handleDialogSubmit}
                    indicator={selectedIndicator}
                    unit={unit}
                 />
            )}
        </>
    );
}
