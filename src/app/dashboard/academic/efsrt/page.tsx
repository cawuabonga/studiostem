
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getEFSRTAssignmentsForStudent, getPrograms, getStudentProfile, uploadEFSRTReport } from '@/config/firebase';
import type { EFSRTAssignment, Program, StudentProfile, EFSRTStatus } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FileUp, MapPin, Calendar, Clock, CheckCircle, AlertTriangle, MessageSquare, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const statusConfig: Record<EFSRTStatus, { color: string; icon: any }> = {
    'Pendiente': { color: 'bg-gray-100 text-gray-800', icon: Clock },
    'Programado': { color: 'bg-blue-100 text-blue-800', icon: Calendar },
    'En Curso': { color: 'bg-yellow-100 text-yellow-800', icon: MapPin },
    'Por Evaluar': { color: 'bg-purple-100 text-purple-800', icon: FileUp },
    'Aprobado': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
    'Desaprobado': { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
};

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
            toast({ title: "Informe Subido", description: "Tu informe ha sido enviado para evaluación." });
            fetchData();
        } catch (error) {
            toast({ title: "Error", description: "No se pudo subir el archivo.", variant: "destructive" });
        } finally {
            setIsUploading(null);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-24 w-full" />
                <div className="grid gap-6 md:grid-cols-2">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Mis Experiencias Formativas (EFSRT)</CardTitle>
                    <CardDescription>
                        Seguimiento de prácticas pre-profesionales por cada módulo de tu carrera.
                    </CardDescription>
                </CardHeader>
            </Card>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {program?.modules.map(module => {
                    const assignment = assignments.find(a => a.moduleId === module.code);
                    const config = statusConfig[assignment?.status || 'Pendiente'];
                    const StatusIcon = config.icon;

                    return (
                        <Card key={module.code} className="flex flex-col">
                            <CardHeader>
                                <div className="flex justify-between items-start mb-2">
                                    <Badge variant="outline">{module.code}</Badge>
                                    <Badge className={config.color}>
                                        <StatusIcon className="mr-1 h-3 w-3" />
                                        {assignment?.status || 'Pendiente'}
                                    </Badge>
                                </div>
                                <CardTitle className="text-lg">{module.name}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-grow space-y-4">
                                {assignment ? (
                                    <div className="space-y-3 text-sm">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <MapPin className="h-4 w-4" />
                                            <span>{assignment.location}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Calendar className="h-4 w-4" />
                                            <span>{format(assignment.startDate.toDate(), 'dd/MM/yy')} - {format(assignment.endDate.toDate(), 'dd/MM/yy')}</span>
                                        </div>
                                        <div className="flex items-center gap-2 font-medium">
                                            <Users className="h-4 w-4" />
                                            <span>Sup: {assignment.supervisorName}</span>
                                        </div>
                                        
                                        {assignment.visits.length > 0 && (
                                            <div className="pt-2 border-t">
                                                <p className="font-semibold mb-2 flex items-center gap-1">
                                                    <MessageSquare className="h-4 w-4" /> Visitas registradas ({assignment.visits.length})
                                                </p>
                                                <ul className="space-y-2 max-h-32 overflow-y-auto pr-2">
                                                    {assignment.visits.map((visit, i) => (
                                                        <li key={i} className="bg-muted p-2 rounded text-xs">
                                                            <div className="flex justify-between font-bold mb-1">
                                                                <span>{format(visit.date.toDate(), 'dd/MM/yy')}</span>
                                                                <span>{visit.type}</span>
                                                            </div>
                                                            <p className="italic">{visit.observations}</p>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-center py-8 text-muted-foreground italic">
                                        Aún no se ha programado la práctica para este módulo.
                                    </p>
                                )}
                            </CardContent>
                            <CardFooter>
                                {assignment && assignment.status === 'En Curso' && (
                                    <div className="w-full space-y-2">
                                        <Label htmlFor={`file-${assignment.id}`} className="text-xs font-bold">Subir Informe Final</Label>
                                        <div className="flex gap-2">
                                            <Input 
                                                id={`file-${assignment.id}`}
                                                type="file" 
                                                onChange={(e) => handleUploadReport(assignment.id, e)}
                                                disabled={!!isUploading}
                                                className="h-9 text-xs"
                                            />
                                            {isUploading === assignment.id && <Loader2 className="h-4 w-4 animate-spin self-center" />}
                                        </div>
                                    </div>
                                )}
                                {assignment?.status === 'Aprobado' && (
                                    <div className="w-full bg-green-50 p-2 rounded-md text-center">
                                        <p className="text-green-700 font-bold text-lg">NOTA: {assignment.grade}</p>
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
