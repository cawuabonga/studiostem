
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getEFSRTAssignmentsForStudent, getPrograms, getStudentProfile, uploadEFSRTReport } from '@/config/firebase';
import type { EFSRTAssignment, Program } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FileUp, MapPin, Calendar, Clock, CheckCircle, MessageSquare, Loader2, Users } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function StudentEFSRTPage() {
    const { user, instituteId } = useAuth();
    const { toast } = useToast();
    const [assignments, setAssignments] = useState<EFSRTAssignment[]>([]);
    const [program, setProgram] = useState<Program | null>(null);
    const [loading, setLoading] = useState(true);
    const [isUploading, setIsUploading] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!instituteId || !user?.documentId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const [studentData, allAssignments, allPrograms] = await Promise.all([
                getStudentProfile(instituteId, user.documentId),
                getEFSRTAssignmentsForStudent(instituteId, user.documentId),
                getPrograms(instituteId)
            ]);

            setAssignments(allAssignments);
            if (studentData) {
                const studentProgram = allPrograms.find(p => p.id === studentData.programId);
                setProgram(studentProgram || null);
            }
        } catch (error) {
            toast({ title: "Error", description: "No se pudo cargar la información de tus prácticas.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [instituteId, user, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleUploadReport = async (assignmentId: string, event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !instituteId) return;

        setIsUploading(assignmentId);
        try {
            await uploadEFSRTReport(instituteId, assignmentId, 'student', file);
            toast({ title: "Informe Subido", description: "Tu informe ha sido enviado para evaluación del supervisor." });
            fetchData();
        } catch (error) {
            toast({ title: "Error", description: "No se pudo subir el archivo.", variant: "destructive" });
        } finally {
            setIsUploading(null);
        }
    };

    if (loading) return <div className="p-8 space-y-6"><Skeleton className="h-32 w-full" /><div className="grid md:grid-cols-3 gap-6"><Skeleton className="h-64 w-full" /><Skeleton className="h-64 w-full" /><Skeleton className="h-64 w-full" /></div></div>;

    return (
        <div className="space-y-6">
            <Card className="bg-primary text-primary-foreground">
                <CardHeader>
                    <CardTitle className="text-2xl">Mis Experiencias Formativas (EFSRT)</CardTitle>
                    <CardDescription className="text-primary-foreground/80">
                        Seguimiento de tus prácticas pre-profesionales obligatorias por cada módulo de tu carrera.
                    </CardDescription>
                </CardHeader>
            </Card>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {program?.modules.map(module => {
                    const assignment = assignments.find(a => a.moduleId === module.code);
                    
                    return (
                        <Card key={module.code} className={`flex flex-col border-t-4 ${assignment?.status === 'Aprobado' ? 'border-t-green-500' : 'border-t-primary'}`}>
                            <CardHeader>
                                <div className="flex justify-between items-start mb-2">
                                    <Badge variant="secondary" className="font-mono text-[10px]">{module.code}</Badge>
                                    <Badge variant={assignment?.status === 'Aprobado' ? 'default' : 'outline'}>
                                        {assignment?.status || 'Pendiente'}
                                    </Badge>
                                </div>
                                <CardTitle className="text-lg leading-tight">{module.name}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-grow space-y-4">
                                {assignment ? (
                                    <div className="space-y-3 text-sm">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <MapPin className="h-4 w-4 text-primary" />
                                            <span className="font-medium text-foreground">{assignment.location}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Calendar className="h-4 w-4 text-primary" />
                                            <span>{format(assignment.startDate.toDate(), 'dd/MM/yy')} - {format(assignment.endDate.toDate(), 'dd/MM/yy')}</span>
                                        </div>
                                        <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                                            <Users className="h-4 w-4 text-primary" />
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-muted-foreground leading-none">Supervisor Asignado</span>
                                                <span className="font-bold text-xs">{assignment.supervisorName}</span>
                                            </div>
                                        </div>
                                        
                                        {assignment.visits.length > 0 && (
                                            <div className="pt-2">
                                                <p className="font-bold text-xs mb-2 flex items-center gap-1">
                                                    <MessageSquare className="h-3 w-3 text-primary" /> Visitas del Supervisor ({assignment.visits.length})
                                                </p>
                                                <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                                                    {assignment.visits.map((visit, i) => (
                                                        <div key={i} className="bg-muted/50 p-2 rounded text-[10px] border">
                                                            <div className="flex justify-between font-bold mb-1 opacity-70">
                                                                <span>{format(visit.date.toDate(), 'dd/MM/yy')}</span>
                                                                <span>{visit.type}</span>
                                                            </div>
                                                            <p className="italic">"{visit.observations}"</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-10 text-center space-y-2 opacity-50">
                                        <Clock className="h-8 w-8" />
                                        <p className="text-xs italic">Aún no se ha programado la práctica para este módulo.</p>
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="pt-0">
                                {assignment && (assignment.status === 'En Curso' || assignment.status === 'Programado') && (
                                    <div className="w-full space-y-2">
                                        <Label htmlFor={`file-${assignment.id}`} className="text-[10px] font-bold uppercase text-muted-foreground">Enviar Informe Final</Label>
                                        <div className="flex gap-2">
                                            <Input 
                                                id={`file-${assignment.id}`}
                                                type="file" 
                                                onChange={(e) => handleUploadReport(assignment.id, e)}
                                                disabled={!!isUploading}
                                                className="h-8 text-[10px]"
                                            />
                                            {isUploading === assignment.id && <Loader2 className="h-4 w-4 animate-spin self-center" />}
                                        </div>
                                    </div>
                                )}
                                {assignment?.status === 'Aprobado' && (
                                    <div className="w-full bg-green-50 border border-green-100 p-2 rounded-md text-center">
                                        <p className="text-green-700 font-bold text-lg leading-none">NOTA: {assignment.grade}</p>
                                        <p className="text-green-600 text-[10px] mt-1 font-medium flex items-center justify-center gap-1">
                                            <CheckCircle className="h-3 w-3" /> MÓDULO CULMINADO
                                        </p>
                                    </div>
                                )}
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
