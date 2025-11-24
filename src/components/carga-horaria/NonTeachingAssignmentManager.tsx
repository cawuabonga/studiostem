
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { NonTeachingActivity, NonTeachingAssignment, UnitPeriod, Unit, Assignment } from '@/types';
import { getNonTeachingActivities, getNonTeachingAssignments, saveNonTeachingAssignmentsForTeacher } from '@/config/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TeacherWorkloadSummary } from './TeacherWorkloadSummary';

interface NonTeachingAssignmentManagerProps {
    instituteId: string;
    teacherId: string;
    year: string;
    period: UnitPeriod;
    allUnits: Unit[];
    allAssignments: { 'MAR-JUL': Assignment; 'AGO-DIC': Assignment };
}

export function NonTeachingAssignmentManager({ instituteId, teacherId, year, period, allUnits, allAssignments }: NonTeachingAssignmentManagerProps) {
    const { toast } = useToast();
    const [existingAssignments, setExistingAssignments] = useState<NonTeachingAssignment[]>([]);
    const [allActivities, setAllActivities] = useState<NonTeachingActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // State to manage hours for each activity ID
    const [activityHours, setActivityHours] = useState<Record<string, number>>({});

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [fetchedAssignments, fetchedActivities] = await Promise.all([
                getNonTeachingAssignments(instituteId, teacherId, year, period),
                getNonTeachingActivities(instituteId)
            ]);
            setExistingAssignments(fetchedAssignments);
            setAllActivities(fetchedActivities.filter(a => a.isActive));

            // Initialize activityHours state from existing assignments
            const initialHours: Record<string, number> = {};
            fetchedAssignments.forEach(a => {
                initialHours[a.activityId] = a.assignedHours;
            });
            setActivityHours(initialHours);

        } catch (error) {
            toast({ title: "Error", description: "No se pudieron cargar las asignaciones.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [instituteId, teacherId, year, period, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleHourChange = (activityId: string, value: string) => {
        const hours = parseFloat(value);
        setActivityHours(prev => ({
            ...prev,
            [activityId]: isNaN(hours) ? 0 : hours,
        }));
    };

    const handleSave = async () => {
        setIsSubmitting(true);
        try {
            const assignmentsToSave: Omit<NonTeachingAssignment, 'id'>[] = Object.entries(activityHours)
                .filter(([, hours]) => hours > 0)
                .map(([activityId, assignedHours]) => {
                    const activity = allActivities.find(a => a.id === activityId);
                    return {
                        teacherId,
                        year,
                        period,
                        activityId,
                        activityName: activity?.name || 'Actividad Desconocida',
                        assignedHours,
                    };
                });

            await saveNonTeachingAssignmentsForTeacher(instituteId, teacherId, year, period, assignmentsToSave);
            toast({ title: "Éxito", description: "Las asignaciones de horas no lectivas se han guardado." });
            fetchData(); // Refresh data to get consistent state
        } catch (error: any) {
            toast({ title: "Error al Guardar", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };
    
     const { teachingHours, nonTeachingHours } = useMemo(() => {
        const periodAssignments = allAssignments[period] || {};
        const unitMap = new Map(allUnits.map(u => [u.id, u]));
        
        let calculatedTeachingHours = 0;
        for(const unitId in periodAssignments) {
            if (periodAssignments[unitId] === teacherId) {
                const unit = unitMap.get(unitId);
                if (unit && unit.period === period) {
                    calculatedTeachingHours += (unit.theoreticalHours || 0) + (unit.practicalHours || 0);
                }
            }
        }
        
        // Use the live state for non-teaching hours
        const calculatedNonTeachingHours = Object.values(activityHours).reduce((acc, curr) => acc + (curr || 0), 0);

        return { teachingHours: calculatedTeachingHours, nonTeachingHours: calculatedNonTeachingHours };

    }, [allAssignments, allUnits, period, teacherId, activityHours]);


    if (loading) {
        return <Skeleton className="h-64 w-full" />;
    }

    return (
        <>
            <TeacherWorkloadSummary
                teachingHours={teachingHours}
                nonTeachingHours={nonTeachingHours}
            />
            <Card>
                <CardHeader>
                    <CardTitle>Asignar Horas No Lectivas</CardTitle>
                    <CardDescription>
                        Ingrese las horas semanales para cada actividad no lectiva. Deje en 0 o vacío si no corresponde.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Actividad No Lectiva</TableHead>
                                    <TableHead className="text-right w-[200px]">Horas Semanales Asignadas</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {allActivities.length > 0 ? (
                                    allActivities.map(activity => (
                                        <TableRow key={activity.id}>
                                            <TableCell className="font-medium">
                                                <Label htmlFor={`hours-${activity.id}`}>{activity.name}</Label>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                 <Input
                                                    id={`hours-${activity.id}`}
                                                    type="number"
                                                    step="0.5"
                                                    min="0"
                                                    placeholder="0"
                                                    className="w-24 ml-auto text-right"
                                                    value={activityHours[activity.id] || ''}
                                                    onChange={(e) => handleHourChange(activity.id, e.target.value)}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={2} className="h-24 text-center">No hay actividades no lectivas activas. Adminístrelas en el módulo de gestión académica.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                 <CardFooter className="flex justify-end">
                    <Button onClick={handleSave} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Guardar Cambios
                    </Button>
                </CardFooter>
            </Card>
        </>
    );
}
