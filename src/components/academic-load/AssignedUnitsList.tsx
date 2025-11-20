"use client";

import React from 'react';
import type { Unit, Assignment } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';

interface AssignedUnitsListProps {
    units: Unit[];
    assignments: Assignment;
    staffMap: Map<string, string>; // Map from documentId to displayName
}

export function AssignedUnitsList({ units, assignments, staffMap }: AssignedUnitsListProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <CardTitle>Unidades Asignadas ({units.length})</CardTitle>
                </div>
                <CardDescription>
                    Listado de unidades que ya tienen un docente a cargo.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[60vh] overflow-y-auto">
                {units.length > 0 ? units.map(unit => {
                    const teacherId = assignments[unit.id];
                    const teacherName = teacherId ? staffMap.get(teacherId) : 'Docente no encontrado';
                    return (
                        <div key={unit.id} className="p-3 border rounded-md bg-background flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-sm">{unit.name}</p>
                                <p className="text-xs text-muted-foreground">{unit.code}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-right">{teacherName || '...'}</span>
                                <Avatar className="h-6 w-6 text-xs">
                                    <AvatarFallback>{teacherName ? teacherName.charAt(0) : '?'}</AvatarFallback>
                                </Avatar>
                            </div>
                        </div>
                    )
                }) : (
                     <p className="text-sm text-center text-muted-foreground py-10">
                        Aún no hay unidades asignadas para este período y programa.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
