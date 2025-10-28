
"use client";

import React from 'react';
import type { ScheduleBlock, TimeBlock, Unit, Teacher, Environment } from '@/types';
import { ScheduleBlockCard } from './ScheduleBlockCard';
import { cn } from '@/lib/utils';

const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

interface Suggestion {
    originKey: string;
    unit: Unit;
    suggestedKeys: string[];
}

export const TurnoGrid = ({
    turno,
    timeBlocks,
    schedule,
    units,
    teachers,
    environments,
    conflicts,
    suggestion,
    handleDrop,
    handleDragOver,
    removeBlock,
    updateBlock,
    handleAcceptSuggestion,
    handleRejectSuggestion
}: {
    turno: string,
    timeBlocks: TimeBlock[],
    schedule: Record<string, ScheduleBlock>,
    units: Unit[],
    teachers: Teacher[],
    environments: Environment[],
    conflicts: Record<string, { teacherConflict: boolean, environmentConflict: boolean }>,
    suggestion: Suggestion | null,
    handleDrop: (e: React.DragEvent<HTMLDivElement>, day: string, hour: string) => void,
    handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void,
    removeBlock: (day: string, hour: string) => void,
    updateBlock: (key: string, data: Partial<ScheduleBlock>) => void,
    handleAcceptSuggestion: () => void,
    handleRejectSuggestion: () => void,
}) => {
    if (timeBlocks.length === 0) return null;
    
    return (
        <>
            <div className="col-span-6 bg-muted p-2 text-center font-bold text-sm sticky top-[48px] z-10">{turno}</div>
            {timeBlocks.map(block => (
                <React.Fragment key={block.startTime}>
                    <div className="font-semibold p-2 text-center text-xs border-t bg-background flex flex-col justify-center">
                        <span>{block.startTime}</span>
                        <span>-</span>
                        <span>{block.endTime}</span>
                    </div>
                    {days.map(day => {
                        const cellKey = `${day}-${block.startTime}`;
                        const scheduleBlock = schedule[cellKey];
                        const unit = scheduleBlock ? units.find(u => u.id === scheduleBlock.unitId) : null;
                        const isReceso = block.type === 'receso';
                        const blockConflicts = conflicts[cellKey] || { teacherConflict: false, environmentConflict: false };
                        const isSuggestion = suggestion?.suggestedKeys.includes(cellKey);
                        const isSuggestionOrigin = suggestion?.originKey === cellKey;

                        return (
                            <div 
                                key={cellKey} 
                                className={cn(
                                    `border h-36 p-1`,
                                    isReceso 
                                        ? 'bg-muted/60' 
                                        : 'bg-background hover:bg-muted/50 transition-colors',
                                    isSuggestion && 'border-dashed border-2 border-primary bg-primary/10'
                                )}
                                onDragOver={!isReceso ? handleDragOver : undefined}
                                onDrop={!isReceso ? (e) => handleDrop(e, day, block.startTime) : undefined}
                            >
                               {isReceso ? (
                                    <div className="flex items-center justify-center h-full text-muted-foreground text-xs font-semibold">
                                        {block.label || 'Receso'}
                                    </div>
                                ) : scheduleBlock && unit ? (
                                     <ScheduleBlockCard 
                                        block={scheduleBlock} 
                                        unit={unit} 
                                        teachers={teachers}
                                        environments={environments}
                                        conflicts={blockConflicts}
                                        isSuggestionOrigin={isSuggestionOrigin}
                                        onRemove={() => removeBlock(day, block.startTime)}
                                        onUpdate={(data) => updateBlock(cellKey, data)}
                                        onAcceptSuggestion={handleAcceptSuggestion}
                                        onRejectSuggestion={handleRejectSuggestion}
                                    />
                                ) : null}
                            </div>
                        )
                    })}
                </React.Fragment>
            ))}
        </>
    )
}
