
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAssignmentsForActivity, getStaffProfiles, getPrograms } from '@/config/firebase';
import type { NonTeachingAssignment, StaffProfile, Program, UnitPeriod } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '../ui/badge';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { FileText, Download, Clock, CheckCircle2, ExternalLink, Eye } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { ScrollArea } from '../ui/scroll-area';

interface ActivityAssignmentDetailsProps {
    activityId: string;
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());
const periods: (UnitPeriod | 'all')[] = ['all', 'MAR-JUL', 'AGO-DIC'];


export function ActivityAssignmentDetails({ activityId }: ActivityAssignmentDetailsProps) {
    const { instituteId } = useAuth();
    const [assignments, setAssignments] = useState<NonTeachingAssignment[]>([]);
    const [staffMap, setStaffMap] = useState<Map<string, StaffProfile>>(new Map());
    const [programMap, setProgramMap] = useState<Map<string, Program>>(new Map());
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState(currentYear.toString());
    const [selectedPeriod, setSelectedPeriod] = useState<UnitPeriod | 'all'>('all');
    
    // Evidence modal states
    const [viewingAssignment, setViewingAssignment] = useState<NonTeachingAssignment | null>(null);

    useEffect(() => {
        if (!instituteId || !activityId) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const [fetchedAssignments, staff, programs] = await Promise.all([
                    getAssignmentsForActivity(instituteId, activityId, selectedYear),
                    getStaffProfiles(instituteId),
                    getPrograms(instituteId),
                ]);

                setAssignments(fetchedAssignments);
                setStaffMap(new Map(staff.map(s => [s.documentId, s])));
                setProgramMap(new Map(programs.map(p => [p.id, p])));

            } catch (error) {
                console.error("Error fetching assignment details:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [instituteId, activityId, selectedYear]);
    
    const filteredAndGroupedAssignments = useMemo(() => {
        const periodFiltered = selectedPeriod === 'all'
            ? assignments
            : assignments.filter(a => a.period === selectedPeriod);
            
        const groupedByProgram: Record<string, NonTeachingAssignment[]> = {};

        periodFiltered.forEach(assignment => {
            const teacher = staffMap.get(assignment.teacherId);
            if (teacher) {
                const programId = teacher.programId;
                if (!groupedByProgram[programId]) {
                    groupedByProgram[programId] = [];
                }
                groupedByProgram[programId].push(assignment);
            }
        });

        return Object.entries(groupedByProgram).sort(([programIdA], [programIdB]) => {
            const programNameA = programMap.get(programIdA)?.name || '';
            const programNameB = programMap.get(programIdB)?.name || '';
            return programNameA.localeCompare(programNameB);
        });

    }, [assignments, staffMap, programMap, selectedPeriod]);

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-48 space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Filtrar por Año</Label>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger className="h-9">
                            <SelectValue placeholder="Seleccione un año" />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="w-full sm:w-48 space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Filtrar por Período</Label>
                    <Select value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as any)}>
                        <SelectTrigger className="h-9">
                            <SelectValue placeholder="Seleccione período" />
                        </SelectTrigger>
                        <SelectContent>
                           {periods.map(p => <SelectItem key={p} value={p}>{p === 'all' ? 'Todos' : p}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {loading ? <Skeleton className="h-40 w-full" /> : (
                <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    {filteredAndGroupedAssignments.length > 0 ? (
                        filteredAndGroupedAssignments.map(([programId, programAssignments]) => {
                             const program = programMap.get(programId);
                             return (
                                 <Card key={programId} className="border-primary/5 shadow-sm overflow-hidden">
                                     <CardHeader className="bg-primary/5 py-3 border-b">
                                        <CardTitle className="text-sm font-black uppercase tracking-tight text-primary">
                                            {program?.name || 'Programa Desconocido'}
                                        </CardTitle>
                                     </CardHeader>
                                     <CardContent className="p-0">
                                        <div className="overflow-auto">
                                            <Table>
                                                <TableHeader className="bg-slate-50/50">
                                                    <TableRow>
                                                        <TableHead className="text-[10px] font-black uppercase py-2">Docente</TableHead>
                                                        <TableHead className="text-center text-[10px] font-black uppercase py-2">Período</TableHead>
                                                        <TableHead className="text-center text-[10px] font-black uppercase py-2">Horas</TableHead>
                                                        <TableHead className="text-center text-[10px] font-black uppercase py-2">Evidencias</TableHead>
                                                        <TableHead className="text-right text-[10px] font-black uppercase py-2">Acción</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                     {programAssignments.map(assignment => {
                                                        const teacher = staffMap.get(assignment.teacherId);
                                                        const hasEvidence = assignment.evidenceUrls && assignment.evidenceUrls.length > 0;
                                                        
                                                        return (
                                                            <TableRow key={assignment.id} className="hover:bg-muted/30 transition-colors">
                                                                <TableCell className="py-2">
                                                                    <Link href={`/profile/${assignment.teacherId}`} target="_blank" className="font-bold text-sm uppercase hover:text-primary transition-colors">
                                                                        {teacher?.displayName || assignment.teacherId}
                                                                    </Link>
                                                                    <p className="text-[9px] font-mono text-muted-foreground">{assignment.teacherId}</p>
                                                                </TableCell>
                                                                <TableCell className="text-center py-2">
                                                                    <Badge variant="outline" className="text-[9px] font-bold">{assignment.period}</Badge>
                                                                </TableCell>
                                                                <TableCell className="text-center py-2">
                                                                    <div className="flex flex-col items-center">
                                                                        <span className="font-black text-sm">{assignment.assignedHours}h</span>
                                                                        <span className="text-[8px] text-muted-foreground uppercase font-bold">Semanales</span>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="text-center py-2">
                                                                    {hasEvidence ? (
                                                                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-[9px] font-black uppercase border-none">
                                                                            <CheckCircle2 className="h-3 w-3 mr-1" /> Informado
                                                                        </Badge>
                                                                    ) : (
                                                                        <Badge variant="secondary" className="text-[9px] font-black uppercase opacity-60">
                                                                            <Clock className="h-3 w-3 mr-1" /> Pendiente
                                                                        </Badge>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell className="text-right py-2 pr-4">
                                                                    <Button 
                                                                        variant="ghost" 
                                                                        size="sm" 
                                                                        className="h-8 font-black text-[10px] uppercase tracking-tighter"
                                                                        onClick={() => setViewingAssignment(assignment)}
                                                                        disabled={!hasEvidence}
                                                                    >
                                                                        <Eye className="h-3.5 w-3.5 mr-1.5" />
                                                                        Auditar Informe
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </div>
                                     </CardContent>
                                 </Card>
                             )
                        })
                    ) : (
                        <div className="h-40 text-center flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-2xl bg-muted/5">
                            <FileText className="h-10 w-10 mb-2 opacity-10" />
                            <p className="text-sm font-bold uppercase tracking-widest">Sin registros encontrados</p>
                        </div>
                    )}
                </div>
            )}

            {/* Modal: Auditar Informe / Ver Evidencias */}
            <Dialog open={!!viewingAssignment} onOpenChange={open => !open && setViewingAssignment(null)}>
                <DialogContent className="max-w-md rounded-2xl shadow-2xl p-0 overflow-hidden">
                    <DialogHeader className="p-6 bg-primary text-primary-foreground">
                        <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                            <FileText className="h-5 w-5" /> Auditoría de Actividad
                        </DialogTitle>
                        <DialogDescription className="text-primary-foreground/80 font-medium">
                            Revisión de evidencias para: <span className="font-bold text-white underline">{viewingAssignment?.activityName}</span>
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="p-6 space-y-6">
                        <div className="space-y-2">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                <FileText className="h-4 w-4" /> Descripción del Informe
                            </h4>
                            <div className="p-4 bg-muted/30 rounded-xl border-2 border-dashed text-sm leading-relaxed italic text-slate-700">
                                "{viewingAssignment?.evidenceDescription || 'Sin descripción proporcionada.'}"
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                <Download className="h-4 w-4" /> Archivos Adjuntos
                            </h4>
                            <div className="space-y-2">
                                {viewingAssignment?.evidenceUrls?.map((url, i) => (
                                    <Button key={i} variant="outline" className="w-full justify-between h-12 rounded-xl group hover:border-primary transition-all" asChild>
                                        <a href={url} target="_blank" rel="noopener noreferrer">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-primary/5 rounded-lg text-primary group-hover:scale-110 transition-transform">
                                                    <FileText className="h-4 w-4" />
                                                </div>
                                                <span className="text-xs font-bold uppercase tracking-tight">Evidencia {i + 1}</span>
                                            </div>
                                            <Download className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                                        </a>
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3 items-center">
                            <Info className="h-5 w-5 text-blue-600 shrink-0" />
                            <p className="text-[10px] text-blue-800 leading-tight">
                                Este informe certifica el cumplimiento de <strong>{viewingAssignment?.assignedHours} horas semanales</strong> durante el periodo {viewingAssignment?.period}.
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="p-6 border-t bg-muted/20">
                        <Button variant="ghost" onClick={() => setViewingAssignment(null)} className="w-full font-bold">CERRAR VISOR</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
