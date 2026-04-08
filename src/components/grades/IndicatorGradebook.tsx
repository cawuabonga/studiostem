
"use client";

import React, { useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { StudentProfile, AchievementIndicator, AcademicRecord, ManualEvaluation, Unit, GradeEntry } from '@/types';
import { PlusCircle, MoreVertical, Trash2, CalendarDays } from 'lucide-react';
import { AddManualEvaluationDialog } from './AddManualEvaluationDialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from '@/lib/utils';

interface IndicatorGradebookProps {
    students: StudentProfile[];
    indicator: AchievementIndicator;
    records: Record<string, AcademicRecord>;
    unit: Unit;
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

export function IndicatorGradebook({ students, indicator, records, unit, onGradeChange, onManualEvaluationAdded, onManualEvaluationDeleted }: IndicatorGradebookProps) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedWeek, setSelectedWeek] = useState<number>(indicator.startWeek);
    
    const isActaClosed = useMemo(() => {
        return Object.values(records).some(r => r.status === 'aprobado' || r.status === 'desaprobado');
    }, [records]);

    // Group evaluations by week
    const evaluationsByWeek = useMemo(() => {
        const firstRecord = Object.values(records)[0];
        if (!firstRecord) return {};

        const evalsMap: Record<number, (GradeEntry | ManualEvaluation)[]> = {};

        // Collect all evaluations from grades array and evaluations array
        const allEvals: (GradeEntry | ManualEvaluation)[] = [];
        if (firstRecord.grades[indicator.id]) {
            firstRecord.grades[indicator.id].forEach(g => allEvals.push(g));
        }
        if (firstRecord.evaluations[indicator.id]) {
            firstRecord.evaluations[indicator.id].forEach(e => {
                if (!allEvals.some(ae => ('refId' in ae ? ae.refId : ae.id) === e.id)) {
                    allEvals.push(e);
                }
            });
        }

        allEvals.forEach(ev => {
            const week = ev.weekNumber;
            if (!evalsMap[week]) evalsMap[week] = [];
            evalsMap[week].push(ev);
        });

        return evalsMap;
    }, [records, indicator.id]);

    const sortedWeeks = useMemo(() => {
        return Object.keys(evaluationsByWeek).map(Number).sort((a, b) => a - b);
    }, [evaluationsByWeek]);

    const handleOpenDialog = (week: number) => {
        setSelectedWeek(week);
        setDialogOpen(true);
    };

    if (students.length === 0) return <p className="text-center py-12 text-muted-foreground">No hay estudiantes en esta sección.</p>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center screen-only">
                <div className="flex gap-2">
                    <Badge variant="secondary" className="px-3 py-1">Semanas del Indicador: {indicator.startWeek} - {indicator.endWeek}</Badge>
                </div>
                {!isActaClosed && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm"><PlusCircle className="mr-2 h-4 w-4" /> Añadir Evaluación Manual</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {Array.from({ length: indicator.endWeek - indicator.startWeek + 1 }, (_, i) => indicator.startWeek + i).map(w => (
                                <DropdownMenuItem key={w} onClick={() => handleOpenDialog(w)}>Semana {w}</DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>

            <Accordion type="multiple" className="space-y-4">
                {students.map((student, sIdx) => {
                    const studentRecord = records[student.documentId];
                    const allGrades = studentRecord?.grades?.[indicator.id]?.map(g => g.grade) || [];
                    const avg = calculateAverage(allGrades);

                    return (
                        <AccordionItem key={student.documentId} value={student.documentId} className="border rounded-xl shadow-sm overflow-hidden bg-background">
                            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/30">
                                <div className="flex justify-between items-center w-full pr-4">
                                    <div className="flex items-center gap-4">
                                        <span className="text-muted-foreground font-mono text-xs">{sIdx + 1}</span>
                                        <span className="font-bold text-left">{student.fullName}</span>
                                    </div>
                                    <Badge className={cn("text-lg px-4", avg === null ? "bg-muted" : avg < 13 ? "bg-destructive" : "bg-green-600")}>PROM: {avg ?? '--'}</Badge>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-6 pb-6 pt-2">
                                {sortedWeeks.length > 0 ? sortedWeeks.map(week => (
                                    <div key={week} className="mt-4 first:mt-0">
                                        <h5 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2"><CalendarDays className="h-3 w-3" /> Semana {week}</h5>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {evaluationsByWeek[week].map(ev => {
                                                const refId = 'refId' in ev ? ev.refId : ev.id;
                                                const label = 'label' in ev ? ev.label : ev.title;
                                                const type = 'type' in ev && ev.type === 'task' ? 'task' : 'manual';
                                                const gradeEntry = studentRecord?.grades?.[indicator.id]?.find(g => g.refId === refId);

                                                return (
                                                    <div key={refId} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                                                        <div className="flex-1 min-w-0 pr-2">
                                                            <p className="text-xs font-medium truncate">{label}</p>
                                                            <p className="text-[10px] text-muted-foreground uppercase">{type}</p>
                                                        </div>
                                                        <Input 
                                                            type="number" className="w-16 h-8 text-center font-bold" value={gradeEntry?.grade ?? ''}
                                                            onChange={e => {
                                                                const val = e.target.value === '' ? null : Number(e.target.value);
                                                                if (val === null || (val >= 0 && val <= 20)) onGradeChange(student.documentId, indicator.id, refId, val, type, label, week);
                                                            }}
                                                            disabled={isActaClosed}
                                                        />
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )) : <div className="text-center py-8 text-muted-foreground italic text-sm">No hay evaluaciones programadas para este indicador.</div>}
                            </AccordionContent>
                        </AccordionItem>
                    );
                })}
            </Accordion>

            <AddManualEvaluationDialog isOpen={dialogOpen} onClose={() => setDialogOpen(false)} onSubmit={l => { onManualEvaluationAdded(indicator.id, l, selectedWeek); setDialogOpen(false); }} indicator={indicator} unit={unit} weekNumber={selectedWeek} />
        </div>
    );
}
