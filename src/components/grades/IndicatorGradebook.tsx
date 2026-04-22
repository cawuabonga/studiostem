
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
import type { StudentProfile, AchievementIndicator, AcademicRecord, Unit, Task } from '@/types';
import { PlusCircle, Trash2, Calculator } from 'lucide-react';
import { AddManualEvaluationDialog } from './AddManualEvaluationDialog';
import { cn } from '@/lib/utils';

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

    const flattenedEvaluations = useMemo(() => {
        const firstRecord = Object.values(records)[0];
        const list: { id: string, label: string, type: 'task' | 'manual', weekNumber: number }[] = [];

        tasks.filter(t => t.indicatorId === indicator.id).forEach(t => {
            list.push({ id: t.id, label: t.title, type: 'task', weekNumber: t.weekNumber });
        });

        if (firstRecord && firstRecord.evaluations && firstRecord.evaluations[indicator.id]) {
            firstRecord.evaluations[indicator.id].forEach(e => {
                if (!list.some(x => x.id === e.id)) {
                    list.push({ id: e.id, label: e.label, type: 'manual', weekNumber: e.weekNumber });
                }
            });
        }

        return list.sort((a, b) => a.weekNumber - b.weekNumber);
    }, [records, indicator.id, tasks]);

    const handleOpenDialog = (week: number) => {
        setSelectedWeek(week);
        setDialogOpen(true);
    };

    if (students.length === 0) return <p className="text-center py-12 text-muted-foreground">No hay estudiantes en esta sección.</p>;

    return (
        <div className="space-y-4 animate-in fade-in duration-500">
            <div className="flex justify-end">
                {!isActaClosed && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="shadow-sm">
                                <PlusCircle className="mr-2 h-4 w-4" /> 
                                Nueva Evaluación Manual
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

            <div className="relative w-full overflow-hidden rounded-xl border shadow-md bg-background">
                <div className="overflow-x-auto overflow-y-auto max-h-[70vh] min-w-0">
                    <Table className="border-separate border-spacing-0 table-auto w-full">
                        <TableHeader className="sticky top-0 z-50">
                            <TableRow className="bg-slate-100 hover:bg-slate-100">
                                <TableHead className="w-[40px] sticky left-0 top-0 bg-slate-100 z-[60] text-center font-bold text-[10px] uppercase border-r border-b">N°</TableHead>
                                <TableHead className="w-auto whitespace-nowrap sticky left-[40px] top-0 bg-slate-100 z-[60] font-bold text-[10px] uppercase border-r border-b shadow-[2px_0_5px_rgba(0,0,0,0.1)]">Apellidos y Nombres</TableHead>
                                {flattenedEvaluations.map(ev => (
                                    <TableHead key={ev.id} className="text-center p-2 w-[80px] min-w-[80px] border-r border-b bg-slate-50">
                                        <div className="flex flex-col items-center gap-1 group">
                                            <span className="text-[9px] uppercase text-muted-foreground font-black tracking-tight">Sem. {ev.weekNumber}</span>
                                            <span className="text-[10px] font-bold leading-tight line-clamp-1 max-w-[70px] text-primary">{ev.label}</span>
                                            <div className="flex items-center gap-1">
                                                <Badge variant="outline" className={cn("text-[8px] px-1 h-3.5", ev.type === 'task' ? "border-blue-200 text-blue-700 bg-blue-50" : "border-amber-200 text-amber-700 bg-amber-50")}>
                                                    {ev.type === 'task' ? 'T' : 'M'}
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
                                <TableHead className="text-center w-[80px] sticky right-0 top-0 bg-slate-200 z-[60] font-black text-[10px] uppercase border-l border-b shadow-[-2px_0_5px_rgba(0,0,0,0.1)]">Promedio</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {students.map((student, index) => {
                                const studentRecord = records[student.documentId];
                                const allGrades = studentRecord?.grades?.[indicator.id]?.map(g => g.grade) || [];
                                const avg = calculateAverage(allGrades);

                                return (
                                    <TableRow key={student.documentId} className="h-10 hover:bg-slate-50 transition-colors">
                                        <TableCell className="text-center sticky left-0 bg-white z-10 font-mono text-[10px] text-muted-foreground border-r border-b">
                                            {index + 1}
                                        </TableCell>
                                        <TableCell className="sticky left-[40px] bg-white z-10 border-r border-b py-1 shadow-[2px_0_5px_rgba(0,0,0,0.05)] whitespace-nowrap">
                                            <div className="flex flex-col leading-none">
                                                <span className="text-[13px] font-bold uppercase whitespace-nowrap text-slate-700">
                                                    {student.lastName}, {student.firstName}
                                                </span>
                                                <span className="text-[9px] font-mono text-muted-foreground mt-0.5">{student.documentId}</span>
                                            </div>
                                        </TableCell>
                                        {flattenedEvaluations.map(ev => {
                                            const gradeEntry = studentRecord?.grades?.[indicator.id]?.find(g => g.refId === ev.id);
                                            return (
                                                <TableCell key={ev.id} className="p-0.5 text-center border-r border-b w-[80px]">
                                                    <Input 
                                                        type="number" 
                                                        className={cn(
                                                            "w-full h-8 text-center font-black border-transparent hover:border-input focus:bg-background text-[11px]",
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
                                            "sticky right-0 bg-white z-10 text-center font-black text-xs border-l border-b shadow-[-2px_0_5px_rgba(0,0,0,0.05)] w-[80px]",
                                            avg !== null && avg < 13 ? "text-red-600" : "text-blue-700"
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

            <div className="flex justify-between items-center px-2 text-[10px] text-muted-foreground font-medium bg-slate-50 p-2 rounded-lg border border-dashed">
                <div className="flex gap-4">
                    <p>Nota aprobatoria: 13</p>
                    <p className="italic">Usa la barra de scroll inferior si hay muchas evaluaciones.</p>
                </div>
                <div className="flex items-center gap-1 text-red-600 font-bold">
                    <Calculator className="h-3 w-3" /> Promedio calculado automáticamente
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
