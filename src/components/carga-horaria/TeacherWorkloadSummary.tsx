
"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, BookOpen, Clipboard, AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface TeacherWorkloadSummaryProps {
    teachingHours: number;
    nonTeachingHours: number;
}

export function TeacherWorkloadSummary({ teachingHours, nonTeachingHours }: TeacherWorkloadSummaryProps) {
    const totalHours = teachingHours + nonTeachingHours;
    const progress = Math.min((totalHours / 40) * 100, 100);

    const getStatusColor = (hours: number) => {
        if (hours > 40) return 'text-destructive';
        if (hours === 40) return 'text-green-600';
        return 'text-amber-600';
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Resumen de Carga Horaria</CardTitle>
                <CardDescription>Carga horaria semanal para el docente en el período seleccionado.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-muted rounded-lg">
                        <BookOpen className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                        <p className="text-2xl font-bold">{teachingHours}</p>
                        <p className="text-sm text-muted-foreground">Horas Lectivas</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                        <Clipboard className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                        <p className="text-2xl font-bold">{nonTeachingHours}</p>
                        <p className="text-sm text-muted-foreground">Horas No Lectivas</p>
                    </div>
                    <div className={cn("p-4 rounded-lg", getStatusColor(totalHours), totalHours > 40 ? 'bg-destructive/10' : 'bg-muted')}>
                        <Clock className="h-6 w-6 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{totalHours}</p>
                        <p className="text-sm">Total de Horas Semanales</p>
                    </div>
                </div>
                 <div>
                    <div className="flex justify-between items-center mb-1">
                        <p className="text-sm text-muted-foreground">Progreso de Carga Semanal</p>
                        <p className={cn("text-sm font-bold", getStatusColor(totalHours))}>
                            {totalHours > 40 && <AlertTriangle className="inline-block h-4 w-4 mr-1"/>}
                            {totalHours} / 40 horas
                        </p>
                    </div>
                    <Progress value={progress} indicatorClassName={totalHours > 40 ? 'bg-destructive' : ''} />
                </div>
            </CardContent>
        </Card>
    );
}
