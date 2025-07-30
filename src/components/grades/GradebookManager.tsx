
"use client";

import React from 'react';
import type { Unit } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Construction } from 'lucide-react';

interface GradebookManagerProps {
    unit: Unit;
}

export function GradebookManager({ unit }: GradebookManagerProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Registro de Calificaciones</CardTitle>
                <CardDescription>
                    Gestiona las calificaciones, promedios por indicador y el promedio final de los estudiantes en la unidad: {unit.name}.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Alert>
                    <Construction className="h-4 w-4" />
                    <AlertTitle>¡En Construcción!</AlertTitle>
                    <AlertDescription>
                        El módulo para gestionar las calificaciones y los promedios estará disponible próximamente.
                    </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
    );
}
