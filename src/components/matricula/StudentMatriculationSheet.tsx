
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { StudentProfile, Unit, Program, Matriculation, UnitPeriod } from '@/types';
import { getStudentProfile, getUnits, getPrograms, getMatriculationsForStudent, createMatriculations, deleteMatriculation } from '@/config/firebase';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, User, BookOpen, CheckCircle, Clock, Trash2, AlertTriangle } from 'lucide-react';
import { Badge } from '../ui/badge';
import Image from 'next/image';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

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
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const studentData = await getStudentProfile(instituteId, studentId);
            if (!studentData) return;
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
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    }, [instituteId, studentId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    useEffect(() => {
        if (selectedSemester && allUnits.length > 0 && student) {
            const completedUnitIds = new Set(matriculationHistory.filter(m => m.status === 'aprobado').map(m => m.unitId));
            const currentlyEnrolledUnitIds = new Set(matriculationHistory.filter(m => m.year === selectedYear).map(m => m.unitId));

            // CRITICAL: Filter units by the student's assigned Turno
            const unitsForSemester = allUnits.filter(unit => 
                unit.semester === selectedSemester &&
                unit.turno === student.turno && 
                !completedUnitIds.has(unit.id) &&
                !currentlyEnrolledUnitIds.has(unit.id)
            );
            setAvailableUnits(unitsForSemester);
        } else {
            setAvailableUnits([]);
        }
    }, [selectedSemester, selectedYear, allUnits, matriculationHistory, student]);

    const handleSelectUnit = (unitId: string) => {
        setSelectedUnits(prev => {
            const newSet = new Set(prev);
            if (newSet.has(unitId)) newSet.delete(unitId);
            else newSet.add(unitId);
            return newSet;
        });
    };

    const handleSelectAllAvailable = (checked: boolean | string) => {
        if (checked) setSelectedUnits(new Set(availableUnits.map(u => u.id)));
        else setSelectedUnits(new Set());
    };

    const handleMatriculate = async () => {
        if (!student || !program || selectedUnits.size === 0) return;
        setIsMatriculating(true);
        try {
            const unitsToMatriculate = allUnits.filter(u => selectedUnits.has(u.id));
            await createMatriculations(instituteId, student.documentId, unitsToMatriculate, selectedYear);
            toast({ title: "Matrícula Exitosa", description: `${selectedUnits.size} unidades registradas.` });
            fetchData();
            setSelectedUnits(new Set());
        } catch (error) {
            toast({ title: "Error", description: "No se pudo procesar la matrícula.", variant: "destructive" });
        } finally {
            setIsMatriculating(false);
        }
    };

    const handleDeleteMatriculation = async (mId: string) => {
        if (!student) return;
        setIsDeleting(mId);
        try {
            await deleteMatriculation(instituteId, student.documentId, mId);
            toast({ title: "Matrícula Anulada", description: "El registro ha sido eliminado correctamente." });
            fetchData();
        } catch (error) {
            toast({ title: "Error", description: "No se pudo anular la matrícula.", variant: "destructive" });
        } finally {
            setIsDeleting(null);
        }
    };

    const groupedHistory = useMemo(() => {
        const groups: Record<number, Matriculation[]> = {};
        matriculationHistory.forEach(m => {
            if (!groups[m.semester]) groups[m.semester] = [];
            groups[m.semester].push(m);
        });
        return Object.entries(groups).sort((a, b) => Number(b[0]) - Number(a[0]));
    }, [matriculationHistory]);

    if (loading) return <div className="space-y-4"><Skeleton className="h-40 w-full" /><Skeleton className="h-64 w-full" /></div>;
    if (!student || !program) return <p>Estudiante o programa no encontrado.</p>;

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString());

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center gap-6">
                    <Image src={student.photoURL || `https://placehold.co/100x100.png`} alt="" width={100} height={100} className="rounded-lg object-cover" />
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-2xl">{student.fullName}</CardTitle>
                                <CardDescription className="text-base">{program.name}</CardDescription>
                            </div>
                            <Badge variant="secondary" className="text-lg px-4 py-1 bg-blue-100 text-blue-800 border-blue-200">
                                Turno: {student.turno || 'Sin asignar'}
                            </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-2 space-x-4">
                            <span>DNI: {student.documentId}</span>
                            <span>Email: {student.email}</span>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <Card>
                <CardHeader><CardTitle>Historial Académico</CardTitle><CardDescription>Unidades cursadas agrupadas por semestre.</CardDescription></CardHeader>
                <CardContent>
                    {groupedHistory.length > 0 ? (
                        <Accordion type="multiple" defaultValue={[groupedHistory[0][0]]} className="w-full space-y-4">
                            {groupedHistory.map(([semester, items]) => (
                                <AccordionItem key={semester} value={semester} className="border rounded-lg px-4">
                                    <AccordionTrigger className="hover:no-underline font-bold text-lg">Semestre {semester}</AccordionTrigger>
                                    <AccordionContent className="pt-2 pb-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {items.map(m => {
                                                const unit = allUnits.find(u => u.id === m.unitId);
                                                return (
                                                    <div key={m.id} className="p-3 border rounded-md bg-muted/30 flex flex-col justify-between">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="flex-1 pr-2">
                                                                <p className="font-bold text-sm leading-tight">{unit?.name || 'Unidad desconocida'}</p>
                                                                <p className="text-[10px] text-muted-foreground mt-1">{m.year} - {m.period} | {unit?.turno}</p>
                                                            </div>
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10">
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>¿Anular matrícula?</AlertDialogTitle>
                                                                        <AlertDialogDescription>Esto eliminará el registro de {unit?.name} del historial del alumno. Podrás volver a matricularlo si lo deseas.</AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                        <AlertDialogAction onClick={() => handleDeleteMatriculation(m.id!)} className="bg-destructive hover:bg-destructive/90">Confirmar Eliminación</AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-auto">
                                                            <Badge variant={m.status === 'aprobado' ? 'default' : 'secondary'} className="text-[10px] uppercase">{m.status}</Badge>
                                                            {isDeleting === m.id && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    ) : <p className="text-center text-muted-foreground py-4 italic">El estudiante no tiene historial de matrícula.</p>}
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Realizar Nueva Matrícula</CardTitle><CardDescription>Inscriba al estudiante en las unidades correspondientes a su turno ({student.turno}).</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-4">
                        <Select value={selectedYear} onValueChange={setSelectedYear}><SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger><SelectContent>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent></Select>
                        <Select value={String(selectedSemester)} onValueChange={(v) => setSelectedSemester(v ? parseInt(v) : '')}><SelectTrigger className="w-[180px]"><SelectValue placeholder="Ciclo / Semestre..." /></SelectTrigger><SelectContent>{semesters.map(s => <SelectItem key={s} value={String(s)}>{s}° Semestre</SelectItem>)}</SelectContent></Select>
                    </div>
                    {selectedSemester && (
                        <div className="rounded-md border">
                             <Table>
                                <TableHeader><TableRow><TableHead className="w-[50px]"><Checkbox onCheckedChange={handleSelectAllAvailable} checked={availableUnits.length > 0 && selectedUnits.size === availableUnits.length}/></TableHead><TableHead>Unidad Disponible ({student.turno})</TableHead><TableHead>Periodo</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {availableUnits.length > 0 ? availableUnits.map(unit => (
                                        <TableRow key={unit.id}><TableCell><Checkbox checked={selectedUnits.has(unit.id)} onCheckedChange={() => handleSelectUnit(unit.id)}/></TableCell><TableCell className="font-medium">{unit.name}</TableCell><TableCell><Badge variant="outline">{unit.period}</Badge></TableCell></TableRow>
                                    )) : <TableRow><TableCell colSpan={3} className="h-24 text-center text-muted-foreground">No hay unidades disponibles para el semestre {selectedSemester} en el turno {student.turno}.</TableCell></TableRow>}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
                <CardFooter><Button disabled={selectedUnits.size === 0 || isMatriculating} onClick={handleMatriculate}>{isMatriculating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Matricular en {selectedUnits.size} Unidad(es)</Button></CardFooter>
            </Card>
        </div>
    )
}
