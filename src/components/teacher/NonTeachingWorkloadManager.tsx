"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getTeacherWorkload, submitActivityReport } from '@/services/workload-service';
import type { NonTeachingAssignment } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
    ClipboardList, 
    Upload, 
    CheckCircle, 
    Clock, 
    FileText, 
    Loader2, 
    History, 
    Download, 
    AlertCircle,
    CalendarDays
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export function NonTeachingWorkloadManager() {
    const { instituteId, user } = useAuth();
    const { toast } = useToast();
    const [assignments, setAssignments] = useState<NonTeachingAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Form states
    const [selectedAssignment, setSelectedAssignment] = useState<NonTeachingAssignment | null>(null);
    const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
    const [description, setDescription] = useState('');

    const year = new Date().getFullYear().toString();

    const fetchData = useCallback(async () => {
        if (!instituteId || !user?.documentId) return;
        setLoading(true);
        try {
            const data = await getTeacherWorkload(instituteId, user.documentId, year);
            setAssignments(data);
        } catch (error) {
            console.error("Error loading workload:", error);
        } finally {
            setLoading(false);
        }
    }, [instituteId, user, year]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleOpenReport = (assignment: NonTeachingAssignment) => {
        setSelectedAssignment(assignment);
        setEvidenceFile(null);
        setDescription(assignment.evidenceDescription || '');
    };

    const handleUpload = async () => {
        if (!instituteId || !selectedAssignment || !evidenceFile) return;
        setIsSubmitting(true);
        try {
            await submitActivityReport(instituteId, selectedAssignment.id, evidenceFile, description);
            toast({ title: "Reporte Enviado", description: "La evidencia ha sido vinculada a tu actividad correctamente." });
            setSelectedAssignment(null);
            fetchData();
        } catch (error) {
            toast({ title: "Error", description: "No se pudo subir el reporte.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="space-y-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-64 w-full" /></div>;

    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {assignments.length > 0 ? assignments.map(a => {
                    const hasEvidence = a.evidenceUrls && a.evidenceUrls.length > 0;
                    return (
                        <Card key={a.id} className={cn(
                            "hover:border-primary transition-all shadow-md rounded-2xl overflow-hidden flex flex-col group",
                            hasEvidence ? "border-green-100" : "border-amber-100"
                        )}>
                            <CardHeader className="pb-4">
                                <div className="flex justify-between items-start mb-2">
                                    <Badge variant="secondary" className="font-black text-[10px] uppercase">{a.period}</Badge>
                                    <Badge className={cn(
                                        "font-bold text-[9px] uppercase",
                                        hasEvidence ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                                    )}>
                                        {hasEvidence ? 'Informado' : 'Pendiente'}
                                    </Badge>
                                </div>
                                <CardTitle className="text-lg font-black uppercase tracking-tight leading-tight min-h-[2.5rem]">
                                    {a.activityName}
                                </CardTitle>
                                <div className="flex items-center gap-2 text-xs font-bold text-primary">
                                    <Clock className="h-3.5 w-3.5" /> {a.assignedHours} Horas Semanales
                                </div>
                            </CardHeader>
                            
                            <CardContent className="flex-grow space-y-4">
                                {hasEvidence ? (
                                    <div className="p-3 bg-green-50/50 rounded-xl border border-green-100 space-y-2">
                                        <p className="text-[10px] font-black text-green-700 uppercase tracking-widest flex items-center gap-1.5">
                                            <CheckCircle className="h-3.5 w-3.5" /> Última Evidencia
                                        </p>
                                        <p className="text-xs text-slate-600 italic line-clamp-2">"{a.evidenceDescription}"</p>
                                        <div className="flex gap-2">
                                            {a.evidenceUrls?.map((url, i) => (
                                                <Button key={i} variant="link" className="p-0 h-auto text-[10px] font-bold" asChild>
                                                    <a href={url} target="_blank"><Download className="h-3 w-3 mr-1" /> Ver archivo</a>
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 border-dashed">
                                        <p className="text-[10px] font-bold text-amber-700 text-center uppercase tracking-tighter italic">
                                            Sin evidencias registradas para este periodo.
                                        </p>
                                    </div>
                                )}
                            </CardContent>

                            <CardFooter className="pt-0">
                                <Button 
                                    className="w-full font-black uppercase text-xs h-10 shadow-lg group-hover:bg-primary"
                                    onClick={() => handleOpenReport(a)}
                                    variant={hasEvidence ? "outline" : "default"}
                                >
                                    <Upload className="mr-2 h-4 w-4" /> 
                                    {hasEvidence ? "ACTUALIZAR REPORTE" : "SUBIR INFORME MENSUAL"}
                                </Button>
                            </CardFooter>
                        </Card>
                    )
                }) : (
                    <div className="col-span-full py-20 text-center text-muted-foreground bg-muted/5 rounded-3xl border-2 border-dashed">
                        <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p className="font-bold uppercase text-sm">No tienes carga no lectiva asignada para el año {year}</p>
                    </div>
                )}
            </div>

            {/* Dialog: Upload Evidence */}
            <Dialog open={!!selectedAssignment} onOpenChange={open => !open && setSelectedAssignment(null)}>
                <DialogContent className="max-w-md rounded-2xl shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black uppercase text-primary">Reportar Actividad</DialogTitle>
                        <DialogDescription>Actividad: <span className="font-bold text-foreground">{selectedAssignment?.activityName}</span></DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <FileText className="h-4 w-4 text-primary" /> Informe / Evidencia (PDF recomendado)
                            </Label>
                            <Input 
                                type="file" 
                                accept=".pdf,image/*,.doc,.docx" 
                                onChange={e => setEvidenceFile(e.target.files?.[0] || null)} 
                                className="h-11"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Descripción del Informe</Label>
                            <Textarea 
                                placeholder="Describa brevemente el avance o cumplimiento de la actividad..." 
                                value={description} 
                                onChange={e => setDescription(e.target.value)}
                                className="resize-none h-24"
                            />
                        </div>

                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3">
                            <Info className="h-5 w-5 text-blue-600 shrink-0" />
                            <p className="text-[10px] text-blue-800 leading-tight">
                                Este reporte será visible para tu Coordinador de Programa para la validación de cumplimiento de horas mensuales.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setSelectedAssignment(null)} className="font-bold">CANCELAR</Button>
                        <Button onClick={handleUpload} disabled={isSubmitting || !evidenceFile} className="font-black px-8">
                            {isSubmitting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Send className="mr-2 h-4 w-4" />}
                            SUBIR REPORTE OFICIAL
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
