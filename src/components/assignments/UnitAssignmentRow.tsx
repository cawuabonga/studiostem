"use client";

import * as React from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { Unit, Teacher, UnitPeriod } from "@/types";
import { Badge } from "../ui/badge";

interface UnitAssignmentRowProps {
  unit: Unit;
  teachers: Teacher[];
  period: UnitPeriod;
  selectedTeacherId: string;
  isSaving: boolean;
  onAssignmentChange: (teacherId: string) => void;
}

export function UnitAssignmentRow({ unit, teachers, period, selectedTeacherId, isSaving, onAssignmentChange }: UnitAssignmentRowProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (currentValue: string) => {
    const finalValue = currentValue === selectedTeacherId || currentValue === "unassigned" ? "" : currentValue
    onAssignmentChange(finalValue);
    setOpen(false)
  };
  
  const selectedTeacherName = teachers.find(
      (teacher) => teacher.documentId === selectedTeacherId
    )?.fullName || "Sin asignar";

  return (
    <div className="flex items-center justify-between rounded-md border bg-card p-3 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 flex-1 pr-4">
        <span className="text-sm font-medium flex-1">{unit.name}</span>
        <div className="flex items-center gap-2 mt-1 sm:mt-0">
            <Badge variant="outline">{unit.totalHours}h</Badge>
            <Badge variant="outline">{unit.turno}</Badge>
        </div>
      </div>
      <div className="w-56 flex items-center gap-2">
         {isSaving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
         <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between h-8 text-xs font-normal"
              disabled={isSaving}
            >
              <span className="truncate">
                {selectedTeacherName}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
            <Command>
              <CommandInput placeholder="Buscar docente..." />
              <CommandList>
                <CommandEmpty>No se encontró docente.</CommandEmpty>
                <CommandGroup>
                   <CommandItem
                      key="unassigned"
                      value="Sin asignar"
                      onSelect={() => handleSelect("unassigned")}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedTeacherId === '' ? "opacity-100" : "opacity-0"
                        )}
                      />
                      Sin asignar
                    </CommandItem>
                  {teachers.map((teacher) => (
                    <CommandItem
                      key={teacher.id}
                      value={teacher.fullName}
                      onSelect={(currentValue) => handleSelect(teacher.documentId)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedTeacherId === teacher.documentId ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {teacher.fullName}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
