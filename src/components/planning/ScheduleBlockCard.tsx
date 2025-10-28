
"use client";

import React from 'react';
import type { ScheduleBlock, Unit, Teacher, Environment } from '@/types';
import { Button } from '../ui/button';
import { X, User, Home, ChevronsUpDown, AlertTriangle } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { cn } from '@/lib/utils';

interface ScheduleBlockCardProps {
    block: ScheduleBlock;
    unit: Unit;
    teachers: Teacher[];
    environments: Environment[];
    conflicts: { teacherConflict: boolean; environmentConflict: boolean };
    onRemove: () => void;
    onUpdate: (data: Partial<ScheduleBlock>) => void;
}

const Combobox = ({ items, selectedValue, onSelect, placeholder, icon: Icon, hasConflict }: { items: {value: string, label: string}[], selectedValue?: string, onSelect: (value: string) => void, placeholder: string, icon: React.ElementType, hasConflict: boolean }) => {
    const [open, setOpen] = React.useState(false);
    const selectedLabel = items.find(item => item.value === selectedValue)?.label || placeholder;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" role="combobox" className={cn("w-full justify-start text-xs h-7 px-2 font-normal", hasConflict && "bg-destructive/20 text-destructive-foreground hover:bg-destructive/30")}>
                    <Icon className="mr-2 h-3.5 w-3.5 shrink-0" />
                    <span className="truncate flex-1">{selectedLabel}</span>
                    <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[--radix-popover-trigger-width]">
                <Command>
                    <CommandInput placeholder={`Buscar ${placeholder.toLowerCase()}...`} />
                    <CommandList>
                        <CommandEmpty>No encontrado.</CommandEmpty>
                        <CommandGroup>
                            {items.map(item => (
                                <CommandItem key={item.value} value={item.label} onSelect={() => { onSelect(item.value); setOpen(false); }}>
                                    {item.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

export function ScheduleBlockCard({ block, unit, teachers, environments, conflicts, onRemove, onUpdate }: ScheduleBlockCardProps) {

    const teacherOptions = teachers.map(t => ({ value: t.documentId, label: t.fullName }));
    const environmentOptions = environments.map(e => ({ value: e.id, label: e.name }));
    const hasAnyConflict = conflicts.teacherConflict || conflicts.environmentConflict;

    return (
        <div className={cn(
            "h-full w-full bg-primary/10 border border-primary/30 rounded-md p-1.5 text-xs relative flex flex-col justify-between",
            hasAnyConflict && "border-destructive border-2 bg-destructive/10"
        )}>
            <div>
                <div className="flex justify-between items-start">
                    <p className={cn("font-bold text-primary leading-tight flex-1 pr-4", hasAnyConflict && "text-destructive")}>{unit.name}</p>
                    {hasAnyConflict && (
                         <AlertTriangle className="h-4 w-4 text-destructive absolute top-1 right-6" />
                    )}
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
                 <Badge variant="secondary" className="text-xs mt-1">
                    {unit.code} | {unit.turno}
                 </Badge>
            </div>
            <div className="space-y-1 mt-1">
                <Combobox 
                    items={teacherOptions}
                    selectedValue={block.teacherId}
                    onSelect={(value) => onUpdate({ teacherId: value })}
                    placeholder="Asignar Docente"
                    icon={User}
                    hasConflict={conflicts.teacherConflict}
                />
                 <Combobox 
                    items={environmentOptions}
                    selectedValue={block.environmentId}
                    onSelect={(value) => onUpdate({ environmentId: value })}
                    placeholder="Asignar Ambiente"
                    icon={Home}
                    hasConflict={conflicts.environmentConflict}
                />
            </div>
        </div>
    );
}
