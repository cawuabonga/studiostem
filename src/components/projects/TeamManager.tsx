"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { getProjectTeams, saveProjectTeam, getUnitProject } from '@/services/abp-service';
import { getEnrolledStudentProfiles } from '@/config/firebase';
import type { Unit, Project, ProjectTeam, StudentProfile } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Users, Plus } from 'lucide-react';
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
}

export function TeamManager({ unit }: TeamManagerProps) {
    const { instituteId } = useAuth();
    const { toast } = useToast();
    const [project, setProject] = useState<Project | null>(null);
    const [teams, setTeams] = useState<ProjectTeam[]>([]);
    const [students, setStudents] = useState<StudentProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    
    const [formData, setFormData] = useState({ name: '', memberIds: [] as string[], leaderId: '' });

    const fetchData = useCallback(async () => {
        if (!instituteId) return;
        setLoading(true);
        try {
            const currentYear = new Date().getFullYear().toString();
            // CORRECCIÓN: Ahora importa de abp-service
            const proj = await getUnitProject(instituteId, unit.id);
            if (!proj) {
                setLoading(false);
                return;
            }
            setProject(proj);
            
            const [fetchedTeams, enrolledStudents] = await Promise.all([
                getProjectTeams(instituteId, unit.id, proj.id),
                getEnrolledStudentProfiles(instituteId, unit.id, currentYear, unit.period)
            ]);
            
            setTeams(fetchedTeams);
            setStudents(enrolledStudents);
        } catch (error) {
            console.error("Error fetching teams data:", error);
        } finally {
            setLoading(false);
        }
    }, [instituteId, unit]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSaveTeam = async () => {
        if (!instituteId || !project || !formData.name || formData.memberIds.length === 0 || !formData.leaderId) {
            toast({ title: "Atención", description: "Complete los datos del equipo y asigne un líder.", variant: "destructive" });
            return;
        }

        try {
            await saveProjectTeam(instituteId, unit.id, project.id, {
                ...formData,
                projectId: project.id,
                progress: 0
            });
            toast({ title: "Equipo Creado", description: `El grupo "${formData.name}" ha sido registrado.` });
            setIsDialogOpen(false);
            setFormData({ name: '', memberIds: [], leaderId: '' });
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

    if (!project) return (
        <Card className="border-2 border-dashed">
            <CardContent className="py-12 text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Primero debe configurar el Proyecto de Innovación para crear equipos.</p>
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-black uppercase tracking-tight text-primary">Equipos de Trabajo</h3>
                    <p className="text-sm text-muted-foreground font-medium">Estudiantes asignados al proyecto por grupos colaborativos.</p>
                </div>
                <Button onClick={() => setIsDialogOpen(true)} className="font-bold shadow-lg">
                    <Plus className="mr-2 h-4 w-4" /> CREAR EQUIPO
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {teams.map(team => (
                    <Card key={team.id} className="rounded-2xl border shadow-sm hover:shadow-lg transition-all group overflow-hidden">
                        <CardHeader className="bg-primary/5 pb-4">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-lg font-black uppercase tracking-tight text-primary">{team.name}</CardTitle>
                                <Users className="h-4 w-4 text-primary opacity-40" />
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Integrantes ({team.memberIds.length})</p>
                                <div className="space-y-1">
                                    {team.memberIds.map(mId => {
                                        const s = students.find(x => x.documentId === mId);
                                        const isLeader = team.leaderId === mId;
                                        return (
                                            <div key={mId} className={cn(
                                                "p-2 rounded-lg text-xs flex justify-between items-center",
                                                isLeader ? "bg-accent/20 border border-accent/40 font-bold" : "bg-muted/50"
                                            )}>
                                                <span>{s?.fullName || 'Estudiante'}</span>
                                                {isLeader && <Badge className="bg-accent text-accent-foreground text-[8px] h-4 font-black">LÍDER</Badge>}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-xl rounded-2xl p-0 overflow-hidden">
                    <DialogHeader className="p-6 bg-primary text-primary-foreground shrink-0">
                        <DialogTitle className="text-xl font-black uppercase tracking-tight">Nuevo Equipo de Proyecto</DialogTitle>
                    </DialogHeader>
                    <div className="p-6 space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase">Nombre del Equipo</Label>
                            <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej: Grupo Los Innovadores" />
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase">Seleccionar Integrantes</Label>
                            <ScrollArea className="h-[200px] rounded-xl border-2 border-dashed p-4">
                                <div className="space-y-2">
                                    {students.map(s => (
                                        <div key={s.documentId} className="flex items-center space-x-2 p-1.5 hover:bg-muted/50 rounded-lg">
                                            <Checkbox id={s.documentId} checked={formData.memberIds.includes(s.documentId)} onCheckedChange={() => toggleMember(s.documentId)} />
                                            <Label htmlFor={s.documentId} className="text-xs cursor-pointer font-bold uppercase truncate flex-1">{s.fullName}</Label>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>

                        {formData.memberIds.length > 0 && (
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-primary">Asignar Líder de Equipo</Label>
                                <Select value={formData.leaderId} onValueChange={v => setFormData({...formData, leaderId: v})}>
                                    <SelectTrigger><SelectValue placeholder="Elija un líder..." /></SelectTrigger>
                                    <SelectContent>
                                        {formData.memberIds.map(mId => {
                                            const s = students.find(x => x.documentId === mId);
                                            return <SelectItem key={mId} value={mId}>{s?.fullName}</SelectItem>
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                    <DialogFooter className="p-6 bg-muted/20 border-t">
                        <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="font-bold">Cancelar</Button>
                        <Button onClick={handleSaveTeam} className="font-black px-8 shadow-lg">Confirmar Equipo</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}