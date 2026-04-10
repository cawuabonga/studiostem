
"use client";

import React, { useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { StudentProfile, AchievementIndicator, AcademicRecord, ManualEvaluation, Unit, GradeEntry, Task } from '@/types';
import { PlusCircle, Trash2, CalendarDays, Calculator } from 'lucide-react';
import { AddManualEvaluationDialog } from './AddManualEvaluationDialog';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface IndicatorGradebookProps {
    students: StudentProfile[];
    indicator: AchievementIndicator;
    records: Record<string, AcademicRecord>;
    unit: Unit;
    tasks: (Task & { weekNumber: number })[];
    onGradeChange: (studentId: string, indicatorId: string, refId: string, grade: number | null, type: 'task' | 'manual', label: string, weekNumber: number) => void;
    onManualEvaluationAdded: (indicatorId: string, label: string, weekNumber: number) => void;
    onManualEvaluationDeleted: (indicatorId: string, evaluationId: string) => void;
}

const calculateAverage = (grades: (number | null)[]): number | null => {
    const validGrades = grades.filter(g => g !== null && g !== undefined && !isNaN(g)) as number[];
    if (validGrades.length === 0) return null;
    const sum = validGrades.reduce((acc, grade) => acc + grade, 0);
    return Math.round(sum / validGrades.length);
};

export function IndicatorGradebook({ students, indicator, records, unit, tasks, onGradeChange, onManualEvaluationAdded, onManualEvaluationDeleted }: IndicatorGradebookProps) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedWeek, setSelectedWeek] = useState<number>(indicator.startWeek);
    
    const isActaClosed = useMemo(() => {
        return Object.values(records).some(r => r.status === 'aprobado' || r.status === 'desaprobado');
    }, [records]);

    // Flatten all evaluations (tasks and manual) into a single ordered list for the table header
    const flattenedEvaluations = useMemo(() => {
        const firstRecord = Object.values(records)[0];
        const list: { id: string, label: string, type: 'task' | 'manual', weekNumber: number }[] = [];

        // 1. Tasks from the planner that belong to this indicator (based on indicatorId or weeks)
        tasks.filter(t => t.indicatorId === indicator.id).forEach(t => {
            list.push({ id: t.id, label: t.title, type: 'task', weekNumber: t.weekNumber });
        });

        // 2. Manual evaluations
        if (firstRecord && firstRecord.evaluations && firstRecord.evaluations[indicator.id]) {
            firstRecord.evaluations[indicator.id].forEach(e => {
                if (!list.some(x => x.id === e.id)) {
                    list.push({ id: e.id, label: e.label, type: 'manual', weekNumber: e.weekNumber });
                }
            });
        }

        // Sort by week number
        return list.sort((a, b) => a.weekNumber - b.weekNumber);
    }, [records, indicator.id, tasks]);

    const handleOpenDialog = (week: number) => {
        setSelectedWeek(week);
        setDialogOpen(true);
    };

    if (students.length === 0) return <p className="text-center py-12 text-muted-foreground">No hay estudiantes en esta sección.</p>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
                <div className="flex gap-2">
                    <Badge variant="outline" className="px-3 py-1 bg-primary/5 border-primary/20">
                        <CalendarDays className="h-3.5 w-3.5 mr-2 text-primary" />
                        Vigencia del Indicador: Semanas {indicator.startWeek} a {indicator.endWeek}
                    </Badge>
                </div>
                {!isActaClosed && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="default" size="sm" className="shadow-sm">
                                <PlusCircle className="mr-2 h-4 w-4" /> 
                                Añadir Evaluación Manual
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Seleccionar Semana</DropdownMenuLabel>
                            {Array.from({ length: indicator.endWeek - indicator.startWeek + 1 }, (_, i) => indicator.startWeek + i).map(w => (
                                <DropdownMenuItem key={w} onClick={() => handleOpenDialog(w)}>
                                    Semana {w}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>

            <div className="rounded-xl border shadow-sm bg-background overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50 hover:bg-muted/50">
                                <TableHead className="w-[50px] text-center font-bold">N°</TableHead>
                                <TableHead className="min-w-[250px] font-bold sticky left-0 bg-muted/50 z-20">Apellidos y Nombres</TableHead>
                                {flattenedEvaluations.map(ev => (
                                    <TableHead key={ev.id} className="text-center min-w-[120px] p-2">
                                        <div className="flex flex-col items-center gap-1 group">
                                            <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-tight">Sem. {ev.weekNumber}</span>
                                            <span className="text-xs font-bold leading-tight line-clamp-2 max-w-[100px]">{ev.label}</span>
                                            <div className="flex items-center gap-1">
                                                <Badge variant="outline" className={cn("text-[9px] px-1 h-4", ev.type === 'task' ? "border-blue-200 text-blue-700 bg-blue-50" : "border-amber-200 text-amber-700 bg-amber-50")}>
                                                    {ev.type === 'task' ? 'Tarea' : 'Manual'}
                                                </Badge>
                                                {ev.type === 'manual' && !isActaClosed && (
                                                    <Button 
                                                        variant="ghost" size="icon" className="h-4 w-4 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() => onManualEvaluationDeleted(indicator.id, ev.id)}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </TableHead>
                                ))}
                                <TableHead className="text-center font-bold bg-primary/5 min-w-[100px] border-l">
                                    <div className="flex flex-col items-center">
                                        <Calculator className="h-3.5 w-3.5 mb-1 text-primary" />
                                        <span>PROMEDIO</span>
                                    </div>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {students.map((student, index) => {
                                const studentRecord = records[student.documentId];
                                const allGrades = studentRecord?.grades?.[indicator.id]?.map(g => g.grade) || [];
                                const avg = calculateAverage(allGrades);

                                return (
                                    <TableRow key={student.documentId} className="hover:bg-muted/20 transition-colors">
                                        <TableCell className="text-center font-mono text-xs text-muted-foreground">
                                            {index + 1}
                                        </TableCell>
                                        <TableCell className="font-semibold sticky left-0 bg-background z-10 border-r">
                                            <div className="flex flex-col">
                                                <span>{student.fullName}</span>
                                                <span className="text-[10px] font-mono text-muted-foreground">{student.documentId}</span>
                                            </div>
                                        </TableCell>
                                        {flattenedEvaluations.map(ev => {
                                            const gradeEntry = studentRecord?.grades?.[indicator.id]?.find(g => g.refId === ev.id);
                                            return (
                                                <TableCell key={ev.id} className="p-1">
                                                    <Input 
                                                        type="number" 
                                                        className={cn(
                                                            "w-full h-9 text-center font-bold border-transparent hover:border-input focus:bg-background",
                                                            (gradeEntry?.grade ?? 0) > 0 && (gradeEntry?.grade ?? 0) < 13 ? "text-destructive" : "text-primary"
                                                        )}
                                                        value={gradeEntry?.grade ?? ''}
                                                        placeholder="--"
                                                        onChange={e => {
                                                            const val = e.target.value === '' ? null : Number(e.target.value);
                                                            if (val === null || (val >= 0 && val <= 20)) {
                                                                onGradeChange(student.documentId, indicator.id, ev.id, val, ev.type, ev.label, ev.weekNumber);
                                                            }
                                                        }}
                                                        disabled={isActaClosed}
                                                    />
                                                </TableCell>
                                            );
                                        })}
                                        <TableCell className={cn(
                                            "text-center font-black text-base border-l bg-primary/5",
                                            avg !== null && avg < 13 ? "text-destructive" : "text-primary"
                                        )}>
                                            {avg !== null ? avg : '--'}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <AddManualEvaluationDialog 
                isOpen={dialogOpen} 
                onClose={() => setDialogOpen(false)} 
                onSubmit={label => { onManualEvaluationAdded(indicator.id, label, selectedWeek); setDialogOpen(false); }} 
                indicator={indicator} 
                unit={unit} 
                weekNumber={selectedWeek} 
            />
        </div>
    );
}
