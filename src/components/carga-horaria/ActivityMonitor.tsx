
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getStaffProfiles, getRoles, getPrograms } from '@/config/firebase';
import { getTeacherWorkload } from '@/services/workload-service';
import type { StaffProfile, NonTeachingAssignment, Role, Program } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
    Users, 
    FileText, 
    Search, 
    ArrowRight, 
    CheckCircle2, 
    Clock, 
    Download, 
    Info, 
    Eye, 
    ClipboardCheck,
    GraduationCap
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export function ActivityMonitor() {
    const { instituteId, user, hasPermission } = useAuth();
    const [staff, setStaff] = useState<StaffProfile[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [loading, setLoading] = useState(true);
    
    // UI state
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTeacher, setSelectedTeacher] = useState<StaffProfile | null>(null);
    const [teacherWorkload, setTeacherWorkload] = useState<NonTeachingAssignment[]>([]);
    const [loadingWorkload, setLoadingWorkload] = useState(false);

    // LÓGICA DE FILTRADO POR PERFIL:
    // Un administrador global es SuperAdmin o un Admin que NO tiene programa asignado.
    // Un coordinador (o admin con programa) está restringido a su programa.
    const userProgramId = user?.programId;
    const isGlobalAdmin = user?.role === 'SuperAdmin' || (hasPermission('academic:program:manage') && !userProgramId);

    const fetchData = useCallback(async () => {
        if (!instituteId) return;
        setLoading(true);
        try {
            const [fetchedStaff, fetchedRoles, fetchedPrograms] = await Promise.all([
                getStaffProfiles(instituteId),
                getRoles(instituteId),
                getPrograms(instituteId)
            ]);

            const targetRoleIds = fetchedRoles
                .filter(r => r.name.toLowerCase() === 'docente' || r.name.toLowerCase() === 'coordinador')
                .map(r => r.id);

            // Filtrar personal que sean docentes/coordinadores y pertenezcan al programa del usuario (si está restringido)
            const filteredStaff = fetchedStaff.filter(s => {
                const hasRole = targetRoleIds.includes(s.roleId) || s.role === 'Teacher' || s.role === 'Coordinator';
                
                // Si no es admin global, forzamos que el programa del docente coincida con el del coordinador
                const matchesProgram = isGlobalAdmin || s.programId === userProgramId;
                
                return hasRole && matchesProgram;
            });

            setStaff(filteredStaff);
            setRoles(fetchedRoles);
            setPrograms(fetchedPrograms);
        } catch (error) {
            console.error("Error fetching monitor data:", error);
        } finally {
            setLoading(false);
        }
    }, [instituteId, isGlobalAdmin, userProgramId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleViewTeacherReport = async (teacher: StaffProfile) => {
        setSelectedTeacher(teacher);
        setLoadingWorkload(true);
        try {
            const year = new Date().getFullYear().toString();
            const workload = await getTeacherWorkload(instituteId!, teacher.documentId, year);
            setTeacherWorkload(workload);
        } catch (error) {
            console.error("Error loading teacher reports:", error);
        } finally {
            setLoading(false);
            setLoadingWorkload(false);
        }
    };

    const filteredStaffList = useMemo(() => {
        return staff.filter(s => 
            s.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || 
            s.documentId.includes(searchTerm)
        );
    }, [staff, searchTerm]);

    if (loading) return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)}
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Barra de Búsqueda y Contexto */}
            <Card className="border-primary/10 shadow-md rounded-2xl overflow-hidden">
                <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input 
                            placeholder="Buscar docente por nombre o DNI..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-11 h-12 border-none bg-muted/30 text-lg rounded-xl focus-visible:ring-primary/20"
                        />
                    </div>
                    {!isGlobalAdmin && userProgramId && (
                        <Badge variant="outline" className="h-12 px-4 rounded-xl border-primary/20 bg-primary/5 text-primary font-black uppercase text-[10px] tracking-widest">
                            <GraduationCap className="mr-2 h-4 w-4" />
                            Filtrado por: {programs.find(p => p.id === userProgramId)?.name}
                        </Badge>
                    )}
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredStaffList.length > 0 ? filteredStaffList.map(teacher => (
                    <Card key={teacher.documentId} className="group hover:border-primary transition-all shadow-md rounded-3xl overflow-hidden flex flex-col border-primary/5 bg-white">
                        <CardHeader className="pb-4 relative">
                            <div className="flex justify-between items-start">
                                <Avatar className="h-16 w-16 border-2 border-primary/10 shadow-sm transition-transform group-hover:scale-105">
                                    <AvatarImage src={teacher.photoURL} />
                                    <AvatarFallback className="bg-primary/5 text-primary font-black text-xl">
                                        {teacher.displayName[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <Badge variant="secondary" className="font-black text-[10px] uppercase">
                                    {teacher.condition}
                                </Badge>
                            </div>
                            <div className="mt-4 space-y-1">
                                <CardTitle className="text-xl font-black uppercase tracking-tight leading-tight">
                                    {teacher.displayName}
                                </CardTitle>
                                <CardDescription className="text-xs font-mono font-bold text-muted-foreground">
                                    DNI: {teacher.documentId}
                                </CardDescription>
                            </div>
                        </CardHeader>
                        
                        <CardContent className="flex-grow pt-0">
                             <div className="p-3 rounded-2xl bg-muted/30 border border-dashed border-primary/10 flex items-center gap-3">
                                <div className="p-2 bg-white rounded-xl text-primary shadow-sm">
                                    <ClipboardCheck className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">Programa</p>
                                    <p className="text-[11px] font-bold uppercase truncate max-w-[180px]">
                                        {programs.find(p => p.id === teacher.programId)?.name || 'N/A'}
                                    </p>
                                </div>
                             </div>
                        </CardContent>

                        <CardFooter className="pt-2">
                            <Button 
                                className="w-full font-black uppercase text-xs tracking-widest h-12 shadow-lg group-hover:scale-[1.02] transition-transform"
                                onClick={() => handleViewTeacherReport(teacher)}
                            >
                                AUDITAR REPORTES <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </CardFooter>
                    </Card>
                )) : (
                    <div className="col-span-full py-24 text-center text-muted-foreground border-2 border-dashed rounded-3xl bg-muted/5">
                        <Users className="h-16 w-16 mx-auto mb-4 opacity-10" />
                        <p className="font-bold uppercase tracking-widest">No se encontró personal docente</p>
                        <p className="text-xs mt-2">
                            {isGlobalAdmin ? "Intente con otro término de búsqueda." : "No hay docentes registrados en su programa de estudios."}
                        </p>
                    </div>
                )}
            </div>

            {/* Modal: Visor de Reportes del Docente */}
            <Dialog open={!!selectedTeacher} onOpenChange={open => !open && setSelectedTeacher(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
                    <DialogHeader className="p-8 bg-primary text-primary-foreground shrink-0">
                        <div className="flex items-center gap-6">
                            <Avatar className="h-20 w-20 border-4 border-white/20 shadow-xl">
                                <AvatarImage src={selectedTeacher?.photoURL} />
                                <AvatarFallback className="bg-white/10 text-white font-black text-2xl">
                                    {selectedTeacher?.displayName[0]}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <DialogTitle className="text-2xl font-black uppercase tracking-tight">
                                    Auditoría de Cumplimiento
                                </DialogTitle>
                                <DialogDescription className="text-primary-foreground/80 font-medium text-base">
                                    {selectedTeacher?.displayName} — <span className="font-bold underline">Carga No Lectiva Anual</span>
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-hidden">
                        <ScrollArea className="h-full p-8">
                            {loadingWorkload ? (
                                <div className="space-y-4">
                                    <Skeleton className="h-24 w-full rounded-2xl" />
                                    <Skeleton className="h-24 w-full rounded-2xl" />
                                </div>
                            ) : teacherWorkload.length > 0 ? (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                        <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 text-center">
                                            <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Total Actividades</p>
                                            <p className="text-2xl font-black text-primary">{teacherWorkload.length}</p>
                                        </div>
                                        <div className="p-4 bg-green-50 rounded-2xl border border-green-100 text-center">
                                            <p className="text-[10px] font-black uppercase text-green-600 mb-1">Informadas</p>
                                            <p className="text-2xl font-black text-green-700">
                                                {teacherWorkload.filter(a => a.evidenceUrls && a.evidenceUrls.length > 0).length}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {teacherWorkload.map(assignment => {
                                            const hasEvidence = assignment.evidenceUrls && assignment.evidenceUrls.length > 0;
                                            return (
                                                <div key={assignment.id} className="p-6 rounded-2xl border bg-card flex flex-col gap-4 shadow-sm">
                                                    <div className="flex justify-between items-start">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter">
                                                                    {assignment.period}
                                                                </Badge>
                                                                <span className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1">
                                                                    <Clock className="h-3 w-3" /> {assignment.assignedHours}h Semanales
                                                                </span>
                                                            </div>
                                                            <h4 className="font-black text-lg uppercase tracking-tight text-slate-800">
                                                                {assignment.activityName}
                                                            </h4>
                                                        </div>
                                                        <Badge className={cn(
                                                            "font-black text-[10px] uppercase h-7 px-4 rounded-full border-none",
                                                            hasEvidence ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                                                        )}>
                                                            {hasEvidence ? "Reportado" : "Sin Informe"}
                                                        </Badge>
                                                    </div>

                                                    {hasEvidence ? (
                                                        <div className="mt-2 space-y-4 animate-in fade-in zoom-in-95 duration-500">
                                                            <div className="p-4 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                                                                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2 flex items-center gap-1.5">
                                                                    <Info className="h-3.5 w-3.5" /> Justificación del Docente
                                                                </p>
                                                                <p className="text-sm font-medium text-slate-600 italic leading-relaxed">
                                                                    "{assignment.evidenceDescription || 'Sin descripción.'}"
                                                                </p>
                                                            </div>
                                                            
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                {assignment.evidenceUrls?.map((url, idx) => (
                                                                    <Button key={idx} variant="outline" className="justify-between h-12 rounded-xl group hover:border-primary transition-all bg-white" asChild>
                                                                        <a href={url} target="_blank" rel="noopener noreferrer">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="p-2 bg-primary/5 rounded-lg text-primary group-hover:scale-110 transition-transform">
                                                                                    <FileText className="h-4 w-4" />
                                                                                </div>
                                                                                <span className="text-xs font-bold uppercase tracking-tight">Evidencia {idx + 1}</span>
                                                                            </div>
                                                                            <Download className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                                                                        </a>
                                                                    </Button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="bg-amber-50/50 p-6 rounded-2xl border-2 border-dashed border-amber-100 flex flex-col items-center justify-center opacity-70">
                                                            <Info className="h-6 w-6 text-amber-500 mb-2" />
                                                            <p className="text-xs font-bold text-amber-800 uppercase tracking-widest">Esperando informe de evidencias</p>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="py-20 text-center opacity-30 flex flex-col items-center">
                                    <ClipboardCheck className="h-12 w-12 mb-4" />
                                    <p className="font-black uppercase tracking-widest text-sm">Sin actividades asignadas para este año</p>
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                    
                    <DialogFooter className="p-6 bg-muted/20 border-t shrink-0">
                        <Button variant="ghost" onClick={() => setSelectedTeacher(null)} className="font-black w-full h-12 uppercase tracking-widest">CERRAR AUDITORÍA</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
