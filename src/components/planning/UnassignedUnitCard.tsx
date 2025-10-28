
"use client";

import React from 'react';
import type { Unit } from '@/types';
import { GripVertical } from 'lucide-react';

interface UnassignedUnitCardProps {
    unit: Unit;
    onDragStart: (e: React.DragEvent<HTMLDivElement>, unit: Unit) => void;
}

export function UnassignedUnitCard({ unit, onDragStart }: UnassignedUnitCardProps) {
    return (
        <div 
            draggable 
            onDragStart={(e) => onDragStart(e, unit)}
            className="p-3 border rounded-md bg-card cursor-grab active:cursor-grabbing flex items-center gap-2 hover:bg-muted"
        >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
                <p className="font-semibold text-sm">{unit.name}</p>
                <p className="text-xs text-muted-foreground">{unit.totalHours} horas | {unit.credits} créditos</p>
            </div>
        </div>
    );
}
