
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { Program, ProgramModule, Unit, StudentProfile, UnitPeriod } from '@/types';
import { getStudentProfiles, getUnits, createMatriculations } from '@/config/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserPlus, BookOpen, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';


interface MatriculationDashboardProps {
    instituteId: string;
    program: Program;
    module: ProgramModule;
    year: string;
    period: UnitPeriod;
    semester: number;
}

export function MatriculationDashboard({ instituteId, program, module, year, period, semester }: MatriculationDashboardProps) {
    const [students, setStudents] = useState<StudentProfile[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [isMatriculating, setIsMatriculating] = useState(false);
    const { toast } = useToast();

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // TODO: Replace with logic to fetch ONLY eligible students based on matriculation history
            const allStudents = await getStudentProfiles(instituteId);
            const studentsInProgram = allStudents.filter(s => s.programId === program.id);
            
            const allUnits = await getUnits(instituteId);
            const unitsForSemester = allUnits.filter(u => 
                u.programId === program.id &&
                u.moduleId === module.code &&
                u.semester === semester &&
                u.period === period
            );
            
            setStudents(studentsInProgram);
            setUnits(unitsForSemester);

        } catch (error) {
            console.error("Error fetching data for matriculation:", error);
            toast({
                title: "Error",
                description: "No se pudieron cargar los datos para la matrícula.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [instituteId, program.id, module.code, semester, period, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSelectStudent = (studentId: string) => {
        setSelectedStudents(prev => {
            const newSet = new Set(prev);
            if (newSet.has(studentId)) {
                newSet.delete(studentId);
            } else {
                newSet.add(studentId);
            }
            return newSet;
        });
    };

    const handleSelectAll = (checked: boolean | string) => {
        if (checked) {
            setSelectedStudents(new Set(students.map(s => s.documentId)));
        } else {
            setSelectedStudents(new Set());
        }
    };
    
    const handleMatriculate = async () => {
        setIsMatriculating(true);
        try {
            await createMatriculations(
                instituteId, 
                Array.from(selectedStudents), 
                units,
                { year, period, semester, programId: program.id, moduleId: module.code }
            );
            toast({
                title: "¡Matrícula Exitosa!",
                description: `Se matricularon ${selectedStudents.size} estudiantes en ${units.length} unidades.`,
            });
            setSelectedStudents(new Set()); // Clear selection after matriculation
        } catch (error) {
             console.error("Matriculation error:", error);
            toast({
                title: "Error en la Matrícula",
                description: "Ocurrió un error al procesar la matrícula.",
                variant: "destructive"
            });
        } finally {
            setIsMatriculating(false);
        }
    };

    if (loading) {
        return <Skeleton className="h-96 w-full" />
    }

    const isAllSelected = selectedStudents.size > 0 && selectedStudents.size === students.length;
    const isPartiallySelected = selectedStudents.size > 0 && selectedStudents.size < students.length;
    const canMatriculate = selectedStudents.size > 0 && units.length > 0 && !isMatriculating;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Matricular en {program.name}</CardTitle>
                <CardDescription>
                    {`Período ${year} ${period} | Módulo: ${module.name} | Semestre ${semester}`}
                </CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-8 items-start">
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><UserPlus /> Estudiantes a Matricular</CardTitle>
                        <CardDescription>Seleccione los estudiantes que desea matricular en este bloque.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <ScrollArea className="h-[400px]">
                            <Table>
                                <TableHeader className="sticky top-0 bg-background">
                                    <TableRow>
                                        <TableHead className="w-[50px]">
                                            <Checkbox 
                                                onCheckedChange={handleSelectAll}
                                                checked={isAllSelected}
                                                aria-label="Seleccionar todos"
                                                // This is how you handle indeterminate state in shadcn
                                                ref={el => { if (el) el.indeterminate = isPartiallySelected }}
                                            />
                                        </TableHead>
                                        <TableHead>Nombre del Estudiante</TableHead>
                                        <TableHead>Documento</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {students.map(student => (
                                        <TableRow key={student.documentId}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedStudents.has(student.documentId)}
                                                    onCheckedChange={() => handleSelectStudent(student.documentId)}
                                                    aria-label={`Seleccionar a ${student.fullName}`}
                                                />
                                            </TableCell>
                                            <TableCell>{student.fullName}</TableCell>
                                            <TableCell>{student.documentId}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                       </ScrollArea>
                    </CardContent>
                </Card>
                
                 <Card className="h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><BookOpen /> Unidades del Semestre</CardTitle>
                        <CardDescription>Los estudiantes seleccionados serán matriculados en estas unidades.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[400px] space-y-2 pr-4">
                            {units.length > 0 ? units.map(unit => (
                                <div key={unit.id} className="p-3 border rounded-md bg-muted/50 flex justify-between items-center">
                                    <div>
                                        <p className="font-medium">{unit.name}</p>
                                        <p className="text-sm text-muted-foreground">{unit.code}</p>
                                    </div>
                                    <Badge variant="secondary">{unit.totalHours} Horas</Badge>
                                </div>
                            )) : (
                                <p className="text-center text-muted-foreground pt-10">No se encontraron unidades para los criterios seleccionados.</p>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>
            </CardContent>
            <div className="p-6 pt-0 text-center">
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button size="lg" disabled={!canMatriculate}>
                            {isMatriculating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Matricular a {selectedStudents.size} Estudiante(s)
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Matrícula</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Está seguro de que desea matricular a <strong>{selectedStudents.size} estudiante(s)</strong> en <strong>{units.length} unidades didácticas</strong> para el semestre {semester} del período {year} {period}? Esta acción no se puede deshacer fácilmente.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleMatriculate}>Sí, matricular</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </Card>
    );
}
