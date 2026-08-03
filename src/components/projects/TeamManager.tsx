
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { getProjectTeams, saveProjectTeam, getUnitProjects } from '@/services/abp-service';
import { getEnrolledStudentProfiles } from '@/config/firebase';
import type { Unit, Project, ProjectTeam, StudentProfile } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Users, Plus, Rocket } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { ScrollArea } from '../ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { cn } from '@/lib/utils';

interface TeamManagerProps {
    unit: Unit;
    year: string;
}

export function TeamManager({ unit, year }: TeamManagerProps) {
    const { instituteId } = useAuth();
    const { toast } = useToast();
    const [projects, setProjects] = useState<Project[]>([]);
    const [teams, setTeams] = useState<ProjectTeam[]>([]);
    const [students, setStudents] = useState<StudentProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    
    const [formData, setFormData] = useState({ name: '', memberIds: [] as string[], leaderId: '', projectId: '' });

    const fetchData = useCallback(async () => {
        if (!instituteId) return;
        setLoading(true);
        try {
            const [fetchedProjects, fetchedTeams, enrolledStudents] = await Promise.all([
                getUnitProjects(instituteId, unit.id, year, unit.period),
                getProjectTeams(instituteId, unit.id, year, unit.period),
                getEnrolledStudentProfiles(instituteId, unit.id, year, unit.period)
            ]);
            
            setProjects(fetchedProjects);
            setTeams(fetchedTeams);
            setStudents(enrolledStudents);
        } catch (error) {
            console.error("Error fetching teams data:", error);
        } finally {
            setLoading(false);
        }
    }, [instituteId, unit, year]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSaveTeam = async () => {
        if (!instituteId || !formData.projectId || !formData.name || formData.memberIds.length === 0 || !formData.leaderId) {
            toast({ title: "Atención", description: "Complete los datos del equipo, seleccione un proyecto y asigne un líder.", variant: "destructive" });
            return;
        }

        try {
            await saveProjectTeam(instituteId, unit.id, year, unit.period, {
                ...formData,
                progress: 0
            });
            toast({ title: "Equipo Creado", description: `El grupo "${formData.name}" ha sido registrado.` });
            setIsDialogOpen(false);
            setFormData({ name: '', memberIds: [], leaderId: '', projectId: '' });
            fetchData();
        } catch (error) {
            toast({ title: "Error", variant: "destructive" });
        }
    };

    const toggleMember = (sId: string) => {
        setFormData(prev => {
            const ids = new Set(prev.memberIds);
            if (ids.has(sId)) ids.delete(sId);
            else ids.add(sId);
            return { ...prev, memberIds: Array.from(ids) };
        });
    }

    if (loading) return <Skeleton className="h-64 w-full" />;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-black uppercase tracking-tight text-primary">Equipos e Innovación ({year})</h3>
                    <p className="text-sm text-muted-foreground font-medium">Asigne estudiantes en grupos para la instancia académica actual.</p>
                </div>
                <Button onClick={() => setIsDialogOpen(true)} className="font-bold shadow-lg" disabled={projects.length === 0}>
                    <Plus className="mr-2 h-4 w-4" /> CONFORMAR EQUIPO
                </Button>
            </div>

            {projects.length === 0 && (
                <div className="p-6 border-2 border-dashed rounded-3xl bg-amber-50 text-amber-800 flex items-center gap-4">
                    <Rocket className="h-10 w-10 opacity-40" />
                    <p className="text-sm font-bold">Primero debe crear al menos un Reto ABP en la pestaña "Proyecto de Innovación" para conformar equipos en este año.</p>
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {teams.map(team => {
                    const project = projects.find(p => p.id === team.projectId);
                    return (
                        <Card key={team.id} className="rounded-2xl border shadow-sm hover:shadow-lg transition-all group overflow-hidden bg-white">
                            <CardHeader className="bg-primary/5 pb-4 border-b">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg font-black uppercase tracking-tight text-primary">{team.name}</CardTitle>
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                                            <Rocket className="h-3 w-3" /> {project?.title || 'Sin proyecto'}
                                        </div>
                                    </div>
                                    <Users className="h-4 w-4 text-primary opacity-40" />
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-4">
                                <div className="space-y-2">
                                    <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Integrantes ({team.memberIds.length})</p>
                                    <div className="space-y-1">
                                        {team.memberIds.map(mId => {
                                            const s = students.find(x => x.documentId === mId);
                                            const isLeader = team.leaderId === mId;
                                            return (
                                                <div key={mId} className={cn(
                                                    "p-2 rounded-lg text-[11px] flex justify-between items-center transition-colors",
                                                    isLeader ? "bg-accent/10 border border-accent/30 font-bold" : "bg-muted/30"
                                                )}>
                                                    <span className="truncate pr-2 uppercase">{s?.fullName || 'Estudiante'}</span>
                                                    {isLeader && <Badge className="bg-accent text-accent-foreground text-[8px] h-4 font-black">LÍDER</Badge>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-xl rounded-2xl p-0 overflow-hidden">
                    <DialogHeader className="p-6 bg-primary text-primary-foreground shrink-0">
                        <DialogTitle className="text-xl font-black uppercase tracking-tight">Nueva Conformación de Equipo</DialogTitle>
                    </DialogHeader>
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase">Nombre del Equipo</Label>
                                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej: Grupo A" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase">Reto / Proyecto Asignado</Label>
                                <Select value={formData.projectId} onValueChange={v => setFormData({...formData, projectId: v})}>
                                    <SelectTrigger className="text-xs font-bold uppercase"><SelectValue placeholder="Seleccione reto..." /></SelectTrigger>
                                    <SelectContent>
                                        {projects.map(p => <SelectItem key={p.id} value={p.id} className="text-xs uppercase">{p.title}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <Label className="text-[10px] font-black uppercase">Seleccionar Integrantes</Label>
                                <Badge variant="outline" className="text-[9px] font-black">{formData.memberIds.length} seleccionados</Badge>
                            </div>
                            <ScrollArea className="h-[180px] rounded-xl border-2 border-dashed p-4 bg-muted/20">
                                <div className="grid grid-cols-1 gap-2">
                                    {students.map(s => (
                                        <div key={s.documentId} className="flex items-center space-x-2 p-1.5 hover:bg-background rounded-lg transition-colors">
                                            <Checkbox id={s.documentId} checked={formData.memberIds.includes(s.documentId)} onCheckedChange={() => toggleMember(s.documentId)} />
                                            <Label htmlFor={s.documentId} className="text-[10px] cursor-pointer font-bold uppercase truncate flex-1">{s.fullName}</Label>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>

                        {formData.memberIds.length > 0 && (
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-primary">Definir Líder de Grupo</Label>
                                <Select value={formData.leaderId} onValueChange={v => setFormData({...formData, leaderId: v})}>
                                    <SelectTrigger className="h-12 border-primary/20"><SelectValue placeholder="Elija un líder..." /></SelectTrigger>
                                    <SelectContent>
                                        {formData.memberIds.map(mId => {
                                            const s = students.find(x => x.documentId === mId);
                                            return <SelectItem key={mId} value={mId} className="uppercase text-xs">{s?.fullName}</SelectItem>
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                    <DialogFooter className="p-6 bg-muted/20 border-t flex gap-3">
                        <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="font-bold">Cancelar</Button>
                        <Button onClick={handleSaveTeam} className="font-black px-8 shadow-xl" disabled={!formData.leaderId || !formData.projectId}>Confirmar Equipo</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
