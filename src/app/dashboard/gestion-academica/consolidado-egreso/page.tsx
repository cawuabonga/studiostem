
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getStudentProfiles, getPrograms, checkEgresoEligibility, promoteToEgresado } from '@/config/firebase';
import type { StudentProfile, Program } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, Award, Loader2, Info, AlertTriangle, UserCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface EligibilityResult {
    eligible: boolean;
    pendingUnits: string[];
    pendingEFSRT: string[];
}

export function ConsolidadoEgresoPage() {
    const { instituteId } = useAuth();
    const { toast } = useToast();
    const [students, setStudents] = useState<StudentProfile[]>([]);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [loading, setLoading] = useState(true);
    const [eligibilityMap, setEligibilityMap] = useState<Record<string, EligibilityResult>>({});
    
    const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
    const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false);
    const [graduationYear, setGraduationYear] = useState(new Date().getFullYear().toString());
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchData = useCallback(async () => {
        if (!instituteId) return;
        setLoading(true);
        try {
            const [fetchedStudents, fetchedPrograms] = await Promise.all([
                getStudentProfiles(instituteId),
                getPrograms(instituteId)
            ]);
            
            // Filtramos solo los que aún están cursando
            const activeStudents = fetchedStudents.filter(s => !s.academicStatus || s.academicStatus === 'Cursando');
            setStudents(activeStudents);
            setPrograms(fetchedPrograms);

            const results: Record<string, EligibilityResult> = {};
            for (const student of activeStudents) {
                results[student.documentId] = await checkEgresoEligibility(instituteId, student.documentId);
            }
            setEligibilityMap(results);

        } catch (error) {
            toast({ title: "Error", description: "No se pudieron cargar los datos de egreso.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [instituteId, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handlePromote = async () => {
        if (!instituteId || !selectedStudent) return;
        setIsSubmitting(true);
        try {
            await promoteToEgresado(instituteId, selectedStudent.documentId, graduationYear);
            toast({ title: "Estudiante Promocionado", description: `${selectedStudent.fullName} ahora tiene el estado de Egresado.` });
            setIsPromoteDialogOpen(false);
            fetchData();
        } catch (error) {
            toast({ title: "Error", description: "No se pudo actualizar el estado del estudiante.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-64 w-full" /></div>;

    return (
        <div className="space-y-6">
            <Card className="border-l-4 border-l-amber-500">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Award className="h-6 w-6 text-amber-500" />
                        <CardTitle>Consolidado de Egreso y Graduación</CardTitle>
                    </div>
                    <CardDescription>
                        Validación automática de requisitos: Todas las Unidades Didácticas aprobadas y todas las Experiencias Formativas (EFSRT) culminadas.
                    </CardDescription>
                </CardHeader>
            </Card>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Estudiante</TableHead>
                            <TableHead>Carrera</TableHead>
                            <TableHead className="text-center">Unidades Pend.</TableHead>
                            <TableHead className="text-center">EFSRT Pend.</TableHead>
                            <TableHead className="text-center">Elegibilidad</TableHead>
                            <TableHead className="text-right">Acción</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {students.length > 0 ? students.map(student => {
                            const result = eligibilityMap[student.documentId];
                            const programName = programs.find(p => p.id === student.programId)?.name || 'N/A';
                            
                            return (
                                <TableRow key={student.documentId}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm">{student.fullName}</span>
                                            <span className="text-[10px] font-mono text-muted-foreground">{student.documentId}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-xs">{programName}</TableCell>
                                    <TableCell className="text-center">
                                        {result?.pendingUnits.length > 0 ? (
                                            <Badge variant="destructive" className="text-[10px]">{result.pendingUnits.length}</Badge>
                                        ) : <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {result?.pendingEFSRT.length > 0 ? (
                                            <Badge variant="destructive" className="text-[10px]">{result.pendingEFSRT.length}</Badge>
                                        ) : <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {result?.eligible ? (
                                            <Badge className="bg-green-100 text-green-800 border-green-200 animate-pulse">EXPEDITO</Badge>
                                        ) : (
                                            <Badge variant="secondary" className="text-[10px]">EN PROCESO</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {result?.eligible ? (
                                            <Button size="sm" onClick={() => { setSelectedStudent(student); setIsPromoteDialogOpen(true); }}>
                                                <UserCheck className="mr-2 h-4 w-4" /> Egresar
                                            </Button>
                                        ) : (
                                            <Button variant="ghost" size="icon" onClick={() => {
                                                const details = [
                                                    result?.pendingUnits.length > 0 ? `Unidades: ${result.pendingUnits.join(', ')}` : '',
                                                    result?.pendingEFSRT.length > 0 ? `EFSRT: ${result.pendingEFSRT.join(', ')}` : ''
                                                ].filter(Boolean).join('\n\n');
                                                toast({ title: "Requisitos Faltantes", description: details || "Calculando..." });
                                            }}>
                                                <Info className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        }) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground italic">No hay estudiantes activos en el programa seleccionado.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isPromoteDialogOpen} onOpenChange={setIsPromoteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><Award className="h-5 w-5 text-amber-500" /> Confirmar Egreso</DialogTitle>
                        <DialogDescription>
                            El estudiante <strong>{selectedStudent?.fullName}</strong> ha cumplido con el 100% de sus créditos y prácticas. Al confirmar, su estado cambiará a "Egresado".
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label>Año de Graduación / Promoción</Label>
                            <Input 
                                value={graduationYear} 
                                onChange={(e) => setGraduationYear(e.target.value)} 
                                placeholder="Ej: 2024"
                            />
                        </div>
                        <div className="p-3 bg-amber-50 border border-amber-100 rounded-md flex gap-3 text-xs text-amber-800">
                            <AlertTriangle className="h-5 w-5 shrink-0" />
                            <p>Esta acción es oficial. El usuario dejará de aparecer en las listas de matrícula activa y pasará al padrón de egresados del instituto.</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsPromoteDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handlePromote} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirmar Egreso Oficial
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
