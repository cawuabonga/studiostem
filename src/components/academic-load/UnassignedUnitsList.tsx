"use client";

import React from 'react';
import type { Unit } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Badge } from '../ui/badge';

interface UnassignedUnitsListProps {
    units: Unit[];
}

export function UnassignedUnitsList({ units }: UnassignedUnitsListProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <AlertCircle className="h-6 w-6 text-destructive" />
                    <CardTitle>Unidades No Asignadas ({units.length})</CardTitle>
                </div>
                <CardDescription>
                    Estas unidades necesitan que se les asigne un docente.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[60vh] overflow-y-auto">
                {units.length > 0 ? units.map(unit => (
                    <div key={unit.id} className="p-3 border rounded-md bg-muted/50 flex justify-between items-center">
                        <div>
                            <p className="font-semibold text-sm">{unit.name}</p>
                            <p className="text-xs text-muted-foreground">{unit.code}</p>
                        </div>
                        <Badge variant="outline">Sem. {unit.semester}</Badge>
                    </div>
                )) : (
                    <p className="text-sm text-center text-muted-foreground py-10">
                        ¡Felicidades! Todas las unidades de este período y programa están asignadas.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
