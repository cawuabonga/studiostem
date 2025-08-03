

"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import type { Unit } from '@/types';
import { getUnit } from '@/config/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IndicatorsManager } from '@/components/indicators/IndicatorsManager';
import { WeeklyPlanner } from '@/components/planning/WeeklyPlanner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NotebookText, CalendarDays, Percent, CalendarCheck } from 'lucide-react';
import { GradebookManager } from '@/components/grades/GradebookManager';
import { AttendanceManager } from '@/components/attendance/AttendanceManager';

export default function UnitManagementPage({ params }: { params: { unitId: string } }) {
    const { user, instituteId } = useAuth();
    
    const [unit, setUnit] = useState<Unit | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUnitDetails = useCallback(async (unitId: string) => {
        if (!instituteId || !unitId) {
            setLoading(false);
            setError("Faltan datos para cargar la unidad.");
            return;
        }

        try {
            setLoading(true);
            const unitData = await getUnit(instituteId, unitId);
            if (unitData) {
                setUnit(unitData);
            } else {
                setError("No se encontró la unidad didáctica.");
            }
        } catch (err) {
            console.error("Error fetching unit details:", err);
            setError("Ocurrió un error al cargar los detalles de la unidad.");
        } finally {
            setLoading(false);
        }
    }, [instituteId]);

    useEffect(() => {
        if (params.unitId) {
            fetchUnitDetails(params.unitId);
        }
    }, [params.unitId, fetchUnitDetails]);

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (error) {
        return <p className="text-destructive text-center">{error}</p>;
    }

    if (!unit) {
        return <p className="text-center">Unidad no encontrada.</p>;
    }

    const isTeacher = user?.role === 'Teacher';
    const isStudent = user?.role === 'Student';

    const TeacherView = () => (
         <Tabs defaultValue="indicators" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="indicators">
                    <NotebookText className="mr-2 h-4 w-4" />
                    Indicadores de Logro
                </TabsTrigger>
                <TabsTrigger value="planning">
                    <CalendarDays className="mr-2 h-4 w-4" />
                    Planificación Semanal
                </TabsTrigger>
                <TabsTrigger value="attendance">
                    <CalendarCheck className="mr-2 h-4 w-4" />
                    Registro de Asistencias
                </TabsTrigger>
                <TabsTrigger value="grades">
                    <Percent className="mr-2 h-4 w-4" />
                    Registro de Calificaciones
                </TabsTrigger>
            </TabsList>
            <TabsContent value="indicators">
                <IndicatorsManager unit={unit} />
            </TabsContent>
            <TabsContent value="planning">
                <WeeklyPlanner unit={unit} isStudentView={false} />
            </TabsContent>
             <TabsContent value="attendance">
                <AttendanceManager unit={unit} />
            </TabsContent>
            <TabsContent value="grades">
                <GradebookManager unit={unit} />
            </TabsContent>
        </Tabs>
    );

    const StudentView = () => (
         <WeeklyPlanner unit={unit} isStudentView={true} />
    );

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">{unit.name}</CardTitle>
                    <CardDescription>
                        Código: {unit.code} | {unit.credits} Créditos | {unit.totalHours} Horas | {unit.totalWeeks} Semanas
                    </CardDescription>
                </CardHeader>
            </Card>
            
            {isTeacher && <TeacherView />}
            {isStudent && <StudentView />}

            {!isTeacher && !isStudent && (
                 <p className="text-center text-muted-foreground">Vista no disponible para tu rol.</p>
            )}
        </div>
    );
}
