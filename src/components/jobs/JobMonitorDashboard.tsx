
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getJobOffers, addJobOffer, updateJobOffer, deleteJobOffer, getJobApplications, getPrograms } from '@/config/firebase';
import type { JobOffer, JobApplication, Program, JobOfferSource } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Globe, ExternalLink, Eye, Loader2, Save, Trash2, MapPin, Briefcase, DollarSign, Building2, ShieldCheck, ClipboardList, GraduationCap, Edit, EyeOff, Search, Monitor } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '../ui/checkbox';
import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const semesters = Array.from({ length: 10 }, (_, i) => i + 1);
const sources: JobOfferSource[] = ['LinkedIn', 'CompuTrabajo', 'Indeed', 'Portal de Estado', 'Otros'];

export function JobMonitorDashboard() {
    const { instituteId } = useAuth();
    const { toast } = useToast();
    const [offers, setOffers] = useState<JobOffer[]>([]);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [loading, setLoading] = useState(true);
    
    // External Offer Form States
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        companyName: '',
        description: '',
        location: '',
        modality: 'Presencial' as any,
        jobType: 'Trabajo (Laboral)' as any,
        contractType: 'Tiempo Completo' as any,
        salaryRange: '',
        programIds: [] as string[],
        minSemester: 1,
        source: 'LinkedIn' as JobOfferSource,
        externalUrl: '',
    });

    const [filter, setFilter] = useState('');

    const fetchData = useCallback(async () => {
        if (!instituteId) return;
        setLoading(true);
        try {
            const [fetchedOffers, fetchedPrograms] = await Promise.all([
                getJobOffers(instituteId, { all: true }), // Fetch all, including closed
                getPrograms(instituteId),
            ]);
            setOffers(fetchedOffers);
            setPrograms(fetchedPrograms);
        } catch (error) {
            console.error("Error fetching job monitor data:", error);
        } finally {
            setLoading(false);
        }
    }, [instituteId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleOpenCreateExternal = () => {
        setEditingOfferId(null);
        setFormData({ 
            title: '', 
            companyName: '',
            description: '', 
            location: '', 
            modality: 'Presencial', 
            jobType: 'Trabajo (Laboral)', 
            contractType: 'Tiempo Completo',
            salaryRange: '', 
            programIds: [],
            minSemester: 1,
            source: 'LinkedIn',
            externalUrl: ''
        });
        setIsDialogOpen(true);
    };

    const handleSaveExternal = async () => {
        if (!instituteId) return;
        if (!formData.externalUrl) {
            toast({ title: "Atención", description: "Ingrese el link original de postulación.", variant: "destructive" });
            return;
        }
        setIsSubmitting(true);
        try {
            const payload = {
                ...formData,
                companyId: 'EXTERNAL_SOURCE',
                isExternal: true,
                isVerified: true,
                requirements: [], 
            };

            if (editingOfferId) {
                await updateJobOffer(instituteId, editingOfferId, payload);
                toast({ title: "Oferta Actualizada" });
            } else {
                await addJobOffer(instituteId, payload);
                toast({ title: "Oferta Capturada Publicada" });
            }
            
            setIsDialogOpen(false);
            fetchData();
        } catch (error) {
            toast({ title: "Error", variant: "destructive" });
        } finally { setIsSubmitting(false); }
    };

    const handleDelete = async (offerId: string) => {
        if (!instituteId) return;
        try {
            await deleteJobOffer(instituteId, offerId);
            toast({ title: "Oferta Eliminada" });
            fetchData();
        } catch (error) {
            toast({ title: "Error al eliminar", variant: "destructive" });
        }
    };

    const handleToggleStatus = async (offer: JobOffer) => {
        if (!instituteId) return;
        const newStatus = offer.status === 'Abierta' ? 'Cerrada' : 'Abierta';
        try {
            await updateJobOffer(instituteId, offer.id, { status: newStatus });
            toast({ title: newStatus === 'Abierta' ? "Vacante Activada" : "Vacante Desactivada" });
            fetchData();
        } catch (error) {
            toast({ title: "Error", variant: "destructive" });
        }
    };

    const toggleProgram = (pId: string) => {
        setFormData(prev => {
            const ids = new Set(prev.programIds);
            if (ids.has(pId)) ids.delete(pId);
            else ids.add(pId);
            return { ...prev, programIds: Array.from(ids) };
        });
    }

    const filteredOffers = offers.filter(o => 
        o.title.toLowerCase().includes(filter.toLowerCase()) || 
        o.companyName.toLowerCase().includes(filter.toLowerCase())
    );

    if (loading) return <div className="space-y-6"><Skeleton className="h-64 w-full rounded-3xl" /></div>;

    return (
        <div className="space-y-8">
            <Card className="border-primary/10 shadow-lg rounded-3xl overflow-hidden">
                <CardHeader className="bg-primary/5 p-8 border-b border-primary/10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <CardTitle className="text-2xl font-black uppercase tracking-tight text-primary flex items-center gap-2">
                                <Monitor className="h-6 w-6" /> Gestión Global de Empleabilidad
                            </CardTitle>
                            <CardDescription className="text-base font-medium">Monitoree ofertas de empresas y capture oportunidades externas.</CardDescription>
                        </div>
                        <Button onClick={handleOpenCreateExternal} className="font-bold h-12 px-8 shadow-xl shadow-primary/20">
                            <PlusCircle className="mr-2 h-5 w-5" /> AÑADIR OFERTA EXTERNA
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="relative mb-8">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input 
                            placeholder="Buscar en todo el catálogo de empleos..." 
                            value={filter} 
                            onChange={e => setFilter(e.target.value)} 
                            className="pl-12 h-12 rounded-xl bg-muted/30 border-none shadow-inner"
                        />
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {filteredOffers.map(offer => (
                            <Card key={offer.id} className={cn(
                                "group border shadow-md rounded-2xl overflow-hidden flex flex-col transition-all hover:border-primary/40 hover:shadow-xl",
                                offer.status === 'Cerrada' && "opacity-60 grayscale-[0.5]"
                            )}>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start mb-3">
                                        <Badge variant="secondary" className="font-black text-[9px] uppercase">
                                            {offer.isExternal ? `Fuente: ${offer.source}` : 'Empresa Aliada'}
                                        </Badge>
                                        <Badge variant={offer.status === 'Abierta' ? 'default' : 'secondary'} className="font-bold text-[9px] uppercase">
                                            {offer.status}
                                        </Badge>
                                    </div>
                                    <CardTitle className="text-lg font-black uppercase tracking-tight line-clamp-2 min-h-[3rem] leading-tight">
                                        {offer.title}
                                    </CardTitle>
                                    <CardDescription className="font-bold text-primary text-xs flex items-center gap-1.5">
                                        <Building2 className="h-3.5 w-3.5" /> {offer.companyName}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow space-y-4 pt-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                                            <MapPin className="h-3.5 w-3.5" /> {offer.location}
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                                            <GraduationCap className="h-3.5 w-3.5" /> Ciclo {offer.minSemester}+
                                        </div>
                                    </div>
                                    <Separator className="opacity-50" />
                                    <div className="flex justify-between items-center text-[10px] font-black text-muted-foreground uppercase">
                                        <span>Postulantes: <span className="text-primary">{offer.applicantCount || 0}</span></span>
                                        <span>{format(offer.createdAt.toDate(), "dd/MM/yy", { locale: es })}</span>
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-muted/20 border-t p-4 flex gap-2">
                                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl" onClick={() => handleToggleStatus(offer)}>
                                        {offer.status === 'Abierta' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                    {offer.isExternal ? (
                                        <Button variant="outline" className="flex-1 font-bold h-10 rounded-xl" asChild>
                                            <a href={offer.externalUrl} target="_blank"><ExternalLink className="h-4 w-4 mr-2" /> Link Origen</a>
                                        </Button>
                                    ) : (
                                        <Button variant="outline" className="flex-1 font-bold h-10 rounded-xl" asChild>
                                            <Link href={`/profile/${offer.companyId}`} target="_blank"><Building2 className="h-4 w-4 mr-2" /> Empresa</Link>
                                        </Button>
                                    )}
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive hover:bg-destructive/10 rounded-xl">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogTitle>¿Eliminar vacante?</AlertDialogTitle>
                                            <AlertDialogDescription>Esta acción es irreversible.</AlertDialogDescription>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(offer.id)} className="bg-destructive">Eliminar</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Dialog: Oferta Externa */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-4xl p-0 overflow-hidden rounded-3xl border-none shadow-2xl h-[90vh]">
                    <DialogHeader className="p-8 bg-primary text-primary-foreground">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl">
                                <Globe className="h-6 w-6 text-accent" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black uppercase tracking-tight">Capturar Oferta Externa</DialogTitle>
                                <DialogDescription className="text-primary-foreground/80 font-medium">Publicar vacantes encontradas en portales de empleo externos.</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
                        <ScrollArea className="flex-1">
                            <div className="p-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Título del Puesto</Label>
                                        <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="h-11 font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Empresa Reclutadora</Label>
                                        <Input value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} className="h-11" placeholder="Ej: Minera Las Bambas S.A." />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">URL Original de Postulación (Link)</Label>
                                    <div className="relative">
                                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                                        <Input value={formData.externalUrl} onChange={e => setFormData({...formData, externalUrl: e.target.value})} className="pl-10 h-11 font-mono text-xs border-primary/20" placeholder="https://www.computrabajo.com.pe/oferta/..." />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Descripción Resumida</Label>
                                    <Textarea rows={6} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="resize-none font-medium leading-relaxed" />
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Carreras Objetivo</Label>
                                    <ScrollArea className="h-40 border rounded-xl p-4 bg-muted/20">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {programs.map(p => (
                                                <div key={p.id} className="flex items-center space-x-2">
                                                    <Checkbox id={p.id} checked={formData.programIds.includes(p.id)} onCheckedChange={() => toggleProgram(p.id)} />
                                                    <Label htmlFor={p.id} className="text-xs font-bold uppercase cursor-pointer">{p.name}</Label>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </div>
                            </div>
                        </ScrollArea>

                        <div className="w-full lg:w-[320px] bg-muted/30 border-l p-8 space-y-6 shrink-0">
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Detalles del Portal</h4>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold">Fuente / Portal</Label>
                                    <Select value={formData.source} onValueChange={v => setFormData({...formData, source: v as JobOfferSource})}>
                                        <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {sources.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold">Ciclo Mínimo</Label>
                                    <Select value={String(formData.minSemester)} onValueChange={v => setFormData({...formData, minSemester: parseInt(v)})}>
                                        <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                                        <SelectContent>{semesters.map(s => <SelectItem key={s} value={String(s)}>{s}° Semestre</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold">Ubicación</Label>
                                    <Input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="h-10 text-xs bg-background" placeholder="Sede o Ciudad" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-6 bg-muted/50 border-t flex gap-3 shrink-0">
                        <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="font-bold h-12 px-8">CANCELAR</Button>
                        <Button onClick={handleSaveExternal} disabled={isSubmitting} className="font-black h-12 px-12 shadow-xl shadow-primary/20">
                            {isSubmitting ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                            PUBLICAR OFERTA CAPTURADA
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

