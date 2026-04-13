
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getEFSRTAssignmentsForStudent, getPrograms, getStudentProfile, uploadEFSRTReport, saveEFSRTReportUrl } from '@/config/firebase';
import type { EFSRTAssignment, Program, EFSRTStatus } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Calendar, Clock, CheckCircle, MessageSquare, Loader2, Users, FileText, Link as LinkIcon, Send, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function StudentEFSRTPage() {
    const { user, instituteId } = useAuth();
    const { toast } = useToast();
    const [assignments, setAssignments] = useState<EFSRTAssignment[]>([]);
    const [program, setProgram] = useState<Program | null>(null);
    const [loading, setLoading] = useState(true);
    const [isUploading, setIsUploading] = useState<string | null>(null);

    // Submission states
    const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
    const [selectedAssignmentForReport, setSelectedAssignmentForReport] = useState<EFSRTAssignment | null>(null);
    const [reportLink, setReportLink] = useState('');

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
            toast({ title: "Error", description: "No se pudo cargar la información.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [instituteId, user, toast]);

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

    const handleUploadReport = async (assignmentId: string, event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !instituteId) return;
        setIsUploading(assignmentId);
        try {
            await uploadEFSRTReport(instituteId, assignmentId, 'student', file);
            toast({ title: "Informe Subido", description: "Archivo enviado para evaluación." });
            setIsSubmitDialogOpen(false);
            fetchData();
        } catch (error) {
            toast({ title: "Error", description: "No se pudo subir el archivo.", variant: "destructive" });
        } finally {
            setIsUploading(null);
        }
    };

    const handleSaveReportUrl = async () => {
        if (!instituteId || !selectedAssignmentForReport || !reportLink) return;
        setIsUploading(selectedAssignmentForReport.id);
        try {
            await saveEFSRTReportUrl(instituteId, selectedAssignmentForReport.id, 'student', reportLink);
            toast({ title: "Enlace Guardado", description: "El enlace al informe ha sido enviado." });
            setIsSubmitDialogOpen(false);
            setReportLink('');
            fetchData();
        } catch (error) {
            toast({ title: "Error", description: "No se pudo guardar el enlace.", variant: "destructive" });
        } finally {
            setIsUploading(null);
        }
    };

    const handleOpenSubmitDialog = (assignment: EFSRTAssignment) => {
        setSelectedAssignmentForReport(assignment);
        setReportLink(assignment.studentReportUrl?.startsWith('http') && !assignment.studentReportUrl.includes('firebasestorage') ? assignment.studentReportUrl : '');
        setIsSubmitDialogOpen(true);
    };

    if (loading) return <div className="p-8 space-y-6"><Skeleton className="h-32 w-full" /><div className="grid md:grid-cols-3 gap-6"><Skeleton className="h-64 w-full" /></div></div>;

    return (
        <div className="space-y-6">
            <Card className="bg-primary text-primary-foreground shadow-lg border-0 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <CheckCircle className="h-24 w-24" />
                </div>
                <CardHeader>
                    <CardTitle className="text-2xl">Mis Experiencias Formativas (EFSRT)</CardTitle>
                    <CardDescription className="text-primary-foreground/80">Seguimiento automático basado en calendario y registro de informes.</CardDescription>
                </CardHeader>
            </Card>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {program?.modules.map(module => {
                    const assignment = assignments.find(a => a.moduleId === module.code);
                    const effectiveStatus = assignment ? getEffectiveStatus(assignment) : 'Pendiente';
                    
                    return (
                        <Card key={module.code} className={`flex flex-col border-t-4 shadow-md hover:shadow-lg transition-shadow ${effectiveStatus === 'Aprobado' ? 'border-t-green-500' : (assignment ? 'border-t-primary' : 'border-t-muted')}`}>
                            <CardHeader>
                                <div className="flex justify-between items-start mb-2">
                                    <Badge variant="secondary" className="font-mono text-[10px] uppercase tracking-wider">{module.code}</Badge>
                                    <Badge variant={effectiveStatus === 'Aprobado' ? 'default' : 'outline'}>{effectiveStatus}</Badge>
                                </div>
                                <CardTitle className="text-lg leading-tight min-h-[3rem]">{module.name}</CardTitle>
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
                                        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md border border-primary/10">
                                            <Users className="h-4 w-4 text-primary" />
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-muted-foreground uppercase font-bold">Supervisor</span>
                                                <span className="font-bold text-xs">{assignment.supervisorName}</span>
                                            </div>
                                        </div>
                                        {assignment.visits.length > 0 && (
                                            <div className="pt-2">
                                                <p className="font-bold text-xs mb-2 flex items-center gap-1 text-primary">
                                                    <MessageSquare className="h-3 w-3" /> Bitácora de Visitas ({assignment.visits.length})
                                                </p>
                                                <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                                                    {assignment.visits.map((visit, i) => (
                                                        <div key={i} className="bg-muted/30 p-2 rounded text-[10px] border border-muted transition-colors hover:bg-muted/50">
                                                            <div className="flex justify-between font-bold mb-1 opacity-70">
                                                                <span>{format(visit.date.toDate(), 'dd/MM/yy')}</span>
                                                                <Badge variant="outline" className="h-4 text-[8px] uppercase">{visit.type}</Badge>
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
                                        <Clock className="h-8 w-8 text-muted-foreground" />
                                        <p className="text-xs italic">Aún no se ha programado para este módulo.</p>
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="pt-0">
                                {assignment && effectiveStatus !== 'Aprobado' && effectiveStatus !== 'Desaprobado' && (
                                    <div className="w-full space-y-2">
                                        {assignment.studentReportUrl && (
                                            <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-100 rounded-md text-[10px] text-green-700 font-medium">
                                                <CheckCircle className="h-3 w-3" /> Informe enviado para revisión
                                            </div>
                                        )}
                                        <Button 
                                            className="w-full h-9 text-xs font-bold uppercase tracking-tight" 
                                            onClick={() => handleOpenSubmitDialog(assignment)}
                                            disabled={!!isUploading}
                                        >
                                            {isUploading === assignment.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4" />}
                                            {assignment.studentReportUrl ? 'Actualizar Informe' : 'Enviar Informe Final'}
                                        </Button>
                                    </div>
                                )}
                                {effectiveStatus === 'Aprobado' && (
                                    <div className="w-full bg-green-50 border border-green-100 p-3 rounded-md text-center shadow-inner">
                                        <p className="text-green-700 font-black text-2xl">NOTA: {assignment?.grade}</p>
                                        <p className="text-green-600 text-[10px] font-bold flex items-center justify-center gap-1 uppercase tracking-tighter">
                                            <CheckCircle className="h-3 w-3" /> Módulo Culminado con Éxito
                                        </p>
                                    </div>
                                )}
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>

            {/* Submission Dialog */}
            <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Enviar Informe de Prácticas</DialogTitle>
                        <DialogDescription>
                            Elige la forma en la que deseas entregar tu informe final del módulo <span className="font-bold text-foreground">"{selectedAssignmentForReport?.moduleName}"</span>.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <Tabs defaultValue="file" className="w-full py-4">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="file" className="flex items-center gap-2">
                                <FileText className="h-4 w-4" /> Subir PDF
                            </TabsTrigger>
                            <TabsTrigger value="link" className="flex items-center gap-2">
                                <LinkIcon className="h-4 w-4" /> Enlace Externo
                            </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="file" className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="file-upload">Seleccionar Archivo (PDF recomendado)</Label>
                                <Input 
                                    id="file-upload" 
                                    type="file" 
                                    accept=".pdf,.doc,.docx"
                                    onChange={(e) => selectedAssignmentForReport && handleUploadReport(selectedAssignmentForReport.id, e)} 
                                    disabled={!!isUploading} 
                                />
                                <p className="text-[10px] text-muted-foreground">Tamaño máximo: 10MB. Al seleccionar un archivo, se subirá automáticamente.</p>
                            </div>
                        </TabsContent>
                        
                        <TabsContent value="link" className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="link-input">Enlace del Informe (Google Docs, OneDrive, etc.)</Label>
                                <div className="flex gap-2">
                                    <Input 
                                        id="link-input" 
                                        placeholder="https://docs.google.com/..." 
                                        value={reportLink}
                                        onChange={(e) => setReportLink(e.target.value)}
                                        disabled={!!isUploading}
                                    />
                                    {reportLink && (
                                        <Button variant="outline" size="icon" asChild>
                                            <a href={reportLink} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink className="h-4 w-4" />
                                            </a>
                                        </Button>
                                    )}
                                </div>
                                <p className="text-[10px] text-muted-foreground">Asegúrate de que el enlace tenga permisos de lectura para tu supervisor.</p>
                            </div>
                            <Button 
                                className="w-full" 
                                onClick={handleSaveReportUrl} 
                                disabled={!reportLink || !!isUploading}
                            >
                                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4" />}
                                Guardar Enlace del Informe
                            </Button>
                        </TabsContent>
                    </Tabs>
                    
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsSubmitDialogOpen(false)}>Cancelar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
