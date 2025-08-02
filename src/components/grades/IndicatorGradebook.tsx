
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
    const evaluationsByWeek = useMemo(() => {
        const grouped: Record<number, EvaluationItem[]> = {};
        const indicatorTasks = tasks.filter(task => 
            task.weekNumber >= indicator.startWeek && task.weekNumber <= indicator.endWeek
        );
        
        indicatorTasks.forEach(task => {
            if (!grouped[task.weekNumber]) grouped[task.weekNumber] = [];
            grouped[task.weekNumber].push({ ...task, evalType: 'task' });
        });
        
        const firstRecord = Object.values(records)[0];
        if (firstRecord?.evaluations?.[indicator.id]) {
            firstRecord.evaluations[indicator.id].forEach(manualEval => {
                if (!grouped[manualEval.weekNumber]) grouped[manualEval.weekNumber] = [];
                 const finalEval: EvaluationItem = { 
                    ...manualEval, 
                    evalType: 'manual',
                 };
                
                grouped[manualEval.weekNumber].push(finalEval);
            });
        }
        
        for (const week in grouped) {
            grouped[week].sort((a, b) => {
                const timeA = new Date(a.createdAt as any).getTime();
                const timeB = new Date(b.createdAt as any).getTime();
                if (a.evalType === 'task' && b.evalType === 'manual') return -1;
                if (a.evalType === 'manual' && b.evalType === 'task') return 1;
                return timeA - timeB;
            });
        }

        return grouped;

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
            <div className="rounded-md border overflow-x-auto">
                <Table className="min-w-full">
                    <TableHeader>
                        <TableRow>
                            <TableHead rowSpan={2} className="w-[40px] text-center sticky left-0 bg-background z-10">N°</TableHead>
                            <TableHead rowSpan={2} className="w-[100px] sticky left-[40px] bg-background z-10">DNI</TableHead>
                            <TableHead rowSpan={2} className="w-[250px] sticky left-[140px] bg-background z-10">Apellidos y Nombres</TableHead>
                             {Array.from({ length: indicator.endWeek - indicator.startWeek + 1 }, (_, i) => i + indicator.startWeek).map(week => {
                                const weekEvals = evaluationsByWeek[week] || [];
                                const colSpan = weekEvals.length > 0 ? weekEvals.length : 1;
                                return (
                                     <TableHead key={week} colSpan={colSpan + 1} className="text-center border-l border-r">Semana {week}</TableHead>
                                )
                             })}
                            <TableHead rowSpan={2} className="text-center min-w-[100px] bg-muted/50">Promedio Indicador</TableHead>
                        </TableRow>
                        <TableRow>
                            {Array.from({ length: indicator.endWeek - indicator.startWeek + 1 }, (_, i) => i + indicator.startWeek).map(week => {
                                const weekEvals = evaluationsByWeek[week] || [];
                                return (
                                    <React.Fragment key={`subhead-week-${week}`}>
                                        {weekEvals.length > 0 ? weekEvals.map(ev => (
                                             <TableHead key={ev.id} className={cn(`text-center text-xs font-normal border-l min-w-[100px]`, ev.evalType === 'manual' ? 'bg-sky-100 dark:bg-sky-900' : '')}>
                                                <div className="flex items-center justify-center gap-1">
                                                    <div className="flex flex-col">
                                                        <span className="truncate font-medium">{ev.evalType === 'task' ? ev.title : ev.label}</span>
                                                        {ev.evalType === 'manual' && ev.createdAt && (
                                                            <span className="text-muted-foreground text-[10px]">{format(new Date(ev.createdAt as any), 'dd/MM/yy')}</span>
                                                        )}
                                                    </div>
                                                    {ev.evalType === 'manual' && (
                                                         <AlertDialog>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 no-print">
                                                                        <MoreVertical className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                     <AlertDialogTrigger asChild>
                                                                        <DropdownMenuItem className="text-destructive">
                                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                                            Eliminar Columna
                                                                        </DropdownMenuItem>
                                                                     </AlertDialogTrigger>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                             <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                <AlertDialogTitle>¿Eliminar "{ev.label}"?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Esta acción no se puede deshacer. Se eliminará esta columna de calificación y todas sus notas para todos los estudiantes.
                                                                </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => onManualEvaluationDeleted(indicator.id, ev.id)}>Sí, eliminar</AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    )}
                                                </div>
                                            </TableHead>
                                        )) : <TableHead className="text-center text-xs font-normal border-l min-w-[100px]"></TableHead>}
                                         <TableHead className="text-center border-l min-w-[50px] align-middle p-1">
                                            <Button variant="ghost" size="sm" className="w-full h-full p-1 no-print" onClick={() => handleOpenDialog(week)}>
                                                <PlusCircle className="h-4 w-4" />
                                            </Button>
                                        </TableHead>
                                    </React.Fragment>
                                )
                            })}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {students.map((student, index) => {
                            const studentRecord = records[student.documentId];
                            const allGradesForIndicator = studentRecord?.grades?.[indicator.id]?.map(g => g.grade) || [];
                            const indicatorAverage = calculateAverage(allGradesForIndicator);

                            return (
                                <TableRow key={student.documentId}>
                                    <TableCell className="text-center sticky left-0 bg-background z-10">{index + 1}</TableCell>
                                    <TableCell className="sticky left-[40px] bg-background z-10">{student.documentId}</TableCell>
                                    <TableCell className="font-medium sticky left-[140px] bg-background z-10">{student.fullName}</TableCell>
                                    {Array.from({ length: indicator.endWeek - indicator.startWeek + 1 }, (_, i) => i + indicator.startWeek).map(week => {
                                        const weekEvals = evaluationsByWeek[week] || [];
                                        return (
                                            <React.Fragment key={`row-${student.documentId}-week-${week}`}>
                                                {weekEvals.length > 0 ? weekEvals.map(ev => {
                                                    const gradeEntry = studentRecord?.grades?.[indicator.id]?.find(g => g.refId === ev.id);
                                                    return (
                                                        <TableCell key={ev.id} className={cn(`text-center border-l p-1`, ev.evalType === 'manual' ? 'bg-sky-50 dark:bg-sky-900/50' : '')}>
                                                            <Input 
                                                                type="number"
                                                                className="w-full text-center border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0"
                                                                value={gradeEntry?.grade ?? ''}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    if (val === '') {
                                                                        onGradeChange(student.documentId, indicator.id, ev.id, null, ev.evalType, ev.evalType === 'task' ? ev.title : ev.label, ev.weekNumber);
                                                                    } else {
                                                                        const num = Number(val);
                                                                        if (num >= 0 && num <= 20) {
                                                                             onGradeChange(student.documentId, indicator.id, ev.id, num, ev.evalType, ev.evalType === 'task' ? ev.title : ev.label, ev.weekNumber);
                                                                        }
                                                                    }
                                                                }}
                                                                min="0"
                                                                max="20"
                                                            />
                                                        </TableCell>
                                                    )
                                                }) : <TableCell className="border-l"></TableCell>}
                                                <TableCell className="text-center border-l"></TableCell>
                                            </React.Fragment>
                                        )
                                    })}
                                    <TableCell className="text-center font-bold bg-muted/50">
                                        {indicatorAverage ?? '-'}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
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
