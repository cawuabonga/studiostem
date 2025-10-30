
"use client";

import React from 'react';
import type { ScheduleBlock } from '@/types';
import { cn } from '@/lib/utils';
import { Lock } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface OccupiedBlockCardProps {
    block: ScheduleBlock;
}

export function OccupiedBlockCard({ block }: OccupiedBlockCardProps) {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className={cn(
                        "h-full w-full bg-gray-100 dark:bg-gray-800 border border-dashed border-gray-400 rounded-md p-1.5 text-xs flex flex-col justify-center items-center text-center text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    )}>
                        <Lock className="h-5 w-5 mb-1"/>
                        <p className="font-semibold leading-tight">Ocupado por otro programa</p>
                    </div>
                </TooltipTrigger>
                 <TooltipContent>
                    <p className="font-bold">Programa: {block.programId}</p>
                    <p>Unidad: {block.unitId}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
