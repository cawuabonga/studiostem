
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getStudentProfiles, getPrograms, getTeachers, programEFSRT, getAllEFSRTAssignments, updateEFSRTAssignment, deleteEFSRTAssignment } from '@/config/firebase';
import type { StudentProfile, Program, Teacher, EFSRTAssignment, UnitPeriod, EFSRTStatus } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, ListChecks, PlusCircle, Edit, Trash2, Info, Printer, Check, ChevronsUpDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Timestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';

const semesters = Array.from({ length: 10 }, (_, i) => i + 1);

const calculateCurrentSemester = (admissionYear: string, admissionPeriod: UnitPeriod): number => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const yearsDiff = currentYear - parseInt(admissionYear);
    let semesterCount = yearsDiff * 2;
    if (admissionPeriod === 'MAR-JUL') semesterCount += 1;
    if (currentMonth >= 7) semesterCount += 1;
    else if (admissionPeriod === 'AGO-DIC') semesterCount -= 1;
    return Math.max(1, semesterCount);
};

export default function AdminEFSRTPage() {
    const { instituteId, institute, user, hasPermission } = useAuth();
    const { toast } = useToast();
    const [students, setStudents] = useState<StudentProfile[]>([]);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [allAssignments, setAllAssignments] = useState<EFSRTAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    
    const [filterSeg, setFilterSeg] = useState('');
    const [semesterFilterSeg, setSemesterFilterSeg] = useState<string>('all');
    const [moduleFilterSeg, setModuleFilterSeg] = useState<string>('all');
    const [statusFilterSeg, setStatusFilterSeg] = useState<string>('all');

    const [filterProg, setFilterProg] = useState('');
    const [semesterFilterProg, setSemesterFilterProg] = useState<string>('all');
    const [moduleFilterProg, setModuleFilterProg] = useState<string>('all');

    const [isProgramDialogOpen, setIsProgramDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
    const [selectedAssignment, setSelectedAssignment] = useState<EFSRTAssignment | null>(null);
    
    // Searchable Combobox state
    const [supervisorSearchOpen, setSupervisorSearchOpen] = useState(false);

    const [formData, setFormData] = useState({
        moduleId: '',
        supervisorId: '',
        location: '',
        startDate: '',
        endDate: '',
    });

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

    const getEffectiveStatus = (a: EFSRTAssignment): EFSRTStatus => {
        if (a.status === 'Aprobado' || a.status === 'Desaprobado') return a.status;
        const now = new Date();
        const start = a.startDate.toDate();
        const end = a.endDate.toDate();
        
        if (now > end || a.studentReportUrl) return 'Por Evaluar';
        if (now >= start) return 'En Curso';
        return 'Programado';
    };

    const currentProgramModules = useMemo(() => {
        if (!userProgramId) return [];
        return programs.find(p => p.id === userProgramId)?.modules || [];
    }, [programs, userProgramId]);

    const filteredAssignments = useMemo(() => {
        const baseAssignments = isFullAdmin && !userProgramId 
            ? allAssignments 
            : allAssignments.filter(a => a.programId === userProgramId);

        return baseAssignments.filter(a => {
            const effectiveStatus = getEffectiveStatus(a);
            const matchesText = a.studentName.toLowerCase().includes(filterSeg.toLowerCase()) || a.studentId.includes(filterSeg);
            if (!matchesText) return false;
            if (moduleFilterSeg !== 'all' && a.moduleId !== moduleFilterSeg) return false;
            if (statusFilterSeg !== 'all' && effectiveStatus !== statusFilterSeg) return false;
            if (semesterFilterSeg !== 'all') {
                const student = students.find(s => s.documentId === a.studentId);
                if (student) {
                    const actualSem = student.currentSemester || calculateCurrentSemester(student.admissionYear, student.admissionPeriod);
                    if (actualSem !== parseInt(semesterFilterSeg)) return false;
                } else return false;
            }
            return true;
        }).sort((a, b) => a.studentName.localeCompare(b.studentName, 'es'));
    }, [allAssignments, isFullAdmin, userProgramId, filterSeg, moduleFilterSeg, statusFilterSeg, semesterFilterSeg, students]);

    const studentsToProgram = useMemo(() => {
        if (!filterProg && semesterFilterProg === 'all') {
            return [];
        }

        const myProgramStudents = isFullAdmin && !userProgramId 
            ? students 
            : students.filter(s => s.programId === userProgramId);

        return myProgramStudents.filter(student => {
            const matchesText = student.fullName.toLowerCase().includes(filterProg.toLowerCase()) || student.documentId.includes(filterProg);
            if (!matchesText) return false;
            if (semesterFilterProg !== 'all') {
                const actualSem = student.currentSemester || calculateCurrentSemester(student.admissionYear, student.admissionPeriod);
                if (actualSem !== parseInt(semesterFilterProg)) return false;
            }
            if (moduleFilterProg !== 'all') {
                const alreadyAssigned = allAssignments.some(a => 
                    a.studentId === student.documentId && a.moduleId === moduleFilterProg
                );
                if (alreadyAssigned) return false;
            }
            return true;
        }).sort((a, b) => a.lastName.localeCompare(b.lastName, 'es'));
    }, [students, allAssignments, isFullAdmin, userProgramId, filterProg, semesterFilterProg, moduleFilterProg]);

    const handlePrintGeneralReport = () => {
        setIsPrinting(true);
        const printContent = document.getElementById('efsrt-admin-print-area')?.innerHTML;
        if (!printContent) return;

        const iframeId = 'efsrt-admin-print-iframe';
        let iframe = document.getElementById(iframeId) as HTMLIFrameElement;
        
        if (!iframe) {
            iframe = document.createElement('iframe');
            iframe.id = iframeId;
            iframe.style.position = 'fixed';
            iframe.style.right = '0';
            iframe.style.bottom = '0';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = '0';
            document.body.appendChild(iframe);
        }

        const styles = Array.from(document.styleSheets)
            .map(s => s.href ? `<link rel="stylesheet" href="${s.href}">` : '')
            .join('');

        const iframeDoc = iframe.contentWindow?.document;
        if (iframeDoc) {
            iframeDoc.open();
            iframeDoc.write(`
                <html>
                    <head>
                        <title>Reporte Seguimiento EFSRT</title>
                        ${styles}
                        <style>
                            @media print {
                                @page { margin: 15mm; size: A4 portrait; }
                                body { 
                                    -webkit-print-color-adjust: exact; 
                                    print-color-adjust: exact; 
                                    padding: 0; 
                                    font-family: 'Lato', sans-serif;
                                    counter-reset: page;
                                }
                                .no-print { display: none !important; }
                                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; page-break-inside: auto; }
                                tr { page-break-inside: avoid; page-break-after: auto; }
                                th, td { border: 1px solid black; padding: 6px; text-align: left; font-size: 8pt; }
                                th { background-color: #f3f4f6; text-transform: uppercase; font-weight: bold; }
                                .header { display: flex; justify-content: space-between; border-bottom: 2px solid black; padding-bottom: 10px; margin-bottom: 20px; }
                                .title { text-align: center; text-transform: uppercase; font-weight: 800; border-bottom: 2px solid black; padding: 10px 0; margin-bottom: 30px; font-size: 13pt; }
                                .signature-area { margin-top: 80px; display: flex; justify-content: center; page-break-inside: avoid; }
                                .signature-box { border-top: 1px solid black; width: 350px; text-align: center; padding-top: 8px; font-size: 9pt; line-height: 1.4; }
                                .print-footer { position: fixed; bottom: 0; left: 0; right: 0; height: 30px; text-align: right; font-size: 7pt; color: #666; border-top: 1px solid #eee; padding-top: 5px; }
                                .page-number:after { counter-increment: page; content: "Página " counter(page); }
                            }
                        </style>
                    </head>
                    <body>
                        ${printContent}
                        <div class="print-footer"><span class="page-number"></span></div>
                    </body>
                </html>
            `);
            iframeDoc.close();
            
            setTimeout(() => {
                iframe.contentWindow?.focus();
                iframe.contentWindow?.print();
                setIsPrinting(false);
            }, 500);
        }
    };

    const handleOpenProgram = (student: StudentProfile) => {
        setSelectedStudent(student);
        setSelectedAssignment(null);
        setFormData({
            moduleId: moduleFilterProg !== 'all' ? moduleFilterProg : '',
            supervisorId: '',
            location: '',
            startDate: '',
            endDate: '',
        });
        setIsProgramDialogOpen(true);
    };

    const handleOpenEdit = (assignment: EFSRTAssignment) => {
        const student = students.find(s => s.documentId === assignment.studentId);
        if (!student) return;
        
        setSelectedStudent(student);
        setSelectedAssignment(assignment);
        setFormData({
            moduleId: assignment.moduleId,
            supervisorId: assignment.supervisorId,
            location: assignment.location,
            startDate: assignment.startDate.toDate().toISOString().split('T')[0],
            endDate: assignment.endDate.toDate().toISOString().split('T')[0],
        });
        setIsProgramDialogOpen(true);
    };

    const handleOpenDelete = (assignment: EFSRTAssignment) => {
        setSelectedAssignment(assignment);
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!instituteId || !selectedAssignment) return;
        setIsSubmitting(true);
        try {
            await deleteEFSRTAssignment(instituteId, selectedAssignment.id);
            toast({ title: "Registro Eliminado", description: "La programación de EFSRT ha sido eliminada." });
            setIsDeleteDialogOpen(false);
            setSelectedAssignment(null);
            fetchData();
        } catch (error) {
            toast({ title: "Error", description: "No se pudo eliminar el registro.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSave = async () => {
        if (!instituteId || !selectedStudent || !formData.moduleId || !formData.supervisorId || !formData.startDate || !formData.endDate) {
            toast({ title: "Atención", description: "Por favor complete todos los campos.", variant: "destructive" });
            return;
        }
        
        setIsSubmitting(true);
        try {
            const supervisor = teachers.find(t => t.documentId === formData.supervisorId);
            const prog = programs.find(p => p.id === selectedStudent.programId);
            const module = prog?.modules.find(m => m.code === formData.moduleId);

            const data = {
                studentId: selectedStudent.documentId,
                studentName: `${selectedStudent.lastName}, ${selectedStudent.firstName}`,
                programId: selectedStudent.programId,
                moduleId: formData.moduleId,
                moduleName: module?.name || 'Módulo desconocido',
                supervisorId: formData.supervisorId,
                supervisorName: supervisor?.fullName || 'Supervisor desconocido',
                location: formData.location,
                startDate: Timestamp.fromDate(new Date(formData.startDate)),
                endDate: Timestamp.fromDate(new Date(formData.endDate)),
            };

            if (selectedAssignment) {
                await updateEFSRTAssignment(instituteId, selectedAssignment.id, data);
                toast({ title: "EFSRT Actualizada", description: `Se ha modificado la programación para ${selectedStudent.fullName}.` });
            } else {
                await programEFSRT(instituteId, data);
                toast({ title: "EFSRT Programada", description: `Se han programado las prácticas para ${selectedStudent.fullName}.` });
            }

            setIsProgramDialogOpen(false);
            setFormData({ moduleId: '', supervisorId: '', location: '', startDate: '', endDate: '' });
            setSelectedAssignment(null);
            fetchData();
        } catch (error) {
            toast({ title: "Error", description: "No se pudo procesar la solicitud.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusColor = (status: EFSRTStatus) => {
        switch(status) {
            case 'Aprobado': return 'bg-green-100 text-green-800';
            case 'En Curso': return 'bg-blue-100 text-blue-800';
            case 'Por Evaluar': return 'bg-amber-100 text-amber-800';
            case 'Programado': return 'bg-purple-100 text-purple-800';
            case 'Desaprobado': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) return <div className="p-8 space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-64 w-full" /></div>;

    return (
        <div className="space-y-6">
            <Card className="bg-primary text-primary-foreground">
                <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center gap-3">
                            <ListChecks className="h-8 w-8" />
                            <div>
                                <CardTitle className="text-2xl">Gestión de Experiencias Formativas (EFSRT)</CardTitle>
                                <CardDescription className="text-primary-foreground/80">
                                    Programa: <span className="font-bold underline">{programs.find(p => p.id === userProgramId)?.name || 'Cargando...'}</span>
                                </CardDescription>
                            </div>
                        </div>
                        <Button variant="secondary" onClick={handlePrintGeneralReport} disabled={isPrinting || filteredAssignments.length === 0} className="font-bold shadow-lg">
                            {isPrinting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
                            Imprimir Reporte General
                        </Button>
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
                                            <TableHead>Estado Actual</TableHead>
                                            <TableHead className="text-right">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredAssignments.length > 0 ? filteredAssignments.map((a, index) => {
                                            const status = getEffectiveStatus(a);
                                            return (
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
                                                    <TableCell><Badge className={getStatusColor(status)}>{status}</Badge></TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-1">
                                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(a)}>
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleOpenDelete(a)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        }) : (
                                            <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground italic">No se encontraron registros.</TableCell></TableRow>
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
                            <CardDescription>Identifica estudiantes sin prácticas asignadas.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
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
                                            <TableHead>Estudiante (Apellidos y Nombres)</TableHead>
                                            <TableHead>Semestre Actual</TableHead>
                                            <TableHead className="text-right">Acción</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {studentsToProgram.length > 0 ? studentsToProgram.map((student, index) => (
                                            <TableRow key={student.documentId}>
                                                <TableCell className="text-center font-bold text-muted-foreground">{index + 1}</TableCell>
                                                <TableCell className="font-mono text-xs">{student.documentId}</TableCell>
                                                <TableCell className="font-bold uppercase">{student.fullName}</TableCell>
                                                <TableCell className="text-xs">
                                                    Semestre {student.currentSemester || calculateCurrentSemester(student.admissionYear, student.admissionPeriod)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button size="sm" onClick={() => handleOpenProgram(student)}>
                                                        <PlusCircle className="mr-2 h-4 w-4" /> Programar
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">
                                                    {!filterProg && semesterFilterProg === 'all' 
                                                        ? (
                                                            <div className="flex flex-col items-center gap-2">
                                                                <Info className="h-5 w-5 opacity-50" />
                                                                <p>Utilice los filtros superiores para buscar estudiantes.</p>
                                                            </div>
                                                        )
                                                        : "No se encontraron estudiantes."}
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

            {/* AREA DE IMPRESIÓN (OCULTA) */}
            <div id="efsrt-admin-print-area" className="hidden">
                <div className="header">
                    <div className="flex items-center gap-4">
                        {institute?.logoUrl && <img src={institute.logoUrl} alt="Logo" style={{ height: '60px' }} />}
                        <div>
                            <p style={{ fontSize: '14pt', fontWeight: 'bold', margin: 0 }}>{institute?.name.toUpperCase()}</p>
                            <p style={{ fontSize: '8pt', color: '#666', margin: 0 }}>SISTEMA DE GESTIÓN ACADÉMICA - ADMINISTRACIÓN EFSRT</p>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '9pt' }}>
                        <p>FECHA: {format(new Date(), 'dd/MM/yyyy')}</p>
                    </div>
                </div>

                <div className="title">
                    REPORTE GENERAL DE SEGUIMIENTO DE EXPERIENCIAS FORMATIVAS EN SITUACIONES REALES DE TRABAJO (EFSRT)
                </div>

                <table>
                    <thead>
                        <tr>
                            <th style={{ width: '30px' }}>N°</th>
                            <th>ESTUDIANTE / DNI</th>
                            <th>EMPRESA / SEDE</th>
                            <th>DOCENTE SUPERVISOR</th>
                            <th style={{ width: '100px', textAlign: 'center' }}>ESTADO</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAssignments.map((a, idx) => (
                            <tr key={a.id}>
                                <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                                <td>
                                    <p style={{ margin: 0, fontWeight: 'bold' }}>{a.studentName.toUpperCase()}</p>
                                    <p style={{ margin: 0, fontSize: '7pt', color: '#555' }}>DNI: {a.studentId}</p>
                                </td>
                                <td>{a.location.toUpperCase()}</td>
                                <td>{a.supervisorName.toUpperCase()}</td>
                                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{getEffectiveStatus(a).toUpperCase()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="signature-area" style={{ marginTop: '100px' }}>
                    <div className="signature-box">
                        <p style={{ fontWeight: 'bold', margin: '0 0 2px 0', fontSize: '10pt' }}>{user?.displayName?.toUpperCase()}</p>
                        <p style={{ margin: '0 0 2px 0', fontWeight: 'bold', fontSize: '8pt', textTransform: 'uppercase' }}>
                            {user?.role === 'Admin' ? 'COORDINACIÓN ACADÉMICA' : (user?.role?.toUpperCase() || 'COORDINADOR')}
                        </p>
                        <p style={{ margin: 0, fontSize: '8pt', color: '#444', fontWeight: '600' }}>
                            {programs.find(p => p.id === userProgramId)?.name.toUpperCase() || 'PROGRAMA DE ESTUDIOS'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Dialogs */}
            <Dialog open={isProgramDialogOpen} onOpenChange={(open) => !open && setIsProgramDialogOpen(false)}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>{selectedAssignment ? 'Editar' : 'Programar'} EFSRT: {selectedStudent?.fullName}</DialogTitle>
                        <DialogDescription>Asigna o modifica los detalles de la práctica profesional.</DialogDescription>
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
                                <Popover open={supervisorSearchOpen} onOpenChange={setSupervisorSearchOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={supervisorSearchOpen}
                                            className="w-full justify-between font-normal h-10"
                                        >
                                            <span className="truncate">
                                                {formData.supervisorId
                                                    ? teachers.find((t) => t.documentId === formData.supervisorId)?.fullName
                                                    : "Buscar docente..."}
                                            </span>
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                        <Command>
                                            <CommandInput placeholder="Nombre del docente..." />
                                            <CommandList>
                                                <CommandEmpty>No se encontró docente.</CommandEmpty>
                                                <CommandGroup>
                                                    {teachers.map((t) => (
                                                        <CommandItem
                                                            key={t.documentId}
                                                            value={t.fullName}
                                                            onSelect={() => {
                                                                setFormData(p => ({...p, supervisorId: t.documentId}));
                                                                setSupervisorSearchOpen(false);
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    formData.supervisorId === t.documentId ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {t.fullName}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
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
                        <Button onClick={handleSave} disabled={isSubmitting}>{isSubmitting ? <Loader2 className="animate-spin" /> : (selectedAssignment ? "Guardar Cambios" : "Confirmar Programación")}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Está seguro de eliminar este registro?</AlertDialogTitle>
                        <AlertDialogDescription>Esta acción eliminará permanentemente la programación de prácticas.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Trash2 className="mr-2 h-4 w-4" />}
                            Eliminar Registro
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
