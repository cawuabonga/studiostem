
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getJobOffers, addJobOffer, updateJobOffer, deleteJobOffer, getJobApplications, getPrograms, getCompanyProfiles, updateJobApplication } from '@/config/firebase';
import type { JobOffer, JobApplication, Program, CompanyProfile } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
    PlusCircle, 
    Users, 
    ExternalLink, 
    Eye, 
    Loader2, 
    Save, 
    Trash2, 
    MapPin, 
    Briefcase, 
    DollarSign, 
    Building2, 
    ShieldCheck, 
    ClipboardList, 
    GraduationCap, 
    Edit, 
    EyeOff, 
    CheckCircle, 
    FileText, 
    Download, 
    CalendarCheck, 
    Settings2, 
    MessageSquareText, 
    Users2, 
    CalendarDays, 
    Clock, 
    ChevronLeft, 
    ChevronRight, 
    History 
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import Link from 'next/link';
import { Separator } from '../ui/separator';
import { Checkbox } from '../ui/checkbox';
import { cn } from '@/lib/utils';
import { Timestamp } from 'firebase/firestore';
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
const EXPIRED_PAGE_SIZE = 10;

export function CompanyDashboard() {
    const { instituteId, user } = useAuth();
    const { toast } = useToast();
    const [offers, setOffers] = useState<JobOffer[]>([]);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
    const [loading, setLoading] = useState(true);
    
    // Pagination for expired offers
    const [expiredPage, setExpiredPage] = useState(1);

    // Offer Creation / Editing
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        location: '',
        modality: 'Presencial' as any,
        jobType: 'Trabajo (Laboral)' as any,
        contractType: 'Tiempo Completo' as any,
        salaryRange: '',
        programIds: [] as string[],
        minSemester: 1,
        vacancies: 1,
        deadline: '',
    });

    // Applications View
    const [selectedOffer, setSelectedOffer] = useState<JobOffer | null>(null);
    const [applications, setApplications] = useState<JobApplication[]>([]);
    const [loadingApps, setLoadingApps] = useState(false);

    // Manage Applicant states
    const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);
    const [manageData, setManageData] = useState({ status: '' as any, interviewDate: '', interviewTime: '09:00', notes: '' });

    const fetchData = useCallback(async () => {
        if (!instituteId || !user?.documentId) return;
        setLoading(true);
        try {
            const [fetchedOffers, fetchedPrograms, profile] = await Promise.all([
                getJobOffers(instituteId, { companyId: user.documentId, all: true }),
                getPrograms(instituteId),
                getCompanyProfiles(instituteId).then(list => list.find(c => c.documentId === user.documentId) || null)
            ]);
            setOffers(fetchedOffers);
            setPrograms(fetchedPrograms);
            setCompanyProfile(profile);
            if (profile && !editingOfferId) {
                setFormData(prev => ({ ...prev, location: profile.address || '' }));
            }
        } catch (error) {
            console.error("Error fetching company dashboard:", error);
        } finally {
            setLoading(false);
        }
    }, [instituteId, user, editingOfferId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Split offers into active and expired/closed
    const { activeOffers, expiredOffers } = useMemo(() => {
        const now = new Date();
        const active: JobOffer[] = [];
        const expired: JobOffer[] = [];

        offers.forEach(offer => {
            const hasPassedDeadline = offer.deadline && offer.deadline.toDate() < now;
            const isClosedManually = offer.status === 'Cerrada';
            
            if (isClosedManually || hasPassedDeadline) {
                expired.push(offer);
            } else {
                active.push(offer);
            }
        });

        return {
            activeOffers: active,
            expiredOffers: expired.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
        };
    }, [offers]);

    const paginatedExpiredOffers = useMemo(() => {
        const start = (expiredPage - 1) * EXPIRED_PAGE_SIZE;
        return expiredOffers.slice(start, start + EXPIRED_PAGE_SIZE);
    }, [expiredOffers, expiredPage]);

    const totalExpiredPages = Math.ceil(expiredOffers.length / EXPIRED_PAGE_SIZE);

    const handleOpenCreate = () => {
        setEditingOfferId(null);
        setFormData({ 
            title: '', 
            description: '', 
            location: companyProfile?.address || '', 
            modality: 'Presencial', 
            jobType: 'Trabajo (Laboral)', 
            contractType: 'Tiempo Completo',
            salaryRange: '', 
            programIds: [],
            minSemester: 1,
            vacancies: 1,
            deadline: '',
        });
        setIsDialogOpen(true);
    };

    const handleOpenEdit = (offer: JobOffer) => {
        setEditingOfferId(offer.id);
        setFormData({
            title: offer.title,
            description: offer.description,
            location: offer.location,
            modality: offer.modality,
            jobType: offer.jobType,
            contractType: offer.contractType,
            salaryRange: offer.salaryRange || '',
            programIds: offer.programIds,
            minSemester: offer.minSemester,
            vacancies: offer.vacancies || 1,
            deadline: offer.deadline ? format(offer.deadline.toDate(), 'yyyy-MM-dd') : '',
        });
        setIsDialogOpen(true);
    };

    const handleSaveOffer = async () => {
        if (!instituteId || !user?.documentId || !companyProfile) return;
        if (formData.programIds.length === 0) {
            toast({ title: "Atención", description: "Seleccione al menos una carrera técnica objetivo.", variant: "destructive" });
            return;
        }
        setIsSubmitting(true);
        try {
            // Se corrige el desfase de fecha añadiendo la hora T12:00:00 para evitar que la conversión a UTC desplace el día
            const deadlineDate = formData.deadline ? new Date(formData.deadline + 'T12:00:00') : undefined;

            const payload = {
                ...formData,
                companyId: user.documentId,
                companyName: companyProfile.name,
                companyLogo: companyProfile.logoUrl,
                companyAddress: companyProfile.address,
                isVerified: true,
                requirements: [],
                deadline: deadlineDate ? Timestamp.fromDate(deadlineDate) : undefined,
            };

            if (editingOfferId) {
                await updateJobOffer(instituteId, editingOfferId, payload);
                toast({ title: "Oferta Actualizada", description: "Los cambios se han guardado correctamente." });
            } else {
                await addJobOffer(instituteId, payload);
                toast({ title: "Oferta Publicada", description: "Los estudiantes que cumplan los requisitos podrán verla y postular." });
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
            toast({ title: newStatus === 'Abierta' ? "Vacante Publicada" : "Vacante Oculta" });
            fetchData();
        } catch (error) {
            toast({ title: "Error", variant: "destructive" });
        }
    };

    const handleViewApplicants = async (offer: JobOffer) => {
        if (!instituteId) return;
        setSelectedOffer(offer);
        setLoadingApps(true);
        try {
            const apps = await getJobApplications(instituteId, offer.id);
            setApplications(apps);
        } catch (error) {
            toast({ title: "Error al cargar postulantes", variant: "destructive" });
        } finally { setLoadingApps(false); }
    };

    const handleOpenManageApp = (app: JobApplication) => {
        setSelectedApp(app);
        setManageData({
            status: app.status,
            interviewDate: app.interviewDate ? format(app.interviewDate.toDate(), 'yyyy-MM-dd') : '',
            interviewTime: app.interviewDate ? format(app.interviewDate.toDate(), 'HH:mm') : '09:00',
            notes: app.notes || ''
        });
    };

    const handleUpdateApplication = async () => {
        if (!instituteId || !selectedApp) return;
        setIsSubmitting(true);
        try {
            let interviewTimestamp = null;
            if (manageData.interviewDate) {
                // CORRECCIÓN DE FECHA: Desglosamos YYYY-MM-DD y usamos constructor local
                const [year, month, day] = manageData.interviewDate.split('-').map(Number);
                const [h, m] = manageData.interviewTime.split(':').map(Number);
                
                // Creamos la fecha en hora local del navegador
                const date = new Date(year, month - 1, day, h, m);
                interviewTimestamp = Timestamp.fromDate(date);
            }

            await updateJobApplication(instituteId, selectedApp.id, {
                status: manageData.status,
                notes: manageData.notes,
                interviewDate: interviewTimestamp as any
            });

            toast({ title: "Estado Actualizado", description: "El estudiante verá los cambios en su panel." });
            setSelectedApp(null);
            if (selectedOffer) handleViewApplicants(selectedOffer);
        } catch (error) {
            toast({ title: "Error", variant: "destructive" });
        } finally { setIsSubmitting(false); }
    };

    const toggleProgram = (pId: string) => {
        setFormData(prev => {
            const ids = new Set(prev.programIds);
            if (ids.has(pId)) ids.delete(pId);
            else ids.add(pId);
            return { ...prev, programIds: Array.from(ids) };
        });
    }

    if (loading) return <div className="space-y-6"><Skeleton className="h-12 w-1/4" /><Skeleton className="h-64 w-full" /></div>;

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="text-2xl font-black uppercase tracking-tight text-primary flex items-center gap-2">
                    <Briefcase className="h-6 w-6" /> Mis Vacantes Publicadas
                </h3>
                <Button onClick={handleOpenCreate} className="font-bold shadow-lg h-12 px-6 w-full sm:w-auto">
                    <PlusCircle className="mr-2 h-5 w-5" /> PUBLICAR NUEVA OFERTA
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Columnas 1 y 2: Vacantes Activas */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <h4 className="font-black uppercase text-sm tracking-widest text-slate-700">OFERTAS VIGENTES ({activeOffers.length})</h4>
                    </div>
                    
                    <div className="grid gap-6 md:grid-cols-2">
                        {activeOffers.length > 0 ? activeOffers.map(offer => (
                            <Card key={offer.id} className="hover:border-primary transition-all shadow-md rounded-2xl overflow-hidden group flex flex-col border-green-100 bg-white">
                                <CardHeader className="pb-4 relative">
                                    <div className="flex justify-between items-start mb-4">
                                        <Badge variant="outline" className="text-[10px] font-black uppercase border-primary/20 text-primary">{offer.jobType}</Badge>
                                        <div className="flex gap-1">
                                            <Badge variant="secondary" className="font-bold uppercase text-[9px] bg-green-100 text-green-700">
                                                ABIERTA
                                            </Badge>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => handleOpenEdit(offer)}>
                                                    <Edit className="h-3 w-3" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full text-destructive" onClick={() => handleToggleStatus(offer)}>
                                                    <EyeOff className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                    <CardTitle className="text-xl font-black uppercase tracking-tight leading-tight min-h-[3rem] line-clamp-2">{offer.title}</CardTitle>
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                        <Badge variant="secondary" className="text-[9px] font-bold bg-primary/5 text-primary border-none">
                                            <Users2 className="h-3 w-3 mr-1" /> {offer.vacancies || 1} Vacantes
                                        </Badge>
                                        <Badge variant="secondary" className="text-[9px] font-bold bg-primary/5 text-primary border-none">
                                            <GraduationCap className="h-3 w-3 mr-1" /> Ciclo {offer.minSemester}+
                                        </Badge>
                                    </div>
                                    <CardDescription className="text-xs font-medium flex items-center gap-1.5 mt-2">
                                        <MapPin className="h-3.5 w-3.5 opacity-60" /> {offer.modality} • {offer.location}
                                    </CardDescription>
                                    {offer.deadline && (
                                        <CardDescription className="text-xs font-bold text-destructive mt-1 flex items-center gap-1.5">
                                            <Clock className="h-3.5 w-3.5" /> Límite: {format(offer.deadline.toDate(), "dd 'de' MMM", { locale: es })}
                                        </CardDescription>
                                    )}
                                </CardHeader>
                                <CardFooter className="border-t pt-4 bg-muted/20 mt-auto flex items-center gap-2">
                                    <Button variant="ghost" className="flex-1 font-bold group-hover:bg-primary group-hover:text-primary-foreground transition-all" onClick={() => handleViewApplicants(offer)}>
                                        <Users className="mr-2 h-4 w-4" /> Ver Candidatos
                                    </Button>
                                    <Badge variant="secondary" className="h-10 px-4 rounded-xl font-black text-sm bg-primary/10 text-primary border-none">
                                        {offer.applicantCount || 0}
                                    </Badge>
                                </CardFooter>
                            </Card>
                        )) : (
                            <div className="col-span-full py-20 text-center text-muted-foreground border-2 border-dashed rounded-3xl bg-muted/5">
                                <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                <p className="font-bold text-sm uppercase">Sin ofertas vigentes en este momento</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Columna 3: Historial de Vacantes (Vencidas/Cerradas) */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                        <History className="h-5 w-5 text-muted-foreground" />
                        <h4 className="font-black uppercase text-sm tracking-widest text-slate-500">HISTORIAL ({expiredOffers.length})</h4>
                    </div>

                    <div className="space-y-4">
                        {paginatedExpiredOffers.length > 0 ? (
                            <>
                                {paginatedExpiredOffers.map(offer => (
                                    <Card key={offer.id} className="p-4 rounded-xl border bg-muted/20 opacity-70 group hover:opacity-100 transition-all border-dashed">
                                        <div className="flex justify-between items-start mb-2">
                                            <Badge variant="outline" className="text-[8px] font-black uppercase py-0 px-2 h-4">{offer.jobType}</Badge>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => handleOpenEdit(offer)}>
                                                    <Edit className="h-3 w-3" />
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full text-destructive">
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>¿Eliminar vacante?</AlertDialogTitle>
                                                            <AlertDialogDescription>Esta acción es permanente y eliminará la oferta "{offer.title}".</AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDelete(offer.id)} className="bg-destructive">Eliminar</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </div>
                                        <h5 className="text-sm font-black uppercase tracking-tight text-slate-700 line-clamp-1">{offer.title}</h5>
                                        <div className="flex justify-between items-center mt-3">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">{format(offer.createdAt.toDate(), "dd MMM yy")}</p>
                                            <Button size="sm" variant="ghost" className="h-7 text-[9px] font-black uppercase" onClick={() => handleViewApplicants(offer)}>
                                                {offer.applicantCount || 0} Candidatos <Eye className="ml-1 h-3 w-3" />
                                            </Button>
                                        </div>
                                    </Card>
                                ))}

                                {totalExpiredPages > 1 && (
                                    <div className="flex items-center justify-between pt-2">
                                        <p className="text-[9px] font-black text-muted-foreground uppercase">Página {expiredPage} de {totalExpiredPages}</p>
                                        <div className="flex gap-1">
                                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setExpiredPage(p => Math.max(1, p - 1))} disabled={expiredPage === 1}>
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setExpiredPage(p => Math.min(totalExpiredPages, p + 1))} disabled={expiredPage === totalExpiredPages}>
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="py-12 text-center text-muted-foreground border-2 border-dashed rounded-2xl">
                                <History className="h-8 w-8 mx-auto mb-2 opacity-10" />
                                <p className="text-[10px] font-bold uppercase">Sin historial</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Dialogs: Create/Edit, Applicants, Manage */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-5xl p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
                    <DialogHeader className="p-8 bg-primary text-primary-foreground">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                                <Briefcase className="h-6 w-6 text-accent" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black uppercase tracking-tight">
                                    {editingOfferId ? "Editar Vacante Laboral" : "Publicar Vacante Laboral"}
                                </DialogTitle>
                                <DialogDescription className="text-primary-foreground/80 font-medium">Configure los requisitos académicos y profesionales del puesto.</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    
                    <div className="flex flex-col lg:flex-row min-h-[600px]">
                        <div className="flex-1 p-8 space-y-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Título del Puesto</Label>
                                <Input 
                                    value={formData.title} 
                                    onChange={e => setFormData({...formData, title: e.target.value})} 
                                    placeholder="Ej: Técnico en Mantenimiento Junior" 
                                    className="h-12 text-lg font-bold border-primary/10"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Descripción Detallada y Requisitos</Label>
                                <Textarea 
                                    rows={10} 
                                    value={formData.description} 
                                    onChange={e => setFormData({...formData, description: e.target.value})} 
                                    placeholder="Describa las funciones, competencias técnicas requeridas y beneficios..."
                                    className="resize-none border-primary/10 leading-relaxed font-medium"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Programas de Estudio Objetivo (Filtro Match)</Label>
                                <ScrollArea className="h-40 border rounded-xl p-4 bg-muted/20">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {programs.map(p => (
                                            <div key={p.id} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-background transition-colors border border-transparent hover:border-primary/10">
                                                <Checkbox id={p.id} checked={formData.programIds.includes(p.id)} onCheckedChange={() => toggleProgram(p.id)} />
                                                <Label htmlFor={p.id} className="text-xs font-bold leading-none cursor-pointer uppercase truncate">{p.name}</Label>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                                <p className="text-[10px] text-muted-foreground italic">La oferta solo será visible para estudiantes de las carreras seleccionadas.</p>
                            </div>
                        </div>

                        <div className="w-full lg:w-[350px] bg-muted/30 border-l p-8 space-y-6">
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Requisitos Académicos</h4>
                                
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold">Semestre Mínimo</Label>
                                    <Select value={String(formData.minSemester)} onValueChange={v => setFormData({...formData, minSemester: parseInt(v)})}>
                                        <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {semesters.map(s => <SelectItem key={s} value={String(s)}>Desde {s}° Semestre</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold">Vigente hasta (Límite)</Label>
                                    <div className="relative">
                                        <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input 
                                            type="date" 
                                            value={formData.deadline} 
                                            onChange={e => setFormData({...formData, deadline: e.target.value})} 
                                            className="pl-9 bg-background h-10"
                                        />
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold">Categoría</Label>
                                    <Select value={formData.jobType} onValueChange={v => setFormData({...formData, jobType: v})}>
                                        <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Trabajo (Laboral)">Oportunidad Laboral</SelectItem>
                                            <SelectItem value="Prácticas (EFSRT)">Prácticas (EFSRT)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold">Tipo de Contrato</Label>
                                    <Select value={formData.contractType} onValueChange={v => setFormData({...formData, contractType: v})}>
                                        <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Tiempo Completo">Tiempo Completo</SelectItem>
                                            <SelectItem value="Medio Tiempo">Medio Tiempo</SelectItem>
                                            <SelectItem value="Por Proyecto">Por Proyecto</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Economía y Sede</h4>
                                
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold">Remuneración (S/)</Label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input 
                                            placeholder="Ej: 1,500.00" 
                                            value={formData.salaryRange} 
                                            onChange={e => setFormData({...formData, salaryRange: e.target.value})} 
                                            className="pl-9 bg-background font-mono"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold">Vacantes Disponibles</Label>
                                    <div className="relative">
                                        <Users2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input 
                                            type="number" 
                                            min="1"
                                            value={formData.vacancies} 
                                            onChange={e => setFormData({...formData, vacancies: parseInt(e.target.value) || 1})} 
                                            className="pl-9 bg-background h-10 font-bold"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold">Ubicación de Trabajo</Label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input 
                                            value={formData.location} 
                                            onChange={e => setFormData({...formData, location: e.target.value})} 
                                            className="pl-9 bg-background text-xs"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-6 bg-muted/50 border-t flex gap-3">
                        <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="font-bold">CANCELAR</Button>
                        <Button onClick={handleSaveOffer} disabled={isSubmitting} className="font-black px-12 shadow-xl shadow-primary/20">
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} 
                            {editingOfferId ? "GUARDAR CAMBIOS" : "PUBLICAR VACANTE OFICIAL"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!selectedOffer} onOpenChange={open => !open && setSelectedOffer(null)}>
                <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0 overflow-hidden shadow-2xl rounded-2xl">
                    <DialogHeader className="p-8 border-b bg-muted/20 shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-2xl">
                                <Users className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl uppercase font-black tracking-tight">Postulantes: {selectedOffer?.title}</DialogTitle>
                                <DialogDescription className="font-medium">Revise el talento verificado por el instituto.</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="flex-1 overflow-hidden">
                        <ScrollArea className="h-full p-8">
                            {loadingApps ? <div className="space-y-4"><Skeleton className="h-20 w-full rounded-2xl" /><Skeleton className="h-20 w-full rounded-2xl" /></div> : applications.length > 0 ? (
                                <div className="space-y-4">
                                    {applications.map((app, idx) => (
                                        <div key={app.id} className="p-5 rounded-2xl border bg-card flex flex-col sm:flex-row items-center justify-between gap-6 group hover:border-primary/30 hover:shadow-md transition-all">
                                            <div className="flex items-center gap-5 flex-1 min-w-0">
                                                <span className="text-xl font-black text-slate-300 w-8">{idx + 1}.</span>
                                                <div className="h-12 w-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-black text-xl shadow-lg uppercase">{app.studentName[0]}</div>
                                                <div className="truncate">
                                                    <h4 className="font-black text-base uppercase tracking-tight text-slate-800 truncate">{app.studentName}</h4>
                                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                                        <Badge variant="outline" className="text-[9px] font-bold h-5 px-2 bg-muted/50 border-none">DNI: {app.studentId}</Badge>
                                                        <Badge className={cn(
                                                            "font-black text-[9px] h-5 border-none",
                                                            app.status === 'Aceptado' ? "bg-green-100 text-green-700" :
                                                            app.status === 'Rechazado' ? "bg-red-100 text-red-700" :
                                                            app.status === 'En Proceso' ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
                                                        )}>
                                                            {app.status}
                                                        </Badge>
                                                        <Badge className="bg-green-100 text-green-700 font-black text-[9px] h-5 border-none">VERIFICADO</Badge>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-2 w-full sm:w-auto">
                                                <Button size="sm" variant="outline" className="h-10 px-4 rounded-xl font-bold border-primary/20 hover:bg-primary/5" asChild>
                                                    <a href={app.cvUrl || '#'} target="_blank">
                                                        <Download className="mr-2 h-4 w-4" /> CV
                                                    </a>
                                                </Button>
                                                <Button size="sm" variant="outline" className="h-10 px-4 rounded-xl font-black" asChild>
                                                    <Link href={`/profile/${app.studentId}`} target="_blank">
                                                        <Eye className="mr-2 h-4 w-4" /> PERFIL
                                                    </Link>
                                                </Button>
                                                <Button size="sm" className="h-10 px-4 rounded-xl font-black bg-accent text-accent-foreground" onClick={() => handleOpenManageApp(app)}>
                                                    <Settings2 className="mr-2 h-4 w-4" /> GESTIONAR
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-20 text-center opacity-30 flex flex-col items-center">
                                    <Users className="h-12 w-12 mb-4" />
                                    <p className="font-black uppercase tracking-widest text-sm">Sin postulaciones todavía</p>
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                    <DialogFooter className="p-6 border-t bg-muted/20">
                         <Button variant="ghost" onClick={() => setSelectedOffer(null)} className="font-black">CERRAR PANEL</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!selectedApp} onOpenChange={open => !open && setSelectedApp(null)}>
                <DialogContent className="max-w-md rounded-2xl shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black uppercase text-primary">Gestionar Candidato</DialogTitle>
                        <DialogDescription>Actualice el estado y agende actividades para <strong>{selectedApp?.studentName}</strong>.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Estado del Proceso</Label>
                            <Select value={manageData.status} onValueChange={v => setManageData({...manageData, status: v})}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Pendiente">Pendiente</SelectItem>
                                    <SelectItem value="En Proceso">En Selección / Entrevista</SelectItem>
                                    <SelectItem value="Aceptado">Aceptado (Contratado)</SelectItem>
                                    <SelectItem value="Rechazado">Rechazado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3 p-4 bg-muted/30 rounded-xl border border-dashed">
                             <div className="flex items-center gap-2 mb-1">
                                <CalendarCheck className="h-4 w-4 text-primary" />
                                <Label className="text-[10px] font-black uppercase tracking-widest">Citar a Entrevista</Label>
                             </div>
                             <div className="grid grid-cols-2 gap-2">
                                <Input type="date" value={manageData.interviewDate} onChange={e => setManageData({...manageData, interviewDate: e.target.value})} className="h-10" />
                                <Input type="time" value={manageData.interviewTime} onChange={e => setManageData({...manageData, interviewTime: e.target.value})} className="h-10" />
                             </div>
                             <p className="text-[9px] text-muted-foreground italic">Opcional. Se notificará al alumno en su panel.</p>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <MessageSquareText className="h-4 w-4" /> Nota de Respuesta / Feedback
                            </Label>
                            <Textarea 
                                placeholder="Escriba un mensaje para el alumno (ej: Link de Zoom, oficina de entrevista, motivo de rechazo...)" 
                                value={manageData.notes} 
                                onChange={e => setManageData({...manageData, notes: e.target.value})}
                                className="resize-none h-24"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setSelectedApp(null)} className="font-bold">CANCELAR</Button>
                        <Button onClick={handleUpdateApplication} disabled={isSubmitting} className="font-black px-8">
                            {isSubmitting ? <Loader2 className="animate-spin h-3.5 w-3.5 mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                            GUARDAR CAMBIOS
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
