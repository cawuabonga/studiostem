
"use client";

import React, { useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { StudentProfile, AchievementIndicator, AcademicRecord, Task, ManualEvaluation, Unit } from '@/types';
import { PlusCircle, MoreVertical, Trash2 } from 'lucide-react';
import { AddManualEvaluationDialog } from './AddManualEvaluationDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
} from "@/components/ui/alert-dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Timestamp } from 'firebase/firestore';

interface IndicatorGradebookProps {
    students: StudentProfile[];
    indicator: AchievementIndicator;
    tasks: Task[];
    records: Record<string, AcademicRecord>;
    unit: Unit;
    onGradeChange: (studentId: string, indicatorId: string, refId: string, grade: number | null, type: 'task' | 'manual', label: string, weekNumber: number) => void;
    onManualEvaluationAdded: (indicatorId: string, label: string, weekNumber: number) => void;
    onManualEvaluationDeleted: (indicatorId: string, evaluationId: string) => void;
}

type EvaluationItem = (Task & { evalType: 'task' }) | (ManualEvaluation & { evalType: 'manual' });

const calculateAverage = (grades: (number | null)[]): number | null => {
    const validGrades = grades.filter(g => g !== null && g !== undefined && !isNaN(g)) as number[];
    if (validGrades.length === 0) return null;
    const sum = validGrades.reduce((acc, grade) => acc + grade, 0);
    return Math.round(sum / validGrades.length);
};

export function IndicatorGradebook({ students, indicator, tasks, records, unit, onGradeChange, onManualEvaluationAdded, onManualEvaluationDeleted }: IndicatorGradebookProps) {

    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedWeek, setSelectedWeek] = useState<number>(0);
    
    // Group evaluations by week
    const allEvaluations = useMemo(() => {
        const evals: EvaluationItem[] = [];
        const indicatorTasks = tasks.filter(task => 
            task.weekNumber >= indicator.startWeek && task.weekNumber <= indicator.endWeek
        );
        
        indicatorTasks.forEach(task => {
            evals.push({ ...task, evalType: 'task' });
        });
        
        const firstRecord = Object.values(records)[0];
        if (firstRecord?.evaluations?.[indicator.id]) {
            firstRecord.evaluations[indicator.id].forEach(manualEval => {
                evals.push({ ...manualEval, evalType: 'manual' });
            });
        }
        
        return evals.sort((a, b) => a.weekNumber - b.weekNumber);

    }, [indicator, tasks, records]);
    
    const handleOpenDialog = (week: number) => {
        setSelectedWeek(week);
        setDialogOpen(true);
    };

    const handleDialogSubmit = (label: string) => {
        onManualEvaluationAdded(indicator.id, label, selectedWeek);
        setDialogOpen(false);
    };

    if (students.length === 0) {
        return <p className="text-center text-muted-foreground py-8">No hay estudiantes matriculados en esta unidad para el período seleccionado.</p>;
    }
    
    return (
        <>
            <div className="space-y-4">
                <div className="flex justify-end screen-only">
                    {/* For now, let's allow adding evaluations to the first week of the indicator as a default */}
                    <Button variant="outline" size="sm" onClick={() => handleOpenDialog(indicator.startWeek)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Añadir Evaluación Manual
                    </Button>
                </div>
                 <Accordion type="multiple" className="w-full space-y-2">
                    {students.map((student, index) => {
                        const studentRecord = records[student.documentId];
                        const allGradesForIndicator = studentRecord?.grades?.[indicator.id]?.map(g => g.grade) || [];
                        const indicatorAverage = calculateAverage(allGradesForIndicator);

                        return (
                            <AccordionItem key={student.documentId} value={student.documentId} className="border rounded-lg shadow-sm">
                                <AccordionTrigger className="text-base font-medium px-4 py-2 hover:no-underline">
                                     <div className="flex justify-between items-center w-full">
                                        <div className="flex items-center gap-4">
                                            <span className="text-muted-foreground w-6 text-center">{index + 1}</span>
                                            <span>{student.fullName}</span>
                                        </div>
                                        <Badge className={cn(
                                                "text-lg",
                                                indicatorAverage === null ? "bg-muted text-muted-foreground" :
                                                indicatorAverage < 11 ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"
                                            )}>
                                            Prom: {indicatorAverage ?? '--'}
                                        </Badge>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-4 pb-4">
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-1/2">Evaluación</TableHead>
                                                    <TableHead>Semana</TableHead>
                                                    <TableHead className="text-right">Nota</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {allEvaluations.length > 0 ? allEvaluations.map(ev => {
                                                    const gradeEntry = studentRecord?.grades?.[indicator.id]?.find(g => g.refId === ev.id);
                                                    return (
                                                        <TableRow key={ev.id}>
                                                            <TableCell className="font-medium">{ev.evalType === 'task' ? ev.title : ev.label}</TableCell>
                                                            <TableCell>{ev.weekNumber}</TableCell>
                                                            <TableCell className="text-right">
                                                                <Input 
                                                                    type="number"
                                                                    className="w-20 text-center ml-auto border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0"
                                                                    value={gradeEntry?.grade ?? ''}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value;
                                                                        const num = val === '' ? null : Number(val);
                                                                        if (num === null || (num >= 0 && num <= 20)) {
                                                                            onGradeChange(student.documentId, indicator.id, ev.id, num, ev.evalType, ev.evalType === 'task' ? ev.title : ev.label, ev.weekNumber);
                                                                        }
                                                                    }}
                                                                    min="0"
                                                                    max="20"
                                                                />
                                                            </TableCell>
                                                        </TableRow>
                                                    )
                                                }) : (
                                                    <TableRow>
                                                        <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                                                            No hay evaluaciones definidas para este indicador.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        );
                    })}
                </Accordion>
            </div>
             <AddManualEvaluationDialog 
                isOpen={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSubmit={handleDialogSubmit}
                indicator={indicator}
                unit={unit}
                weekNumber={selectedWeek}
             />
        </>
    );
}
