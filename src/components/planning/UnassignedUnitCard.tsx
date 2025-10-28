
"use client";

import React from 'react';
import type { Unit } from '@/types';
import { GripVertical, Clock } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { cn } from '@/lib/utils';

interface UnassignedUnitCardProps {
    unit: Unit;
    assignedHours: number;
    onDragStart: (e: React.DragEvent<HTMLDivElement>, unit: Unit) => void;
}

export function UnassignedUnitCard({ unit, assignedHours, onDragStart }: UnassignedUnitCardProps) {
    // Corrected calculation: Weekly hours are the sum of theoretical and practical hours.
    const weeklyHours = (unit.theoreticalHours || 0) + (unit.practicalHours || 0);
    const isCompleted = weeklyHours > 0 && assignedHours >= weeklyHours;
    const progressPercentage = weeklyHours > 0 ? (assignedHours / weeklyHours) * 100 : 0;

    return (
        <div 
            draggable={!isCompleted}
            onDragStart={(e) => onDragStart(e, unit)}
            className={cn(
                "p-3 border rounded-md bg-card flex items-start gap-2 transition-all",
                isCompleted 
                    ? "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 cursor-not-allowed opacity-70" 
                    : "cursor-grab active:cursor-grabbing hover:bg-muted"
            )}
        >
            <GripVertical className="h-5 w-5 text-muted-foreground mt-1 shrink-0" />
            <div className="flex-1 space-y-1.5">
                <p className={cn("font-semibold text-sm", isCompleted && "text-green-800 dark:text-green-300")}>{unit.name}</p>
                <div className="text-xs text-muted-foreground flex items-center justify-between">
                    <Badge variant="outline">{unit.turno}</Badge>
                    <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{weeklyHours} horas semanales</span>
                    </div>
                </div>
                 <div className="space-y-1 pt-1">
                    <p className="text-xs font-medium text-muted-foreground">
                        Asignadas: {assignedHours} de {weeklyHours}
                    </p>
                    <Progress value={progressPercentage} className="h-2" />
                </div>
            </div>
        </div>
    );
}
