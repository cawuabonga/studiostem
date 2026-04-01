
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getEFSRTAssignmentsForSupervisor, registerEFSRTVisit, evaluateEFSRT } from '@/config/firebase';
import type { EFSRTAssignment } from '@/types';
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

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRegisterVisit = async () => {
        if (!instituteId || !selectedAssignment || !visitData.observations) return;
        setIsSubmitting(true);
        try {
            await registerEFSRTVisit(instituteId, selectedAssignment.id, {
                date: Timestamp.now(),
                type: visitData.type as 'Presencial' | 'Virtual',
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
        const grade = Number(evalData.grade);
        if (isNaN(grade) || grade < 0 || grade > 20) {
            toast({ title: "Nota inválida", description: "La nota debe estar entre 0 y 20.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            await evaluateEFSRT(instituteId, selectedAssignment.id, grade, evalData.observations);
            toast({ title: "Evaluación Guardada", description: "El estudiante ha sido calificado correctamente." });
            setIsEvaluateDialogOpen(false);
            setEvalData({ grade: '', observations: '' });
            fetchData();
        } catch (error) {
            toast({ title: "Error", description: "No se pudo guardar la evaluación.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 space-y-6"><Skeleton className="h-64 w-full" /><Skeleton className="h-64 w-full" /></div>;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Supervisiones de Experiencias Formativas (EFSRT)</CardTitle>
                    <CardDescription>
                        Gestiona el seguimiento y evaluación de los estudiantes asignados a tu cargo para sus prácticas por módulo.
                    </CardDescription>
                </CardHeader>
            </Card>

            <div className="grid gap-6">
                {assignments.length > 0 ? assignments.map(assignment => (
                    <Card key={assignment.id} className="overflow-hidden border-l-4 border-l-primary">
                        <div className="grid md:grid-cols-12 gap-0">
                            <div className="md:col-span-4 bg-muted/20 p-6 border-r">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-start">
                                        <Badge variant={assignment.status === 'Aprobado' ? 'default' : 'secondary'}>{assignment.status}</Badge>
                                        {assignment.grade !== undefined && <Badge variant="outline" className="text-lg font-bold">Nota: {assignment.grade}</Badge>}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">{assignment.studentName}</h3>
                                        <p className="text-sm text-muted-foreground font-semibold">{assignment.moduleName}</p>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4 text-primary" /> <span>{assignment.location}</span></div>
                                        <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4 text-primary" /> <span>{format(assignment.startDate.toDate(), 'dd/MM/yy')} - {format(assignment.endDate.toDate(), 'dd/MM/yy')}</span></div>
                                    </div>
                                </div>
                            </div>
                            <div className="md:col-span-8 p-6 flex flex-col justify-between">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-bold flex items-center gap-2 text-primary"><History className="h-4 w-4" /> Bitácora de Visitas ({assignment.visits.length})</h4>
                                        <Button size="sm" variant="outline" onClick={() => { setSelectedAssignment(assignment); setIsVisitDialogOpen(true); }}>
                                            <PlusCircle className="mr-2 h-4 w-4" /> Nueva Visita
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-2">
                                        {assignment.visits.map((visit, i) => (
                                            <div key={i} className="bg-muted/50 p-3 rounded-lg text-xs border">
                                                <div className="flex justify-between font-bold mb-1">
                                                    <span>{format(visit.date.toDate(), 'dd/MM/yy')}</span>
                                                    <Badge variant="secondary" className="text-[10px] h-4">{visit.type}</Badge>
                                                </div>
                                                <p className="text-muted-foreground italic">"{visit.observations}"</p>
                                            </div>
                                        ))}
                                        {assignment.visits.length === 0 && <p className="col-span-full text-center py-6 text-muted-foreground italic text-sm">No se han registrado visitas aún.</p>}
                                    </div>
                                </div>
                                <div className="mt-6 pt-6 border-t flex flex-wrap gap-4 justify-between items-center">
                                    <div className="flex gap-2">
                                        {assignment.studentReportUrl ? (
                                            <Button variant="default" size="sm" asChild>
                                                <a href={assignment.studentReportUrl} target="_blank"><FileText className="mr-2 h-4 w-4" /> Revisar Informe Estudiante</a>
                                            </Button>
                                        ) : (
                                            <Badge variant="outline" className="text-muted-foreground">Esperando informe final...</Badge>
                                        )}
                                    </div>
                                    <Button variant="secondary" size="sm" onClick={() => { setSelectedAssignment(assignment); setIsEvaluateDialogOpen(true); }}>
                                        <GraduationCap className="mr-2 h-4 w-4" /> Calificar Módulo
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                )) : (
                    <div className="text-center py-24 bg-muted/10 rounded-lg border-2 border-dashed">
                        <p className="text-muted-foreground">No tienes estudiantes asignados para supervisión en este momento.</p>
                    </div>
                )}
            </div>

            {/* Diálogo de Visita */}
            <Dialog open={isVisitDialogOpen} onOpenChange={setIsVisitDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Registrar Visita de Supervisión</DialogTitle>
                        <DialogDescription>Anota los hallazgos de la visita realizada al estudiante {selectedAssignment?.studentName}.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Tipo de Modalidad</Label>
                            <Select value={visitData.type} onValueChange={(v) => setVisitData(p => ({ ...p, type: v }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Presencial">Presencial (In situ)</SelectItem>
                                    <SelectItem value="Virtual">Virtual (Telefónica/Meet)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Observaciones y Desempeño</Label>
                            <Textarea 
                                placeholder="Describe brevemente lo observado durante la supervisión..." 
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

            {/* Diálogo de Evaluación */}
            <Dialog open={isEvaluateDialogOpen} onOpenChange={setIsEvaluateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Evaluación Final de EFSRT</DialogTitle>
                        <DialogDescription>Asigna la calificación final del módulo para el estudiante.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Nota Final (0 - 20)</Label>
                            <Input 
                                type="number" 
                                min="0" 
                                max="20" 
                                value={evalData.grade} 
                                onChange={(e) => setEvalData(p => ({ ...p, grade: e.target.value }))}
                                placeholder="Ej: 16"
                            />
                            <p className="text-xs text-muted-foreground">Nota mínima aprobatoria: 13.</p>
                        </div>
                        <div className="space-y-2">
                            <Label>Conclusiones del Supervisor</Label>
                            <Textarea 
                                placeholder="Resumen final del desempeño del estudiante en este centro de prácticas..." 
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
                            Cerrar Evaluación
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
