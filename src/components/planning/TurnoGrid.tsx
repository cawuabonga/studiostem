
"use client";

import React from 'react';
import type { ScheduleBlock, TimeBlock, Unit, Teacher, Environment } from '@/types';
import { ScheduleBlockCard } from './ScheduleBlockCard';

const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

export const TurnoGrid = ({
    turno,
    timeBlocks,
    schedule,
    units,
    teachers,
    environments,
    handleDrop,
    handleDragOver,
    removeBlock,
    updateBlock,
}: {
    turno: string,
    timeBlocks: TimeBlock[],
    schedule: Record<string, ScheduleBlock>,
    units: Unit[],
    teachers: Teacher[],
    environments: Environment[],
    handleDrop: (e: React.DragEvent<HTMLDivElement>, day: string, hour: string) => void,
    handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void,
    removeBlock: (day: string, hour: string) => void,
    updateBlock: (key: string, data: Partial<ScheduleBlock>) => void,
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

                        return (
                            <div 
                                key={cellKey} 
                                className={`border h-36 p-1 ${isReceso ? 'bg-muted/60' : 'bg-background hover:bg-muted/50 transition-colors'}`}
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
                                        onRemove={() => removeBlock(day, block.startTime)}
                                        onUpdate={(data) => updateBlock(cellKey, data)}
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
