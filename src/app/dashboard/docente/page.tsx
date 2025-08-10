
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { getUnits, getAssignments, getPrograms, updateUnitImage } from "@/config/firebase";
import type { Unit, Program } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UnitCard } from '@/components/teacher/UnitCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface AssignedUnit extends Unit {
    programName: string;
}

export default function TeacherDashboardPage() {
    const { user, instituteId } = useAuth();
    const { toast } = useToast();
    const [assignedUnits, setAssignedUnits] = useState<AssignedUnit[]>([]);
    const [loading, setLoading] = useState(true);
    const [imageLoadingId, setImageLoadingId] = useState<string | null>(null);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

    const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());
    
    const fetchAssignedUnits = useCallback(async () => {
         if (!instituteId || !user?.documentId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const [allPrograms, allUnits] = await Promise.all([
                getPrograms(instituteId),
                getUnits(instituteId)
            ]);

            const programMap = new Map(allPrograms.map(p => [p.id, p]));
            const unitMap = new Map(allUnits.map(u => [u.id, u]));
            
            const assignmentPromises = allPrograms.map(p => getAssignments(instituteId, selectedYear, p.id));
            const assignmentResults = await Promise.all(assignmentPromises);

            const unitsForTeacher: AssignedUnit[] = [];

            assignmentResults.forEach(programAssignment => {
                for (const period in programAssignment) {
                    for (const unitId in programAssignment[period as keyof typeof programAssignment]) {
                        const teacherId = programAssignment[period as keyof typeof programAssignment][unitId];
                        if (teacherId === user.documentId) {
                            const unit = unitMap.get(unitId);
                            if (unit) {
                                const program = programMap.get(unit.programId);
                                unitsForTeacher.push({
                                    ...unit,
                                    programName: program?.name || "Programa desconocido",
                                });
                            }
                        }
                    }
                }
            });
            
            // Sort units by period then name
            const sortedUnits = unitsForTeacher.sort((a, b) => {
                if (a.period > b.period) return -1;
                if (a.period < b.period) return 1;
                return a.name.localeCompare(b.name);
            });


            setAssignedUnits(sortedUnits);

        } catch (error) {
            console.error("Error fetching assigned units:", error);
            toast({
                title: "Error",
                description: "No se pudieron cargar tus unidades didácticas asignadas.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [instituteId, user?.documentId, toast, selectedYear]);

    useEffect(() => {
        fetchAssignedUnits();
    }, [fetchAssignedUnits]);
    
    const handleRegenerateImage = async (unit: Unit) => {
        if (!instituteId) return;
        setImageLoadingId(unit.id);
        try {
            await updateUnitImage(instituteId, unit.id, unit.name);
            toast({ title: 'Imagen Generada', description: `Se ha generado una nueva imagen para ${unit.name}`});
            fetchAssignedUnits(); // Refetch to get the new URL
        } catch (error) {
            toast({ title: 'Error', description: 'No se pudo generar la imagen.', variant: 'destructive' });
        } finally {
            setImageLoadingId(null);
        }
    }


    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-12 w-1/2" />
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
            </div>
        );
    }
    
    const unitsMarJul = assignedUnits.filter(u => u.period === 'MAR-JUL');
    const unitsAgoDic = assignedUnits.filter(u => u.period === 'AGO-DIC');

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div>
                            <CardTitle>Mis Unidades Didácticas Asignadas</CardTitle>
                            <CardDescription>
                                Estas son las unidades que tienes a tu cargo. Selecciona una para gestionarla.
                            </CardDescription>
                        </div>
                         <div className="w-full sm:w-48 space-y-2">
                            <Label htmlFor="year-select">Seleccionar Año</Label>
                            <Select value={selectedYear} onValueChange={setSelectedYear}>
                                <SelectTrigger id="year-select">
                                    <SelectValue placeholder="Seleccione un año" />
                                </SelectTrigger>
                                <SelectContent>
                                    {years.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {assignedUnits.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No tienes unidades didácticas asignadas para el año {selectedYear}.</p>
            ) : (
                <>
                    {unitsMarJul.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-2xl font-bold">Período MAR-JUL {selectedYear}</h2>
                             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {unitsMarJul.map(unit => <UnitCard key={unit.id} unit={unit} onRegenerateImage={handleRegenerateImage} isImageLoading={imageLoadingId === unit.id} />)}
                            </div>
                        </div>
                    )}

                     {unitsAgoDic.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-2xl font-bold">Período AGO-DIC {selectedYear}</h2>
                             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {unitsAgoDic.map(unit => <UnitCard key={unit.id} unit={unit} onRegenerateImage={handleRegenerateImage} isImageLoading={imageLoadingId === unit.id} />)}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
