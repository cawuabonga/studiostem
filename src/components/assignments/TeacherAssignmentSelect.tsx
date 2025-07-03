
"use client";

import * as React from "react"
import { ChevronsUpDown } from "lucide-react"

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
import type { Teacher } from "@/types"

interface TeacherAssignmentSelectProps {
    teachers: Teacher[];
    onAssign: (teacherId: string) => void;
}

export function TeacherAssignmentSelect({ teachers, onAssign }: TeacherAssignmentSelectProps) {
    const [open, setOpen] = React.useState(false)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-[180px] justify-between"
                >
                    Asignar a...
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
                <Command>
                    <CommandInput placeholder="Buscar docente..." />
                    <CommandList>
                        <CommandEmpty>No se encontró docente.</CommandEmpty>
                        <CommandGroup>
                            {teachers.map((teacher) => (
                                <CommandItem
                                    key={teacher.id}
                                    value={teacher.fullName} // This is used for searching
                                    onSelect={() => {
                                        onAssign(teacher.id)
                                        setOpen(false)
                                    }}
                                >
                                    {teacher.fullName}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
