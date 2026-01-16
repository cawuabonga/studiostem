

"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { StudentProfile, Unit, Program, Matriculation, UnitPeriod } from '@/types';
import { getStudentProfile, getUnits, getPrograms, getMatriculationsForStudent, createMatriculations } from '@/config/firebase';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, User, BookOpen, CheckCircle, Clock } from 'lucide-react';
import { Badge } from '../ui/badge';
import Image from 'next/image';

interface StudentMatriculationSheetProps {
    instituteId: string;
    studentId: string;
}

const semesters = Array.from({ length: 10 }, (_, i) => i + 1);

export function StudentMatriculationSheet({ instituteId, studentId }: StudentMatriculationSheetProps) {
    const { toast } = useToast();
    const [student, setStudent] = useState<StudentProfile | null>(null);
    const [program, setProgram] = useState<Program | null>(null);
    const [allUnits, setAllUnits] = useState<Unit[]>([]);
    const [matriculationHistory, setMatriculationHistory] = useState<Matriculation[]>([]);
    const [availableUnits, setAvailableUnits] = useState<Unit[]>([]);
    const [selectedUnits, setSelectedUnits] = useState<Set<string>>(new Set());
    
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [selectedSemester, setSelectedSemester] = useState<number | ''>('');
    
    const [loading, setLoading] = useState(true);
    const [isMatriculating, setIsMatriculating] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const studentData = await getStudentProfile(instituteId, studentId);
            if (!studentData) {
                // toast({ title: "Error", description: "No se encontró al estudiante.", variant: "destructive" });
                return;
            }
            setStudent(studentData);
            
            const [programs, allProgramUnits, history] = await Promise.all([
                getPrograms(instituteId),
                getUnits(instituteId),
                getMatriculationsForStudent(instituteId, studentId)
            ]);

            const studentProgram = programs.find(p => p.id === studentData.programId) || null;
            setProgram(studentProgram);

            const programUnits = allProgramUnits.filter(u => u.programId === studentData.programId);
            setAllUnits(programUnits);
            setMatriculationHistory(history);

        } catch (error) {
            console.error("Error fetching data for matriculation sheet:", error);
            // toast({ title: "Error", description: "No se pudieron cargar los datos del estudiante.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [instituteId, studentId, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (selectedSemester && allUnits.length > 0) {
            const completedUnitIds = new Set(
                matriculationHistory.filter(m => m.status === 'aprobado').map(m => m.unitId)
            );
            const currentlyEnrolledUnitIds = new Set(
                 matriculationHistory
                    .filter(m => m.year === selectedYear)
                    .map(m => m.unitId)
            );

            const unitsForSemester = allUnits.filter(unit => 
                unit.semester === selectedSemester &&
                !completedUnitIds.has(unit.id) &&
                !currentlyEnrolledUnitIds.has(unit.id)
            );
            setAvailableUnits(unitsForSemester);
        } else {
            setAvailableUnits([]);
        }
    }, [selectedSemester, selectedYear, allUnits, matriculationHistory]);

    const handleSelectUnit = (unitId: string) => {
        setSelectedUnits(prev => {
            const newSet = new Set(prev);
            if (newSet.has(unitId)) {
                newSet.delete(unitId);
            } else {
                newSet.add(unitId);
            }
            return newSet;
        });
    };

    const handleSelectAllAvailable = (checked: boolean | string) => {
        if (checked) {
            setSelectedUnits(new Set(availableUnits.map(u => u.id)));
        } else {
            setSelectedUnits(new Set());
        }
    };

    const handleMatriculate = async () => {
        if (!student || !program || selectedUnits.size === 0) return;

        setIsMatriculating(true);
        try {
            const unitsToMatriculate = allUnits.filter(u => selectedUnits.has(u.id));
            
            await createMatriculations(instituteId, student.documentId, unitsToMatriculate, selectedYear);
            
            // toast({
            //     title: "¡Matrícula Exitosa!",
            //     description: `Se matriculó a ${student.fullName} en ${selectedUnits.size} unidades.`,
            // });
            // Refetch data to update the view
            fetchData();
            setSelectedUnits(new Set());

        } catch (error) {
            console.error("Matriculation error:", error);
            // toast({ title: "Error en la Matrícula", description: "Ocurrió un error al procesar la matrícula.", variant: "destructive" });
        } finally {
            setIsMatriculating(false);
        }
    };
    
    if (loading) {
        return (
             <div className="space-y-4">
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (!student || !program) {
        return <p>Estudiante o programa no encontrado.</p>
    }

    const isAllSelected = availableUnits.length > 0 && selectedUnits.size === availableUnits.length;
    const isPartiallySelected = availableUnits.length > 0 && selectedUnits.size > 0 && selectedUnits.size < availableUnits.length;

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString());

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center gap-6">
                    <Image
                        src={student.photoURL || `https://placehold.co/100x100.png`}
                        alt={`Foto de ${student.fullName}`}
                        width={100}
                        height={100}
                        className="rounded-lg object-cover"
                        data-ai-hint="student photo"
                    />
                    <div>
                        <CardTitle className="text-2xl">{student.fullName}</CardTitle>
                        <CardDescription className="text-base">{program.name}</CardDescription>
                        <div className="text-sm text-muted-foreground mt-2 space-x-4">
                            <span>DNI: {student.documentId}</span>
                            <span>Email: {student.email}</span>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Historial Académico</CardTitle>
                    <CardDescription>Unidades didácticas cursadas previamente por el estudiante.</CardDescription>
                </CardHeader>
                 <CardContent>
                    {matriculationHistory.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {matriculationHistory.map(m => {
                            const unit = allUnits.find(u => u.id === m.unitId);
                            const statusColor = m.status === 'aprobado' ? 'text-green-600' : 'text-destructive';
                            const StatusIcon = m.status === 'aprobado' ? CheckCircle : Clock;
                            return (
                                <div key={m.id} className="p-3 border rounded-md bg-muted/30">
                                    <p className="font-semibold">{unit?.name || 'Unidad desconocida'}</p>
                                    <p className="text-sm text-muted-foreground">{m.year} - {m.period} (Sem. {m.semester})</p>
                                    <p className={`text-sm font-bold flex items-center gap-1 mt-1 ${statusColor}`}>
                                       <StatusIcon className="h-4 w-4" /> {m.status}
                                    </p>
                                </div>
                            )
                        })}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-4">El estudiante no tiene historial de matrícula.</p>
                    )}
                 </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Realizar Nueva Matrícula</CardTitle>
                    <CardDescription>Selecciona el año, el semestre a cursar y las unidades correspondientes.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-4">
                        <Select value={selectedYear} onValueChange={setSelectedYear}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={String(selectedSemester)} onValueChange={(v) => setSelectedSemester(v ? parseInt(v) : '')}>
                            <SelectTrigger><SelectValue placeholder="Seleccionar semestre..." /></SelectTrigger>
                            <SelectContent>
                                {semesters.map(s => <SelectItem key={s} value={String(s)}>Semestre {s}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedSemester && (
                        <div className="rounded-md border overflow-auto">
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px]">
                                            <Checkbox 
                                                onCheckedChange={handleSelectAllAvailable}
                                                checked={isAllSelected}
                                                aria-label="Seleccionar todas las unidades disponibles"
                                                ref={el => { if (el) el.indeterminate = isPartiallySelected }}
                                            />
                                        </TableHead>
                                        <TableHead>Unidad Didáctica Disponible</TableHead>
                                        <TableHead>Módulo</TableHead>
                                        <TableHead>Período</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {availableUnits.length > 0 ? (
                                        availableUnits.map(unit => (
                                            <TableRow key={unit.id}>
                                                <TableCell>
                                                    <Checkbox
                                                        checked={selectedUnits.has(unit.id)}
                                                        onCheckedChange={() => handleSelectUnit(unit.id)}
                                                    />
                                                </TableCell>
                                                <TableCell className="font-medium">{unit.name}</TableCell>
                                                <TableCell>{program.modules.find(m => m.code === unit.moduleId)?.name}</TableCell>
                                                <TableCell><Badge variant="outline">{unit.period}</Badge></TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                                No hay unidades disponibles para este semestre o el estudiante ya las cursó/aprobó todas.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                     <Button 
                        disabled={selectedUnits.size === 0 || isMatriculating} 
                        onClick={handleMatriculate}
                    >
                        {isMatriculating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Matricular en {selectedUnits.size} Unidad(es)
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
