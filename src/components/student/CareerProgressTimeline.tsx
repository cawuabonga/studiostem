
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getPrograms, getMatriculationsForStudent } from '@/config/firebase';
import type { Program, Matriculation } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, CircleDot, Circle, Milestone } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type SemesterStatus = 'Completado' | 'En Curso' | 'Pendiente';

interface SemesterInfo {
    semester: number;
    status: SemesterStatus;
    unitsTaken: number;
}

export function CareerProgressTimeline() {
    const { user, instituteId } = useAuth();
    const [program, setProgram] = useState<Program | null>(null);
    const [matriculations, setMatriculations] = useState<Matriculation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!instituteId || !user?.documentId) {
                setLoading(false);
                return;
            }
            try {
                const [allPrograms, studentMatriculations] = await Promise.all([
                    getPrograms(instituteId),
                    getMatriculationsForStudent(instituteId, user.documentId)
                ]);
                
                const studentProfile = user as any; // Assuming user object might have programId
                const studentProgram = allPrograms.find(p => p.id === studentProfile.programId);
                
                setProgram(studentProgram || null);
                setMatriculations(studentMatriculations);

            } catch (error) {
                console.error("Error fetching career progress data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [instituteId, user]);

    const timelineData = useMemo(() => {
        if (!program) return [];
        
        const semesterMap = new Map<number, { status: 'aprobado' | 'cursando', unitsTaken: number }>();
        
        matriculations.forEach(m => {
            const current = semesterMap.get(m.semester) || { status: 'aprobado', unitsTaken: 0 };
            current.unitsTaken++;
            // If any unit is still 'cursando', the whole semester is 'en curso'
            if (m.status === 'cursando') {
                current.status = 'cursando';
            }
            semesterMap.set(m.semester, current);
        });

        const totalSemesters = Number(program.duration.split(' ')[0]) || 6;
        const semesters: SemesterInfo[] = [];
        let highestInProgress = 0;

        for (let i = 1; i <= totalSemesters; i++) {
            const data = semesterMap.get(i);
            if (data) {
                if (data.status === 'cursando') {
                    semesters.push({ semester: i, status: 'En Curso', unitsTaken: data.unitsTaken });
                    highestInProgress = i;
                } else {
                    semesters.push({ semester: i, status: 'Completado', unitsTaken: data.unitsTaken });
                }
            } else {
                semesters.push({ semester: i, status: 'Pendiente', unitsTaken: 0 });
            }
        }
        
        // Ensure only the highest semester with 'cursando' units is marked as 'En Curso'
        return semesters.map(s => {
            if (s.status === 'En Curso' && s.semester < highestInProgress) {
                return { ...s, status: 'Completado' }; // Assume completed if a higher semester is in progress
            }
            return s;
        });

    }, [program, matriculations]);

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-4 w-3/4 mt-2" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-24 w-full" />
                </CardContent>
            </Card>
        );
    }

    if (!program) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Progreso de Carrera</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-center py-4">
                        No se encontró información de tu programa de estudios.
                    </p>
                </CardContent>
            </Card>
        );
    }

    const getStatusIcon = (status: SemesterStatus) => {
        switch (status) {
            case 'Completado': return <CheckCircle className="h-6 w-6 text-green-500" />;
            case 'En Curso': return <CircleDot className="h-6 w-6 text-blue-500 animate-pulse" />;
            case 'Pendiente': return <Circle className="h-6 w-6 text-muted-foreground" />;
            default: return <Milestone className="h-6 w-6" />;
        }
    }
     const getStatusColor = (status: SemesterStatus) => {
        switch (status) {
            case 'Completado': return 'bg-green-500';
            case 'En Curso': return 'bg-blue-500';
            case 'Pendiente': return 'bg-muted-foreground';
            default: return 'bg-muted';
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Mi Progreso de Carrera: {program.name}</CardTitle>
                <CardDescription>Línea de tiempo de tu avance en el programa de estudios.</CardDescription>
            </CardHeader>
            <CardContent>
                <TooltipProvider>
                    <div className="relative w-full py-4">
                        {/* Timeline bar for desktop */}
                        <div className="absolute top-1/2 left-0 w-full h-1 bg-muted rounded-full -translate-y-1/2 hidden md:block" />
                        
                        <div className="relative grid grid-cols-3 md:flex md:justify-between gap-y-8">
                            {timelineData.map((item, index) => (
                                <Tooltip key={item.semester}>
                                    <TooltipTrigger asChild>
                                        <div className="flex flex-col items-center z-10">
                                            {/* Status Icon */}
                                            <div className="bg-background p-1 rounded-full">
                                                 {getStatusIcon(item.status)}
                                            </div>
                                            {/* Semester Label */}
                                            <p className="mt-2 text-sm font-medium text-center">Semestre {item.semester}</p>
                                            {/* Connector line from main bar to icon - only for desktop */}
                                            <div className={cn(
                                                "absolute top-1/2 w-0.5 h-4 -translate-y-[calc(50%+1.25rem)] hidden md:block", 
                                                getStatusColor(item.status)
                                            )}></div>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="font-bold">{item.status}</p>
                                        {item.unitsTaken > 0 && (
                                             <p className="text-sm">{item.unitsTaken} unidades cursadas</p>
                                        )}
                                    </TooltipContent>
                                </Tooltip>
                            ))}
                        </div>
                    </div>
                </TooltipProvider>
            </CardContent>
        </Card>
    );
}
