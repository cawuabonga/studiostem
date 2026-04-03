
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getEFSRTAssignmentsForSupervisor, registerEFSRTVisit, evaluateEFSRT } from '@/config/firebase';
import type { EFSRTAssignment, EFSRTStatus } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Calendar, CheckCircle, FileText, PlusCircle, Loader2, GraduationCap, History } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Timestamp } from 'firebase/firestore';

export default function SupervisorEFSRTPage() {
    const { user, instituteId } = useAuth();
    const { toast } = useToast();
    const [assignments, setAssignments] = useState<EFSRTAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [selectedAssignment, setSelectedAssignment] = useState<EFSRTAssignment | null>(null);
    const [isVisitDialogOpen, setIsVisitDialogOpen] = useState(false);
    const [isEvaluateDialogOpen, setIsEvaluateDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    const handleRegisterVisit = async () => {
        if (!instituteId || !selectedAssignment || !visitData.observations) return;
        setIsSubmitting(true);
        try {
            await registerEFSRTVisit(instituteId, selectedAssignment.id, {
                date: Timestamp.now(),
                type: visitData.type as 'Presencial' | 'Virtual',
                observations: visitData.observations
            });
            toast({ title: "Visita Registrada", description: "Bitácora actualizada." });
            setIsVisitDialogOpen(false);
            setVisitData({ type: 'Presencial', observations: '' });
            fetchData();
        } catch (error) {
            toast({ title: "Error", description: "No se pudo registrar.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEvaluate = async () => {
        if (!instituteId || !selectedAssignment || !evalData.grade) return;
        const grade = Number(evalData.grade);
        if (isNaN(grade) || grade < 0 || grade > 20) {
            toast({ title: "Nota inválida", description: "Debe estar entre 0 y 20.", variant: "destructive" });
            return;
        }
        setIsSubmitting(true);
        try {
            await evaluateEFSRT(instituteId, selectedAssignment.id, grade, evalData.observations);
            toast({ title: "Evaluación Guardada", description: "Módulo calificado correctamente." });
            setIsEvaluateDialogOpen(false);
            setEvalData({ grade: '', observations: '' });
            fetchData();
        } catch (error) {
            toast({ title: "Error", description: "No se pudo guardar.", variant: "destructive" });
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

    if (loading) return <div className="p-8 space-y-6"><Skeleton className="h-64 w-full" /></div>;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Supervisiones de EFSRT</CardTitle>
                    <CardDescription>Gestión automática de estados basada en fechas programadas.</CardDescription>
                </CardHeader>
            </Card>

            <div className="grid gap-6">
                {assignments.length > 0 ? assignments.map(a => {
                    const status = getEffectiveStatus(a);
                    return (
                        <Card key={a.id} className="overflow-hidden border-l-4 border-l-primary">
                            <div className="grid md:grid-cols-12 gap-0">
                                <div className="md:col-span-4 bg-muted/20 p-6 border-r">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-start">
                                            <Badge className={getStatusColor(status)}>{status}</Badge>
                                            {a.grade !== undefined && <Badge variant="outline" className="text-lg font-bold">Nota: {a.grade}</Badge>}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold">{a.studentName}</h3>
                                            <p className="text-sm text-muted-foreground font-semibold">{a.moduleName}</p>
                                        </div>
                                        <div className="space-y-2 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> <span>{a.location}</span></div>
                                            <div className="flex items-center gap-2"><Calendar className="h-4 w-4" /> <span>{format(a.startDate.toDate(), 'dd/MM/yy')} - {format(a.endDate.toDate(), 'dd/MM/yy')}</span></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="md:col-span-8 p-6 flex flex-col justify-between">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h4 className="font-bold flex items-center gap-2 text-primary"><History className="h-4 w-4" /> Bitácora ({a.visits.length})</h4>
                                            <Button size="sm" variant="outline" onClick={() => { setSelectedAssignment(a); setIsVisitDialogOpen(true); }}>
                                                <PlusCircle className="mr-2 h-4 w-4" /> Nueva Visita
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-2">
                                            {a.visits.map((visit, i) => (
                                                <div key={i} className="bg-muted/50 p-3 rounded-lg text-xs border">
                                                    <div className="flex justify-between font-bold mb-1"><span>{format(visit.date.toDate(), 'dd/MM/yy')}</span><Badge variant="secondary" className="text-[10px]">{visit.type}</Badge></div>
                                                    <p className="italic">"{visit.observations}"</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="mt-6 pt-6 border-t flex flex-wrap gap-4 justify-between items-center">
                                        <div className="flex gap-2">
                                            {a.studentReportUrl ? (
                                                <Button variant="default" size="sm" asChild><a href={a.studentReportUrl} target="_blank"><FileText className="mr-2 h-4 w-4" /> Ver Informe Estudiante</a></Button>
                                            ) : <Badge variant="outline" className="text-muted-foreground">Esperando informe...</Badge>}
                                        </div>
                                        <Button variant="secondary" size="sm" onClick={() => { setSelectedAssignment(a); setIsEvaluateDialogOpen(true); }}>
                                            <GraduationCap className="mr-2 h-4 w-4" /> Calificar Módulo
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    );
                }) : <div className="text-center py-24 bg-muted/10 rounded-lg border-2 border-dashed">No hay asignaciones.</div>}
            </div>

            {/* Visit Dialog */}
            <Dialog open={isVisitDialogOpen} onOpenChange={setIsVisitDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Registrar Visita</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2"><Label>Tipo</Label><Select value={visitData.type} onValueChange={(v) => setVisitData(p => ({ ...p, type: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Presencial">Presencial</SelectItem><SelectItem value="Virtual">Virtual</SelectItem></SelectContent></Select></div>
                        <div className="space-y-2"><Label>Observaciones</Label><Textarea placeholder="..." value={visitData.observations} onChange={(e) => setVisitData(p => ({ ...p, observations: e.target.value }))} /></div>
                    </div>
                    <DialogFooter><Button variant="ghost" onClick={() => setIsVisitDialogOpen(false)}>Cancelar</Button><Button onClick={handleRegisterVisit} disabled={isSubmitting}>Guardar</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Evaluation Dialog */}
            <Dialog open={isEvaluateDialogOpen} onOpenChange={setIsEvaluateDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Evaluación Final</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2"><Label>Nota (0 - 20)</Label><Input type="number" value={evalData.grade} onChange={(e) => setEvalData(p => ({ ...p, grade: e.target.value }))} /><p className="text-xs text-muted-foreground">Nota aprobatoria: 13.</p></div>
                        <div className="space-y-2"><Label>Conclusiones</Label><Textarea value={evalData.observations} onChange={(e) => setEvalData(p => ({ ...p, observations: e.target.value }))} /></div>
                    </div>
                    <DialogFooter><Button variant="ghost" onClick={() => setIsEvaluateDialogOpen(false)}>Cancelar</Button><Button onClick={handleEvaluate} disabled={isSubmitting}>Cerrar Evaluación</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
