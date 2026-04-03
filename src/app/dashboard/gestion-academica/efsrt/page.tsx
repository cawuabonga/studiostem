
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getStudentProfiles, getPrograms, getTeachers, programEFSRT, getAllEFSRTAssignments } from '@/config/firebase';
import type { StudentProfile, Program, Teacher, EFSRTAssignment, UnitPeriod } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, MapPin, Calendar, ListChecks, PlusCircle, Filter, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Timestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const semesters = Array.from({ length: 10 }, (_, i) => i + 1);

const calculateCurrentSemester = (admissionYear: string, admissionPeriod: UnitPeriod): number => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth(); // 0-11
    
    const yearsDiff = currentYear - parseInt(admissionYear);
    let semesterCount = yearsDiff * 2;

    if (admissionPeriod === 'MAR-JUL') {
        semesterCount += 1;
    }

    if (currentMonth >= 7) { // Julio en adelante, estamos en el segundo semestre del año
        semesterCount += 1;
    } else if (admissionPeriod === 'AGO-DIC') {
         semesterCount -=1;
    }

    return Math.max(1, semesterCount);
};

export default function AdminEFSRTPage() {
    const { instituteId, user, hasPermission } = useAuth();
    const { toast } = useToast();
    const [students, setStudents] = useState<StudentProfile[]>([]);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [allAssignments, setAllAssignments] = useState<EFSRTAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // --- ESTADOS DE FILTROS ---
    // Filtros para la pestaña de SEGUIMIENTO
    const [filterSeg, setFilterSeg] = useState('');
    const [semesterFilterSeg, setSemesterFilterSeg] = useState<string>('all');
    const [moduleFilterSeg, setModuleFilterSeg] = useState<string>('all');
    const [statusFilterSeg, setStatusFilterSeg] = useState<string>('all');

    // Filtros para la pestaña de PROGRAMAR
    const [filterProg, setFilterProg] = useState('');
    const [semesterFilterProg, setSemesterFilterProg] = useState<string>('all');
    const [moduleFilterProg, setModuleFilterProg] = useState<string>('all');

    const [isProgramDialogOpen, setIsProgramDialogOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
    
    const [formData, setFormData] = useState({
        moduleId: '',
        supervisorId: '',
        location: '',
        startDate: '',
        endDate: '',
    });

    // Determinar si el usuario es coordinador y su programa
    const isFullAdmin = hasPermission('academic:program:manage');
    const userProgramId = user?.programId || (user as any)?.programId;

    const fetchData = useCallback(async () => {
        if (!instituteId) return;
        setLoading(true);
        try {
            const [fetchedStudents, fetchedPrograms, fetchedTeachers, fetchedAssignments] = await Promise.all([
                getStudentProfiles(instituteId),
                getPrograms(instituteId),
                getTeachers(instituteId),
                getAllEFSRTAssignments(instituteId)
            ]);
            setStudents(fetchedStudents);
            setPrograms(fetchedPrograms);
            setTeachers(fetchedTeachers);
            setAllAssignments(fetchedAssignments);
        } catch (error) {
            toast({ title: "Error", description: "No se pudieron cargar los datos.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [instituteId, toast]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const currentProgramModules = useMemo(() => {
        if (!userProgramId) return [];
        return programs.find(p => p.id === userProgramId)?.modules || [];
    }, [programs, userProgramId]);

    // --- LÓGICA DE FILTRADO PARA SEGUIMIENTO ---
    const filteredAssignments = useMemo(() => {
        const baseAssignments = isFullAdmin && !userProgramId 
            ? allAssignments 
            : allAssignments.filter(a => a.programId === userProgramId);

        return baseAssignments.filter(a => {
            // 1. Filtro de Texto
            const matchesText = a.studentName.toLowerCase().includes(filterSeg.toLowerCase()) || a.studentId.includes(filterSeg);
            if (!matchesText) return false;

            // 2. Filtro de Módulo
            if (moduleFilterSeg !== 'all' && a.moduleId !== moduleFilterSeg) return false;

            // 3. Filtro de Estado
            if (statusFilterSeg !== 'all' && a.status !== statusFilterSeg) return false;

            // 4. Filtro de Semestre (requiere cruce con perfiles de alumnos)
            if (semesterFilterSeg !== 'all') {
                const student = students.find(s => s.documentId === a.studentId);
                if (student) {
                    const currentSem = calculateCurrentSemester(student.admissionYear, student.admissionPeriod);
                    if (currentSem !== parseInt(semesterFilterSeg)) return false;
                } else {
                    return false;
                }
            }

            return true;
        });
    }, [allAssignments, isFullAdmin, userProgramId, filterSeg, moduleFilterSeg, statusFilterSeg, semesterFilterSeg, students]);

    // --- LÓGICA DE FILTRADO PARA PROGRAMAR ---
    const studentsToProgram = useMemo(() => {
        const myProgramStudents = isFullAdmin && !userProgramId 
            ? students 
            : students.filter(s => s.programId === userProgramId);

        return myProgramStudents.filter(student => {
            // 1. Filtro de Texto
            const matchesText = student.fullName.toLowerCase().includes(filterProg.toLowerCase()) || student.documentId.includes(filterProg);
            if (!matchesText) return false;

            // 2. Filtro de Semestre
            if (semesterFilterProg !== 'all') {
                const currentSem = calculateCurrentSemester(student.admissionYear, student.admissionPeriod);
                if (currentSem !== parseInt(semesterFilterProg)) return false;
            }

            // 3. Filtro de Módulo Inteligente (Ocultar si ya tiene asignación)
            if (moduleFilterProg !== 'all') {
                const alreadyAssigned = allAssignments.some(a => 
                    a.studentId === student.documentId && a.moduleId === moduleFilterProg
                );
                if (alreadyAssigned) return false;
            }

            return true;
        });
    }, [students, allAssignments, isFullAdmin, userProgramId, filterProg, semesterFilterProg, moduleFilterProg]);

    const handleOpenProgram = (student: StudentProfile) => {
        setSelectedStudent(student);
        setFormData(prev => ({
            ...prev,
            moduleId: moduleFilterProg !== 'all' ? moduleFilterProg : '',
        }));
        setIsProgramDialogOpen(true);
    };

    const handleSave = async () => {
        if (!instituteId || !selectedStudent || !formData.moduleId || !formData.supervisorId || !formData.startDate || !formData.endDate) {
            toast({ title: "Datos incompletos", description: "Por favor complete todos los campos.", variant: "destructive" });
            return;
        }
        
        setIsSubmitting(true);
        try {
            const supervisor = teachers.find(t => t.documentId === formData.supervisorId);
            const prog = programs.find(p => p.id === selectedStudent.programId);
            const module = prog?.modules.find(m => m.code === formData.moduleId);

            await programEFSRT(instituteId, {
                studentId: selectedStudent.documentId,
                studentName: selectedStudent.fullName,
                programId: selectedStudent.programId,
                moduleId: formData.moduleId,
                moduleName: module?.name || 'Módulo desconocido',
                supervisorId: formData.supervisorId,
                supervisorName: supervisor?.fullName || 'Supervisor desconocido',
                location: formData.location,
                startDate: Timestamp.fromDate(new Date(formData.startDate)),
                endDate: Timestamp.fromDate(new Date(formData.endDate)),
            });

            toast({ title: "EFSRT Programada", description: `Se han programado las prácticas para ${selectedStudent.fullName}.` });
            setIsProgramDialogOpen(false);
            setFormData({ moduleId: '', supervisorId: '', location: '', startDate: '', endDate: '' });
            fetchData();
        } catch (error) {
            toast({ title: "Error", description: "No se pudo programar.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'Aprobado': return 'bg-green-100 text-green-800';
            case 'En Curso': return 'bg-blue-100 text-blue-800';
            case 'Por Evaluar': return 'bg-amber-100 text-amber-800';
            case 'Programado': return 'bg-purple-100 text-purple-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) return <div className="p-8 space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-64 w-full" /></div>;

    return (
        <div className="space-y-6">
            <Card className="bg-primary text-primary-foreground">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <ListChecks className="h-8 w-8" />
                        <div>
                            <CardTitle className="text-2xl">Gestión de Experiencias Formativas (EFSRT)</CardTitle>
                            <CardDescription className="text-primary-foreground/80">
                                Tablero de control para el programa: <span className="font-bold underline">{programs.find(p => p.id === userProgramId)?.name || 'Cargando...'}</span>
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <Tabs defaultValue="seguimiento">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="seguimiento">Seguimiento General</TabsTrigger>
                    <TabsTrigger value="programar">Programar Nueva Práctica</TabsTrigger>
                </TabsList>

                <TabsContent value="seguimiento" className="pt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Listado Maestro de Prácticas</CardTitle>
                            <CardDescription>Visualiza el estado de todos los estudiantes con EFSRT programadas.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* --- FILTROS SEGUIMIENTO --- */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label>Búsqueda rápida</Label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input placeholder="DNI o nombre..." value={filterSeg} onChange={(e) => setFilterSeg(e.target.value)} className="pl-9" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Módulo</Label>
                                    <Select value={moduleFilterSeg} onValueChange={setModuleFilterSeg}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos los Módulos</SelectItem>
                                            {currentProgramModules.map(m => (
                                                <SelectItem key={m.code} value={m.code}>{m.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Estado</Label>
                                    <Select value={statusFilterSeg} onValueChange={setStatusFilterSeg}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos los Estados</SelectItem>
                                            <SelectItem value="Programado">Programado</SelectItem>
                                            <SelectItem value="En Curso">En Curso</SelectItem>
                                            <SelectItem value="Por Evaluar">Por Evaluar</SelectItem>
                                            <SelectItem value="Aprobado">Aprobado</SelectItem>
                                            <SelectItem value="Desaprobado">Desaprobado</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Semestre</Label>
                                    <Select value={semesterFilterSeg} onValueChange={setSemesterFilterSeg}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos los Semestres</SelectItem>
                                            {semesters.map(s => <SelectItem key={s} value={String(s)}>Semestre {s}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="rounded-md border overflow-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[50px]">N°</TableHead>
                                            <TableHead>Estudiante</TableHead>
                                            <TableHead>Módulo</TableHead>
                                            <TableHead>Supervisor</TableHead>
                                            <TableHead>Empresa</TableHead>
                                            <TableHead className="text-center">Visitas</TableHead>
                                            <TableHead>Estado</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredAssignments.length > 0 ? filteredAssignments.map((a, index) => (
                                            <TableRow key={a.id}>
                                                <TableCell className="text-center font-bold text-muted-foreground">{index + 1}</TableCell>
                                                <TableCell className="font-bold">
                                                    {a.studentName}
                                                    <p className="text-[10px] font-mono text-muted-foreground">{a.studentId}</p>
                                                </TableCell>
                                                <TableCell className="text-[10px] leading-tight max-w-[200px]">{a.moduleName}</TableCell>
                                                <TableCell className="text-xs">{a.supervisorName}</TableCell>
                                                <TableCell className="text-xs">{a.location}</TableCell>
                                                <TableCell className="text-center"><Badge variant="outline">{a.visits?.length || 0}</Badge></TableCell>
                                                <TableCell><Badge className={getStatusColor(a.status)}>{a.status}</Badge></TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground italic">No se encontraron registros con los filtros aplicados.</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="programar" className="pt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Búsqueda de Estudiantes Pendientes</CardTitle>
                            <CardDescription>Filtra para identificar estudiantes que aún no tienen una práctica asignada.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* --- FILTROS PROGRAMAR --- */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Buscar Alumno</Label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input placeholder="DNI o nombre..." value={filterProg} onChange={(e) => setFilterProg(e.target.value)} className="pl-9" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Filtrar por Semestre</Label>
                                    <Select value={semesterFilterProg} onValueChange={setSemesterFilterProg}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos los Semestres</SelectItem>
                                            {semesters.map(s => <SelectItem key={s} value={String(s)}>Semestre {s}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Módulo a Programar</Label>
                                    <Select value={moduleFilterProg} onValueChange={setModuleFilterProg}>
                                        <SelectTrigger><SelectValue placeholder="Seleccione módulo..."/></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Ver Todos</SelectItem>
                                            {currentProgramModules.map(m => (
                                                <SelectItem key={m.code} value={m.code}>{m.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="rounded-md border overflow-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[50px]">N°</TableHead>
                                            <TableHead>DNI</TableHead>
                                            <TableHead>Nombre Completo</TableHead>
                                            <TableHead>Semestre Actual</TableHead>
                                            <TableHead className="text-right">Acción</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {studentsToProgram.length > 0 ? studentsToProgram.map((student, index) => (
                                            <TableRow key={student.documentId}>
                                                <TableCell className="text-center font-bold text-muted-foreground">{index + 1}</TableCell>
                                                <TableCell className="font-mono text-xs">{student.documentId}</TableCell>
                                                <TableCell className="font-medium">{student.fullName}</TableCell>
                                                <TableCell className="text-xs">
                                                    Semestre {calculateCurrentSemester(student.admissionYear, student.admissionPeriod)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button size="sm" onClick={() => handleOpenProgram(student)}>
                                                        <PlusCircle className="mr-2 h-4 w-4" /> Programar
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground italic">
                                                    No se encontraron estudiantes pendientes con estos filtros.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Dialog open={isProgramDialogOpen} onOpenChange={setIsProgramDialogOpen}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Programar EFSRT: {selectedStudent?.fullName}</DialogTitle>
                        <DialogDescription>Asigna los detalles de la práctica profesional.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Módulo Profesional</Label>
                                <Select value={formData.moduleId} onValueChange={(v) => setFormData(p => ({...p, moduleId: v}))}>
                                    <SelectTrigger><SelectValue placeholder="Seleccione módulo"/></SelectTrigger>
                                    <SelectContent>
                                        {selectedStudent && programs.find(p => p.id === selectedStudent.programId)?.modules.map(m => (
                                            <SelectItem key={m.code} value={m.code}>{m.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Docente Supervisor</Label>
                                <Select value={formData.supervisorId} onValueChange={(v) => setFormData(p => ({...p, supervisorId: v}))}>
                                    <SelectTrigger><SelectValue placeholder="Seleccione docente"/></SelectTrigger>
                                    <SelectContent>
                                        {teachers.map(t => <SelectItem key={t.documentId} value={t.documentId}>{t.fullName}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Empresa / Institución</Label>
                            <Input value={formData.location} onChange={(e) => setFormData(p => ({...p, location: e.target.value}))} placeholder="Lugar de prácticas" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>Fecha de Inicio</Label><Input type="date" value={formData.startDate} onChange={(e) => setFormData(p => ({...p, startDate: e.target.value}))} /></div>
                            <div className="space-y-2"><Label>Fecha de Fin</Label><Input type="date" value={formData.endDate} onChange={(e) => setFormData(p => ({...p, endDate: e.target.value}))} /></div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsProgramDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={isSubmitting}>{isSubmitting ? <Loader2 className="animate-spin" /> : "Confirmar Programación"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
