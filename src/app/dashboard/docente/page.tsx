
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { getUnits, getAssignments, getPrograms, uploadCustomUnitImage } from "@/config/firebase";
import type { Unit } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UnitCard } from '@/components/teacher/UnitCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

interface AssignedUnit extends Unit {
    programName: string;
}

export default function TeacherDashboardPage() {
    const { user, instituteId } = useAuth();
    const { toast } = useToast();
    const [assignedUnits, setAssignedUnits] = useState<AssignedUnit[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

    // State for image upload dialog
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
    const [selectedUnitForUpload, setSelectedUnitForUpload] = useState<Unit | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

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
    
    const handleOpenUploadDialog = (unit: Unit) => {
        setSelectedUnitForUpload(unit);
        setIsUploadDialogOpen(true);
    };

    const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    const handleUploadImage = async () => {
        if (!instituteId || !selectedUnitForUpload || !imageFile) {
            toast({ title: 'Error', description: 'Faltan datos para subir la imagen.', variant: 'destructive'});
            return;
        }
        setIsUploading(true);
        try {
            await uploadCustomUnitImage(instituteId, selectedUnitForUpload.id, imageFile);
            toast({ title: 'Imagen Subida', description: `Se ha actualizado la imagen para ${selectedUnitForUpload.name}`});
            fetchAssignedUnits();
            setIsUploadDialogOpen(false);
        } catch (error) {
            toast({ title: 'Error', description: 'No se pudo subir la imagen.', variant: 'destructive' });
        } finally {
            setIsUploading(false);
            setImageFile(null);
            setSelectedUnitForUpload(null);
        }
    };

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
        <>
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
                                    {unitsMarJul.map(unit => <UnitCard key={unit.id} unit={unit} onUploadImageClick={handleOpenUploadDialog} />)}
                                </div>
                            </div>
                        )}

                        {unitsAgoDic.length > 0 && (
                            <div className="space-y-4">
                                <h2 className="text-2xl font-bold">Período AGO-DIC {selectedYear}</h2>
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {unitsAgoDic.map(unit => <UnitCard key={unit.id} unit={unit} onUploadImageClick={handleOpenUploadDialog} />)}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Subir Nueva Imagen</DialogTitle>
                        <DialogDescription>
                            Selecciona una imagen para la unidad: <span className="font-semibold">{selectedUnitForUpload?.name}</span>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="picture">Imagen (se recomienda formato horizontal)</Label>
                        <Input id="picture" type="file" accept="image/png, image/jpeg, image/webp" onChange={handleImageFileChange} />
                    </div>
                    <DialogFooter>
                         <DialogClose asChild><Button variant="ghost">Cancelar</Button></DialogClose>
                        <Button onClick={handleUploadImage} disabled={isUploading || !imageFile}>
                            {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Subir y Guardar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
