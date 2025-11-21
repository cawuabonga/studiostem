
"use client";

import React from 'react';
import type { Teacher } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Progress } from '../ui/progress';
import { cn } from '@/lib/utils';
import { BookOpen, Clipboard } from 'lucide-react';

interface TeacherLoad {
    teacher: Teacher;
    teachingHours: number;
    nonTeachingHours: number;
    totalHours: number;
}

interface TeacherWorkloadListProps {
    teacherWorkloads: TeacherLoad[];
}

const getStatusColor = (hours: number): string => {
    if (hours > 21) return 'bg-red-500';
    if (hours >= 18) return 'bg-green-500';
    return 'bg-yellow-500';
};

const WorkloadBar = ({ title, hours, icon: Icon }: { title: string, hours: number, icon: React.ElementType }) => {
    // We adjust the progress bar logic to be relative to a standard 20-hour load per category for visual balance.
    const progress = (hours / 20) * 100; 
    return (
        <div>
            <div className="flex items-center justify-between mb-1">
                 <div className="flex items-center gap-2 text-sm font-medium">
                    <Icon className="h-4 w-4 text-muted-foreground"/>
                    <span>{title}</span>
                </div>
                <span className={cn("font-bold", hours > 21 && "text-destructive")}>{hours}h</span>
            </div>
            <Progress value={progress} indicatorClassName={getStatusColor(hours)} />
        </div>
    );
};


export function TeacherWorkloadList({ teacherWorkloads }: TeacherWorkloadListProps) {
    
    if (teacherWorkloads.length === 0) {
        return (
            <div className="py-10 text-center text-muted-foreground">
                <p>No hay docentes para mostrar en este programa y período.</p>
            </div>
        )
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Carga Horaria de Docentes</CardTitle>
                <CardDescription>
                    Resumen de horas lectivas y no lectivas para cada docente en el período seleccionado.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[70vh] overflow-y-auto">
                {teacherWorkloads.map(load => (
                     <div key={load.teacher.documentId} className={cn("p-4 border rounded-lg flex flex-col md:flex-row items-start md:items-center gap-4", load.totalHours > 44 && "bg-destructive/10 border-destructive")}>
                        <div className="flex items-center gap-3 w-full md:w-1/3">
                            <Avatar className="h-10 w-10 text-sm">
                                <AvatarFallback>{load.teacher.fullName ? load.teacher.fullName.charAt(0) : '?'}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold text-base">{load.teacher.fullName}</p>
                                <p className="text-xs text-muted-foreground">{load.teacher.documentId}</p>
                            </div>
                        </div>
                        <div className="flex-1 w-full space-y-3">
                           <WorkloadBar title="Horas Lectivas" hours={load.teachingHours} icon={BookOpen} />
                           <WorkloadBar title="Horas No Lectivas" hours={load.nonTeachingHours} icon={Clipboard} />
                        </div>
                         <div className="text-right w-full md:w-auto md:pl-4">
                            <p className="text-xs text-muted-foreground">Total</p>
                            <p className={cn("text-2xl font-bold", load.totalHours > 44 && "text-destructive")}>{load.totalHours}h</p>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
