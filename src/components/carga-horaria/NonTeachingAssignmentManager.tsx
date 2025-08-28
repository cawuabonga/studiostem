
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { NonTeachingActivity, NonTeachingAssignment, UnitPeriod, Teacher } from '@/types';
import { getNonTeachingActivities, getNonTeachingAssignments, addNonTeachingAssignment, updateNonTeachingAssignment, deleteNonTeachingAssignment } from '@/config/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface NonTeachingAssignmentManagerProps {
    instituteId: string;
    teacherId: string;
    year: string;
    period: UnitPeriod;
}

export function NonTeachingAssignmentManager({ instituteId, teacherId, year, period }: NonTeachingAssignmentManagerProps) {
    const { toast } = useToast();
    const [assignments, setAssignments] = useState<NonTeachingAssignment[]>([]);
    const [activities, setActivities] = useState<NonTeachingActivity[]>([]);
    const [loading, setLoading] = useState(true);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentAssignment, setCurrentAssignment] = useState<Partial<NonTeachingAssignment> | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [fetchedAssignments, fetchedActivities] = await Promise.all([
                getNonTeachingAssignments(instituteId, teacherId, year, period),
                getNonTeachingActivities(instituteId)
            ]);
            setAssignments(fetchedAssignments);
            setActivities(fetchedActivities.filter(a => a.isActive));
        } catch (error) {
            toast({ title: "Error", description: "No se pudieron cargar las asignaciones.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [instituteId, teacherId, year, period, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleOpenDialog = (assignment?: NonTeachingAssignment) => {
        setCurrentAssignment(assignment || { teacherId, year, period, activityId: '', assignedHours: 0 });
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!currentAssignment || !currentAssignment.activityId || (currentAssignment.assignedHours ?? 0) <= 0) {
            toast({ title: "Datos incompletos", description: "Seleccione una actividad y asigne horas válidas.", variant: "destructive" });
            return;
        }

        const selectedActivity = activities.find(a => a.id === currentAssignment.activityId);
        if (!selectedActivity) {
             toast({ title: "Error", description: "Actividad no válida.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            const assignmentData: Omit<NonTeachingAssignment, 'id'> = {
                teacherId: teacherId,
                year: year,
                period: period,
                activityId: selectedActivity.id,
                activityName: selectedActivity.name,
                assignedHours: currentAssignment.assignedHours!,
            };

            if (currentAssignment.id) {
                await updateNonTeachingAssignment(instituteId, currentAssignment.id, assignmentData);
                toast({ title: "Asignación Actualizada", description: "La asignación de horas no lectivas ha sido actualizada." });
            } else {
                await addNonTeachingAssignment(instituteId, assignmentData);
                toast({ title: "Asignación Creada", description: "Se ha añadido la nueva asignación de horas." });
            }
            fetchData();
            setIsDialogOpen(false);
        } catch (error: any) {
            toast({ title: "Error al Guardar", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleDelete = async (assignmentId: string) => {
        try {
            await deleteNonTeachingAssignment(instituteId, assignmentId);
            toast({ title: "Asignación Eliminada", description: "La asignación ha sido eliminada." });
            fetchData();
        } catch (error: any) {
            toast({ title: "Error al Eliminar", description: error.message, variant: "destructive" });
        }
    };

    if (loading) {
        return <Skeleton className="h-48 w-full" />;
    }

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Horas No Lectivas Asignadas</CardTitle>
                        <CardDescription>
                            Listado de actividades y horas asignadas para el docente y período seleccionados.
                        </CardDescription>
                    </div>
                    <Button onClick={() => handleOpenDialog()}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Asignar Actividad
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Actividad No Lectiva</TableHead>
                                    <TableHead className="text-right w-[150px]">Horas Asignadas</TableHead>
                                    <TableHead className="text-right w-[150px]">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {assignments.length > 0 ? (
                                    assignments.map(a => (
                                        <TableRow key={a.id}>
                                            <TableCell className="font-medium">{a.activityName}</TableCell>
                                            <TableCell className="text-right font-semibold">{a.assignedHours}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(a)}><Edit className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(a.id)}><Trash className="h-4 w-4" /></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center">No hay horas no lectivas asignadas.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{currentAssignment?.id ? 'Editar' : 'Nueva'} Asignación No Lectiva</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="activity">Actividad</Label>
                            <Select
                                value={currentAssignment?.activityId || ''}
                                onValueChange={(val) => setCurrentAssignment(p => ({...p!, activityId: val}))}
                            >
                                <SelectTrigger id="activity"><SelectValue placeholder="Seleccione una actividad..." /></SelectTrigger>
                                <SelectContent>
                                    {activities.map(act => <SelectItem key={act.id} value={act.id}>{act.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="hours">Horas Semanales Asignadas</Label>
                            <Input
                                id="hours"
                                type="number"
                                value={currentAssignment?.assignedHours || ''}
                                onChange={(e) => setCurrentAssignment(p => ({...p!, assignedHours: parseInt(e.target.value) || 0}))}
                                placeholder="Ej: 4"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="ghost">Cancelar</Button></DialogClose>
                        <Button onClick={handleSave} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Guardar Cambios
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
