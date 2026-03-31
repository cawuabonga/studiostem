
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
import { CheckCircle, XCircle, Award, Loader2, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface EligibilityResult {
    eligible: boolean;
    pendingUnits: string[];
    pendingEFSRT: string[];
}

export default function ConsolidadoEgresoPage() {
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
            
            // Only consider students that are not already Egresados or Titulados
            const activeStudents = fetchedStudents.filter(s => !s.academicStatus || s.academicStatus === 'Cursando');
            setStudents(activeStudents);
            setPrograms(fetchedPrograms);

            // Check eligibility for each student
            const results: Record<string, EligibilityResult> = {};
            for (const student of activeStudents) {
                results[student.documentId] = await checkEgresoEligibility(instituteId, student.documentId);
            }
            setEligibilityMap(results);

        } catch (error) {
            toast({ title: "Error", description: "No se pudieron cargar los datos.", variant: "destructive" });
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
            toast({ title: "Estudiante Promocionado", description: `${selectedStudent.fullName} ahora es Egresado.` });
            setIsPromoteDialogOpen(false);
            fetchData();
        } catch (error) {
            toast({ title: "Error", description: "No se pudo actualizar el estado del estudiante.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <Skeleton className="h-96 w-full" />;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Consolidado de Egreso y Graduación</CardTitle>
                    <CardDescription>
                        Visualiza qué estudiantes han cumplido con todos sus créditos académicos y experiencias formativas para ser declarados egresados.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Estudiante</TableHead>
                                    <TableHead>Programa</TableHead>
                                    <TableHead className="text-center">Unidades Pendientes</TableHead>
                                    <TableHead className="text-center">EFSRT Pendientes</TableHead>
                                    <TableHead className="text-center">Estado de Egreso</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {students.map(student => {
                                    const result = eligibilityMap[student.documentId];
                                    return (
                                        <TableRow key={student.documentId}>
                                            <TableCell>
                                                <p className="font-medium">{student.fullName}</p>
                                                <p className="text-xs text-muted-foreground font-mono">{student.documentId}</p>
                                            </TableCell>
                                            <TableCell>{programs.find(p => p.id === student.programId)?.name}</TableCell>
                                            <TableCell className="text-center">
                                                {result?.pendingUnits.length > 0 ? (
                                                    <Badge variant="destructive">{result.pendingUnits.length}</Badge>
                                                ) : <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {result?.pendingEFSRT.length > 0 ? (
                                                    <Badge variant="destructive">{result.pendingEFSRT.length}</Badge>
                                                ) : <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {result?.eligible ? (
                                                    <Badge className="bg-green-100 text-green-800 border-green-200">EXPEDITO</Badge>
                                                ) : <Badge variant="secondary">EN PROCESO</Badge>}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {result?.eligible ? (
                                                    <Button size="sm" onClick={() => { setSelectedStudent(student); setIsPromoteDialogOpen(true); }}>
                                                        <Award className="mr-2 h-4 w-4" /> Promocionar a Egresado
                                                    </Button>
                                                ) : (
                                                    <Button variant="ghost" size="icon" onClick={() => {
                                                        const details = [...result.pendingUnits, ...result.pendingEFSRT].join('\n- ');
                                                        alert(`Pendientes:\n- ${details}`);
                                                    }}>
                                                        <Info className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isPromoteDialogOpen} onOpenChange={setIsPromoteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmar Promoción a Egresado</DialogTitle>
                        <DialogDescription>
                            El estudiante {selectedStudent?.fullName} ha cumplido con todos los requisitos. Al confirmarlo, su rol cambiará a "Egresado".
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
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsPromoteDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handlePromote} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirmar Egreso
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
