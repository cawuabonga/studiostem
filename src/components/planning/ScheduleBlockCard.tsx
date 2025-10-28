
"use client";

import React from 'react';
import type { ScheduleBlock, Unit } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '../ui/button';
import { X } from 'lucide-react';
import { Badge } from '../ui/badge';

interface ScheduleBlockCardProps {
    block: ScheduleBlock;
    unit: Unit;
    onRemove: () => void;
}

export function ScheduleBlockCard({ block, unit, onRemove }: ScheduleBlockCardProps) {
    return (
        <div className="h-full w-full bg-primary/10 border border-primary/30 rounded-md p-1.5 text-xs relative flex flex-col justify-between">
            <div>
                <p className="font-bold text-primary">{unit.code}</p>
                <p className="leading-tight">{unit.name}</p>
            </div>
            <div className="flex justify-between items-center mt-1">
                 <Badge variant="secondary" className="text-xs">
                    {unit.turno}
                 </Badge>
                 <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-0 right-0 h-5 w-5 text-primary/50 hover:text-destructive hover:bg-destructive/10"
                    onClick={onRemove}
                    aria-label="Eliminar bloque"
                >
                    <X className="h-3 w-3" />
                </Button>
            </div>
        </div>
    );
}
