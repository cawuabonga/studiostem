
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import type { Unit } from '@/types';
import { getUnit } from '@/config/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IndicatorsManager } from '@/components/indicators/IndicatorsManager';
import { WeeklyPlanner } from '@/components/planning/WeeklyPlanner';
import { NotebookText, CalendarDays, Percent, CalendarCheck, FileText, ArrowLeft } from 'lucide-react';
import { GradebookManager } from '@/components/grades/GradebookManager';
import { AttendanceManager } from '@/components/attendance/AttendanceManager';
import { SyllabusManager } from '@/components/syllabus/SyllabusManager';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';

type ActiveView = 'menu' | 'syllabus' | 'indicators' | 'planning' | 'attendance' | 'grades';

const moduleConfig = [
    { id: 'syllabus', title: 'Sílabo', icon: FileText, description: 'Edita la información general del sílabo y genera el documento para imprimir.', component: SyllabusManager },
    { id: 'indicators', title: 'Indicadores de Logro', icon: NotebookText, description: 'Define los indicadores de logro que los estudiantes deben alcanzar.', component: IndicatorsManager },
    { id: 'planning', title: 'Planificación Semanal', icon: CalendarDays, description: 'Organiza contenidos, actividades y tareas para cada semana.', component: WeeklyPlanner },
    { id: 'attendance', title: 'Registro de Asistencias', icon: CalendarCheck, description: 'Lleva el control de la asistencia de los estudiantes matriculados.', component: AttendanceManager },
    { id: 'grades', title: 'Registro de Calificaciones', icon: Percent, description: 'Ingresa y gestiona las calificaciones de los estudiantes por indicador.', component: GradebookManager },
] as const;


export default function UnitManagementPage() {
    const { instituteId } = useAuth();
    const pathname = usePathname();
    const unitId = pathname.split('/').pop() || '';
    
    const [unit, setUnit] = useState<Unit | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeView, setActiveView] = useState<ActiveView>('menu');

    const fetchUnitDetails = useCallback(async (id: string) => {
        if (!instituteId || !id) {
            setLoading(false);
            setError("Faltan datos para cargar la unidad.");
            return;
        }

        try {
            setLoading(true);
            const unitData = await getUnit(instituteId, id);
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
        if (unitId) {
            fetchUnitDetails(unitId);
        }
    }, [unitId, fetchUnitDetails]);

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
    
    const renderContent = () => {
        if (activeView === 'menu') {
            return (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {moduleConfig.map((module) => (
                        <Card 
                            key={module.id} 
                            onClick={() => setActiveView(module.id as ActiveView)}
                            className="flex flex-col cursor-pointer hover:bg-muted/50 transition-colors"
                        >
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-lg font-medium">{module.title}</CardTitle>
                                <module.icon className="h-6 w-6 text-muted-foreground" />
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <p className="text-sm text-muted-foreground">{module.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            );
        }

        const selectedModule = moduleConfig.find(m => m.id === activeView);
        if (!selectedModule) return null;

        const Component = selectedModule.component;
        // The WeeklyPlanner component has a different prop structure
        const componentProps = selectedModule.id === 'planning' ? { unit, isStudentView: false } : { unit };

        return (
            <div>
                <Button variant="ghost" onClick={() => setActiveView('menu')} className="mb-4 no-print">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver al menú de la unidad
                </Button>
                <Component {...componentProps as any} />
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <Card className="no-print">
                <CardHeader>
                    <CardTitle className="text-2xl">{unit.name}</CardTitle>
                    <CardDescription>
                        Código: {unit.code} | {unit.credits} Créditos | {unit.totalHours} Horas | {unit.totalWeeks} Semanas
                    </CardDescription>
                </CardHeader>
                 {activeView === 'menu' && (
                    <CardContent>
                        <p className="text-muted-foreground">Selecciona un módulo para empezar a gestionar la unidad didáctica.</p>
                    </CardContent>
                )}
            </Card>

            {renderContent()}
        </div>
    );
}
