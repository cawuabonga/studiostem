
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getStudentProfiles, getPrograms, getTeachers, programEFSRT } from '@/config/firebase';
import type { StudentProfile, Program, Teacher } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowRight, Search, MapPin, Calendar, User } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Timestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminEFSRTPage() {
    const { instituteId } = useAuth();
    const { toast } = useToast();
    const [students, setStudents] = useState<StudentProfile[]>([]);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [filter, setFilter] = useState('');
    const [isProgramDialogOpen, setIsProgramDialogOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
    
    const [formData, setFormData] = useState({
        moduleId: '',
        supervisorId: '',
        location: '',
        startDate: '',
        endDate: '',
    });

    const fetchData = useCallback(async () => {
        if (!instituteId) return;
        setLoading(true);
        try {
            const [fetchedStudents, fetchedPrograms, fetchedTeachers] = await Promise.all([
                getStudentProfiles(instituteId),
                getPrograms(instituteId),
                getTeachers(instituteId)
            ]);
            setStudents(fetchedStudents);
            setPrograms(fetchedPrograms);
            setTeachers(fetchedTeachers);
        } catch (error) {
            toast({ title: "Error", description: "No se pudieron cargar los datos.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [instituteId, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredStudents = students.filter(s => 
        s.fullName.toLowerCase().includes(filter.toLowerCase()) || 
        s.documentId.includes(filter)
    );

    const handleOpenProgram = (student: StudentProfile) => {
        setSelectedStudent(student);
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
            const program = programs.find(p => p.id === selectedStudent.programId);
            const module = program?.modules.find(m => m.code === formData.moduleId);

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
        } catch (error) {
            toast({ title: "Error", description: "No se pudo programar la EFSRT.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-64 w-full" /></div>;

    const selectedStudentProgram = selectedStudent ? programs.find(p => p.id === selectedStudent.programId) : null;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Programación de Experiencias Formativas (EFSRT)</CardTitle>
                    <CardDescription>Asigna lugar, fechas y supervisores a los estudiantes para sus prácticas por módulo profesional.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 max-w-sm">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Buscar estudiante por DNI o nombre..." 
                                value={filter} 
                                onChange={(e) => setFilter(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>DNI</TableHead>
                                    <TableHead>Nombre Completo</TableHead>
                                    <TableHead>Programa de Estudios</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredStudents.map(student => (
                                    <TableRow key={student.documentId}>
                                        <TableCell className="font-mono text-xs">{student.documentId}</TableCell>
                                        <TableCell className="font-medium">{student.fullName}</TableCell>
                                        <TableCell>{programs.find(p => p.id === student.programId)?.name}</TableCell>
                                        <TableCell className="text-right">
                                            <Button size="sm" onClick={() => handleOpenProgram(student)}>
                                                Programar Práctica <ArrowRight className="ml-2 h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isProgramDialogOpen} onOpenChange={setIsProgramDialogOpen}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Programar EFSRT: {selectedStudent?.fullName}</DialogTitle>
                        <DialogDescription>Configure los detalles de la práctica profesional para este estudiante.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Módulo Profesional</Label>
                                <Select value={formData.moduleId} onValueChange={(v) => setFormData(p => ({...p, moduleId: v}))}>
                                    <SelectTrigger><SelectValue placeholder="Seleccione módulo"/></SelectTrigger>
                                    <SelectContent>
                                        {selectedStudentProgram?.modules.map(m => (
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
                                        {teachers.map(t => (
                                            <SelectItem key={t.documentId} value={t.documentId}>{t.fullName}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Empresa / Institución de Práctica</Label>
                            <Input value={formData.location} onChange={(e) => setFormData(p => ({...p, location: e.target.value}))} placeholder="Nombre de la empresa o lugar de prácticas" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Fecha de Inicio</Label>
                                <Input type="date" value={formData.startDate} onChange={(e) => setFormData(p => ({...p, startDate: e.target.value}))} />
                            </div>
                            <div className="space-y-2">
                                <Label>Fecha de Fin (Aprox.)</Label>
                                <Input type="date" value={formData.endDate} onChange={(e) => setFormData(p => ({...p, endDate: e.target.value}))} />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsProgramDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirmar Programación
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
