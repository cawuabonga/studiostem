
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
import { Label } from '@/components/ui/label';
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
            
            // FILTRO CRÍTICO: Detectar si el alumno ya está matriculado (Cursando) en la unidad en el periodo actual.
            const currentlyEnrolledUnitIds = new Set(
                matriculationHistory
                    .filter(m => m.status === 'cursando')
                    .map(m => m.unitId)
            );

            // Filtrar unidades disponibles: mismo semestre, mismo turno del alumno, no aprobadas y no matriculadas actualmente.
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

    const currentYearNum = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => (currentYearNum - 2 + i).toString());

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="relative h-24 w-24 rounded-lg overflow-hidden shrink-0 shadow-md">
                        <Image src={student.photoURL || `https://placehold.co/200x200.png?text=${student.fullName[0]}`} alt="" fill className="object-cover" />
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                        <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-4">
                            <div>
                                <CardTitle className="text-2xl font-black uppercase tracking-tight">{student.fullName}</CardTitle>
                                <CardDescription className="text-base font-bold text-primary">{program.name}</CardDescription>
                            </div>
                            <Badge variant="secondary" className="text-base px-4 py-1 bg-blue-100 text-blue-800 border-blue-200 uppercase font-black">
                                Turno: {student.turno || 'Sin asignar'}
                            </Badge>
                        </div>
                        <div className="text-xs font-bold text-muted-foreground mt-4 space-x-4 uppercase tracking-widest">
                            <span>DNI: {student.documentId}</span>
                            <span>•</span>
                            <span>Email: {student.email}</span>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <Card className="shadow-lg border-primary/10">
                <CardHeader className="bg-muted/30 border-b">
                    <CardTitle className="text-lg font-black uppercase tracking-widest text-primary flex items-center gap-2">
                        <HistoryIcon className="h-5 w-5" /> Historial Académico
                    </CardTitle>
                    <CardDescription>Unidades cursadas agrupadas por semestre.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    {groupedHistory.length > 0 ? (
                        <Accordion type="multiple" defaultValue={[groupedHistory[0][0]]} className="w-full space-y-4">
                            {groupedHistory.map(([semester, items]) => (
                                <AccordionItem key={semester} value={semester} className="border rounded-xl px-4 overflow-hidden">
                                    <AccordionTrigger className="hover:no-underline font-black text-lg uppercase tracking-tight text-slate-700">Semestre {semester}</AccordionTrigger>
                                    <AccordionContent className="pt-2 pb-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {items.map(m => {
                                                const unit = allUnits.find(u => u.id === m.unitId);
                                                return (
                                                    <div key={m.id} className="p-4 border rounded-xl bg-card shadow-sm flex flex-col justify-between hover:border-primary/40 transition-all group">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="flex-1 pr-2">
                                                                <p className="font-black text-sm leading-tight uppercase text-slate-800">{unit?.name || 'Unidad desconocida'}</p>
                                                                <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase tracking-tighter">{m.year} - {m.period} | {unit?.turno}</p>
                                                            </div>
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity rounded-full hover:bg-destructive/10">
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent className="rounded-2xl">
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle className="font-black uppercase">¿Anular matrícula?</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            Esta acción eliminará el registro de <strong>{unit?.name}</strong> del historial de {student.fullName}. Se podrá volver a matricular después si es necesario.
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel className="font-bold">Cancelar</AlertDialogCancel>
                                                                        <AlertDialogAction onClick={() => handleDeleteMatriculation(m.id!)} className="bg-destructive hover:bg-destructive/90 font-black">CONFIRMAR ANULACIÓN</AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-dashed">
                                                            <Badge variant={m.status === 'aprobado' ? 'default' : 'secondary'} className="text-[9px] font-black uppercase px-3 h-5">
                                                                {m.status === 'cursando' ? <Clock className="h-3 w-3 mr-1" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                                                                {m.status}
                                                            </Badge>
                                                            {isDeleting === m.id && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    ) : (
                        <div className="text-center py-12 border-2 border-dashed rounded-2xl bg-muted/10 opacity-30">
                            <BookOpen className="h-12 w-12 mx-auto mb-4" />
                            <p className="font-black uppercase tracking-widest text-sm">Sin historial de matrícula</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="border-t-4 border-t-primary shadow-xl rounded-3xl overflow-hidden">
                <CardHeader className="bg-primary/5 pb-6">
                    <CardTitle className="text-xl font-black uppercase tracking-tight text-primary">Inscripción a Nuevas Unidades</CardTitle>
                    <CardDescription className="text-sm font-medium">Inscriba al estudiante solo en las unidades disponibles para el turno <span className="font-bold underline">{student.turno}</span>.</CardDescription>
                </CardHeader>
                <CardContent className="pt-8 space-y-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="space-y-1.5 flex-1">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Año Académico</Label>
                            <Select value={selectedYear} onValueChange={setSelectedYear}>
                                <SelectTrigger className="h-12 font-bold"><SelectValue /></SelectTrigger>
                                <SelectContent>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5 flex-[2]">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Ciclo / Semestre de Destino</Label>
                            <Select value={String(selectedSemester)} onValueChange={(v) => setSelectedSemester(v ? parseInt(v) : '')}>
                                <SelectTrigger className="h-12 font-bold text-primary border-primary/20"><SelectValue placeholder="Seleccione semestre para listar unidades..." /></SelectTrigger>
                                <SelectContent>{semesters.map(s => <SelectItem key={s} value={String(s)}>{s}° Semestre Académico</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    </div>

                    {selectedSemester ? (
                        <div className="rounded-2xl border-2 border-dashed border-primary/10 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                             <Table>
                                <TableHeader className="bg-slate-50/80">
                                    <TableRow>
                                        <TableHead className="w-[60px] text-center">
                                            <Checkbox onCheckedChange={handleSelectAllAvailable} checked={availableUnits.length > 0 && selectedUnits.size === availableUnits.length} className="h-5 w-5"/>
                                        </TableHead>
                                        <TableHead className="font-black text-[10px] uppercase text-primary tracking-widest">Unidad Disponible ({student.turno})</TableHead>
                                        <TableHead className="font-black text-[10px] uppercase text-primary tracking-widest text-center">Créditos</TableHead>
                                        <TableHead className="font-black text-[10px] uppercase text-primary tracking-widest text-right pr-6">Periodo</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {availableUnits.length > 0 ? availableUnits.map(unit => (
                                        <TableRow key={unit.id} className="hover:bg-primary/5 transition-colors group">
                                            <TableCell className="text-center">
                                                <Checkbox checked={selectedUnits.has(unit.id)} onCheckedChange={() => handleSelectUnit(unit.id)} className="h-5 w-5"/>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <p className="font-black text-sm uppercase group-hover:text-primary transition-colors">{unit.name}</p>
                                                <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{unit.code} • {unit.unitType}</p>
                                            </TableCell>
                                            <TableCell className="text-center font-bold">{unit.credits}</TableCell>
                                            <TableCell className="text-right pr-6">
                                                <Badge variant="outline" className="font-black text-[10px] border-primary/20">{unit.period}</Badge>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-40 text-center">
                                                <div className="flex flex-col items-center gap-2 opacity-50">
                                                    <AlertTriangle className="h-8 w-8 text-amber-500" />
                                                    <p className="font-bold uppercase text-xs">Sin unidades disponibles</p>
                                                    <p className="text-[10px] max-w-xs mx-auto">No hay unidades para el semestre {selectedSemester} en el turno {student.turno} que el alumno no haya aprobado o esté cursando.</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="py-20 text-center bg-muted/10 rounded-2xl border-2 border-dashed">
                             <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-10" />
                             <p className="text-xs font-black uppercase text-muted-foreground tracking-widest">Seleccione un ciclo para ver unidades</p>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="bg-muted/20 border-t p-6">
                    <Button 
                        disabled={selectedUnits.size === 0 || isMatriculating} 
                        onClick={handleMatriculate}
                        size="lg"
                        className="w-full h-14 font-black uppercase tracking-widest text-base shadow-xl shadow-primary/20"
                    >
                        {isMatriculating ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <CheckCircle className="mr-2 h-6 w-6" />}
                        PROCESAR MATRÍCULA ({selectedUnits.size} UNIDADES)
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}

function HistoryIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
  )
}
