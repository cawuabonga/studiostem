"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { getUnits, getAssignments, getPrograms, uploadCustomUnitImage } from "@/config/firebase";
import type { Unit, UnitPeriod } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UnitCard } from '@/components/teacher/UnitCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Filter, Save } from 'lucide-react';

interface AssignedUnit extends Unit {
    programName: string;
}

export default function TeacherDashboardPage() {
    const { user, instituteId } = useAuth();
    const { toast } = useToast();
    const [assignedUnits, setAssignedUnits] = useState<AssignedUnit[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [selectedPeriod, setSelectedPeriod] = useState<UnitPeriod | 'all'>('all');

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
                <Skeleton className="h-32 w-full" />
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
            </div>
        );
    }
    
    const filteredUnits = assignedUnits.filter(u => selectedPeriod === 'all' || u.period === selectedPeriod);
    const unitsMarJul = filteredUnits.filter(u => u.period === 'MAR-JUL');
    const unitsAgoDic = filteredUnits.filter(u => u.period === 'AGO-DIC');

    return (
        <>
            <div className="space-y-8">
                <Card className="border-primary/10 shadow-md">
                    <CardHeader>
                        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6">
                            <div className="space-y-1">
                                <CardTitle className="text-2xl font-black uppercase tracking-tight text-primary">Mis Unidades Didácticas Asignadas</CardTitle>
                                <CardDescription>
                                    Estas son las unidades que tienes a tu cargo. Selecciona una para gestionarla.
                                </CardDescription>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="w-full sm:w-40 space-y-1.5">
                                    <Label htmlFor="year-select" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Seleccionar Año</Label>
                                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                                        <SelectTrigger id="year-select" className="h-10">
                                            <SelectValue placeholder="Año" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {years.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="w-full sm:w-48 space-y-1.5">
                                    <Label htmlFor="period-select" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Periodo Académico</Label>
                                    <Select value={selectedPeriod} onValueChange={(v: any) => setSelectedPeriod(v)}>
                                        <SelectTrigger id="period-select" className="h-10">
                                            <SelectValue placeholder="Todos los periodos" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos los Periodos</SelectItem>
                                            <SelectItem value="MAR-JUL">MAR-JUL (Periodo I)</SelectItem>
                                            <SelectItem value="AGO-DIC">AGO-DIC (Periodo II)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                {filteredUnits.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center space-y-4 bg-muted/20 rounded-3xl border-2 border-dashed">
                        <Filter className="h-12 w-12 text-muted-foreground opacity-20" />
                        <div>
                            <p className="text-lg font-bold text-muted-foreground uppercase tracking-tight">Sin unidades encontradas</p>
                            <p className="text-sm text-muted-foreground">No tienes unidades asignadas para el año {selectedYear} {selectedPeriod !== 'all' ? `en el periodo ${selectedPeriod}` : ''}.</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {unitsMarJul.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-1 bg-primary rounded-full" />
                                    <h2 className="text-2xl font-black uppercase tracking-tighter">Período MAR-JUL {selectedYear}</h2>
                                </div>
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {unitsMarJul.map(unit => <UnitCard key={unit.id} unit={unit} year={selectedYear} onUploadImageClick={handleOpenUploadDialog} />)}
                                </div>
                            </div>
                        )}

                        {unitsAgoDic.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-1 bg-primary rounded-full" />
                                    <h2 className="text-2xl font-black uppercase tracking-tighter">Período AGO-DIC {selectedYear}</h2>
                                </div>
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {unitsAgoDic.map(unit => <UnitCard key={unit.id} unit={unit} year={selectedYear} onUploadImageClick={handleOpenUploadDialog} />)}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                <DialogContent className="rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black uppercase">Actualizar Imagen de Portada</DialogTitle>
                        <DialogDescription>
                            Seleccione una imagen representativa para la unidad: <span className="font-bold text-primary">{selectedUnitForUpload?.name}</span>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <Label htmlFor="picture" className="text-xs font-bold uppercase text-muted-foreground">Archivo de Imagen (Recomendado 800x400)</Label>
                        <Input id="picture" type="file" accept="image/png, image/jpeg, image/webp" onChange={handleImageFileChange} className="h-12 pt-3" />
                    </div>
                    <DialogFooter className="gap-2">
                         <DialogClose asChild><Button variant="ghost" className="font-bold">Cancelar</Button></DialogClose>
                        <Button onClick={handleUploadImage} disabled={isUploading || !imageFile} className="font-black px-8">
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                            GUARDAR PORTADA
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
