"use client";

import React from 'react';
import type { Teacher } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserX } from 'lucide-react';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { cn } from '@/lib/utils';

interface TeacherLoad {
    teacher: Teacher;
    totalHours: number;
}

interface FullTeachersListProps {
    teachers: TeacherLoad[];
}

export function FullTeachersList({ teachers }: FullTeachersListProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <UserX className="h-6 w-6 text-destructive" />
                    <CardTitle>Docentes con Carga Completa ({teachers.length})</CardTitle>
                </div>
                <CardDescription>
                    Listado de docentes con 18 o más horas semanales asignadas.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[60vh] overflow-y-auto">
                {teachers.length > 0 ? teachers.map(load => {
                    return (
                        <div key={load.teacher.documentId} className="p-3 border rounded-md bg-background flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8 text-xs">
                                    <AvatarFallback>{load.teacher.fullName ? load.teacher.fullName.charAt(0) : '?'}</AvatarFallback>
                                </Avatar>
                                <p className="font-semibold text-sm">{load.teacher.fullName}</p>
                            </div>
                            <div className="text-right">
                                <span className={cn("font-bold text-lg", load.totalHours > 21 ? 'text-destructive' : 'text-amber-600')}>{load.totalHours}h</span>
                                <p className="text-xs text-muted-foreground">/ 18h</p>
                            </div>
                        </div>
                    )
                }) : (
                     <p className="text-sm text-center text-muted-foreground py-10">
                        Aún no hay docentes con carga completa para este período y programa.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
