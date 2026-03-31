
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getEFSRTAssignmentsForSupervisor, registerEFSRTVisit, evaluateEFSRT, uploadEFSRTReport } from '@/config/firebase';
import type { EFSRTAssignment, EFSRTStatus, EFSRTVisit } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Calendar, CheckCircle, FileText, PlusCircle, Loader2, ExternalLink, GraduationCap } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SupervisorEFSRTPage() {
    const { user, instituteId } = useAuth();
    const { toast } = useToast();
    const [assignments, setAssignments] = useState<EFSRTAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Dialog states
    const [selectedAssignment, setSelectedAssignment] = useState<EFSRTAssignment | null>(null);
    const [isVisitDialogOpen, setIsVisitDialogOpen] = useState(false);
    const [isEvaluateDialogOpen, setIsEvaluateDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form states
    const [visitData, setVisitData] = useState({ type: 'Presencial', observations: '' });
    const [evalData, setEvalData] = useState({ grade: '', observations: '' });

    const fetchData = useCallback(async () => {
        if (!instituteId || !user?.documentId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const fetched = await getEFSRTAssignmentsForSupervisor(instituteId, user.documentId);
            setAssignments(fetched);
        } catch (error) {
            toast({ title: "Error", description: "No se pudieron cargar tus supervisiones.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [instituteId, user, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRegisterVisit = async () => {
        if (!instituteId || !selectedAssignment || !visitData.observations) return;
        setIsSubmitting(true);
        try {
            await registerEFSRTVisit(instituteId, selectedAssignment.id, {
                date: new any(), // Timestamp created in firebase function or here
                type: visitData.type as any,
                observations: visitData.observations
            });
            toast({ title: "Visita Registrada", description: "La visita ha sido guardada en la bitácora." });
            setIsVisitDialogOpen(false);
            setVisitData({ type: 'Presencial', observations: '' });
            fetchData();
        } catch (error) {
            toast({ title: "Error", description: "No se pudo registrar la visita.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEvaluate = async () => {
        if (!instituteId || !selectedAssignment || !evalData.grade) return;
        setIsSubmitting(true);
        try {
            await evaluateEFSRT(instituteId, selectedAssignment.id, Number(evalData.grade), evalData.observations);
            toast({ title: "Evaluación Guardada", description: "El estudiante ha sido calificado." });
            setIsEvaluateDialogOpen(false);
            setEvalData({ grade: '', observations: '' });
            fetchData();
        } catch (error) {
            toast({ title: "Error", description: "No se pudo guardar la evaluación.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <div className="space-y-6"><Skeleton className="h-64 w-full" /><Skeleton className="h-64 w-full" /></div>;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Supervisiones de EFSRT</CardTitle>
                    <CardDescription>
                        Gestiona el seguimiento y evaluación de los estudiantes que tienes a tu cargo para sus experiencias formativas.
                    </CardDescription>
                </CardHeader>
            </Card>

            <div className="grid gap-6">
                {assignments.length > 0 ? assignments.map(assignment => (
                    <Card key={assignment.id} className="overflow-hidden">
                        <div className="grid md:grid-cols-12 gap-0">
                            <div className="md:col-span-4 bg-muted/30 p-6 border-r">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-start">
                                        <Badge>{assignment.status}</Badge>
                                        {assignment.grade && <Badge variant="secondary" className="text-lg">Nota: {assignment.grade}</Badge>}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">{assignment.studentName}</h3>
                                        <p className="text-sm text-muted-foreground">{assignment.programId} - {assignment.moduleName}</p>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> <span>{assignment.location}</span></div>
                                        <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> <span>{format(assignment.startDate.toDate(), 'dd/MM/yy')} - {format(assignment.endDate.toDate(), 'dd/MM/yy')}</span></div>
                                    </div>
                                </div>
                            </div>
                            <div className="md:col-span-8 p-6 flex flex-col justify-between">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-bold flex items-center gap-2"><FileText className="h-4 w-4" /> Bitácora de Visitas ({assignment.visits.length})</h4>
                                        <Button size="sm" onClick={() => { setSelectedAssignment(assignment); setIsVisitDialogOpen(true); }}>
                                            <PlusCircle className="mr-2 h-4 w-4" /> Registrar Visita
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-40 overflow-y-auto pr-2">
                                        {assignment.visits.map((visit, i) => (
                                            <div key={i} className="bg-muted p-3 rounded-lg text-xs">
                                                <div className="flex justify-between font-bold mb-1">
                                                    <span>{format(visit.date.toDate(), 'dd/MM/yy')}</span>
                                                    <Badge variant="outline" className="text-[10px] h-5">{visit.type}</Badge>
                                                </div>
                                                <p className="text-muted-foreground">{visit.observations}</p>
                                            </div>
                                        ))}
                                        {assignment.visits.length === 0 && <p className="col-span-full text-center py-4 text-muted-foreground italic">No se han registrado visitas aún.</p>}
                                    </div>
                                </div>
                                <div className="mt-6 pt-6 border-t flex flex-wrap gap-4 justify-between items-center">
                                    <div className="flex gap-2">
                                        {assignment.studentReportUrl ? (
                                            <Button variant="outline" size="sm" asChild>
                                                <a href={assignment.studentReportUrl} target="_blank"><FileText className="mr-2 h-4 w-4" /> Informe Estudiante</a>
                                            </Button>
                                        ) : (
                                            <Badge variant="secondary">Esperando Informe</Badge>
                                        )}
                                    </div>
                                    <div className="space-x-2">
                                        <Button variant="outline" size="sm" onClick={() => { setSelectedAssignment(assignment); setIsEvaluateDialogOpen(true); }}>
                                            <GraduationCap className="mr-2 h-4 w-4" /> Evaluar / Calificar
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                )) : (
                    <p className="text-center py-20 text-muted-foreground">No tienes estudiantes asignados para supervisión.</p>
                )}
            </div>

            {/* Visit Dialog */}
            <Dialog open={isVisitDialogOpen} onOpenChange={setIsVisitDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Registrar Nueva Visita de Supervisión</DialogTitle>
                        <DialogDescription>Anota los detalles de la visita realizada al estudiante {selectedAssignment?.studentName}.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Tipo de Visita</Label>
                            <Select value={visitData.type} onValueChange={(v) => setVisitData(p => ({ ...p, type: v }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Presencial">Presencial</SelectItem>
                                    <SelectItem value="Virtual">Virtual</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Observaciones y Hallazgos</Label>
                            <Textarea 
                                placeholder="Describe el desempeño observado, asistencia, etc." 
                                value={visitData.observations} 
                                onChange={(e) => setVisitData(p => ({ ...p, observations: e.target.value }))}
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsVisitDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleRegisterVisit} disabled={isSubmitting || !visitData.observations}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar Visita
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Evaluation Dialog */}
            <Dialog open={isEvaluateDialogOpen} onOpenChange={setIsEvaluateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Evaluación Final de EFSRT</DialogTitle>
                        <DialogDescription>Califica el desempeño final del estudiante en este módulo.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Nota Final (0-20)</Label>
                            <Input 
                                type="number" 
                                min="0" 
                                max="20" 
                                value={evalData.grade} 
                                onChange={(e) => setEvalData(p => ({ ...p, grade: e.target.value }))}
                            />
                            <p className="text-xs text-muted-foreground">Nota aprobatoria mínima: 13.</p>
                        </div>
                        <div className="space-y-2">
                            <Label>Observaciones Finales</Label>
                            <Textarea 
                                placeholder="Comentarios generales sobre la práctica." 
                                value={evalData.observations} 
                                onChange={(e) => setEvalData(p => ({ ...p, observations: e.target.value }))}
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsEvaluateDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleEvaluate} disabled={isSubmitting || !evalData.grade}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirmar Evaluación
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
