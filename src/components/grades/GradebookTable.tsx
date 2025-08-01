

"use client";

import React from 'react';
import type { StudentProfile, AchievementIndicator, AcademicRecord, Task, ManualEvaluation, Unit } from '@/types';
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

export function GradebookTable({ students, indicators, tasks, manualEvals, records, unit, onGradeChange, onManualEvaluationAdded }: GradebookTableProps) {
    // This component is no longer used and its contents have been moved to IndicatorGradebook.tsx.
    // It is kept to avoid breaking imports but should be considered deprecated.
    return null;
}
