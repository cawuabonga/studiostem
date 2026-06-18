
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getJobOffers, applyToJob, getApplicationsForStudent, getPrograms } from '@/config/firebase';
import type { JobOffer, JobApplication, Program } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Search, MapPin, DollarSign, Clock, Building2, Send, CheckCircle2, Info, Filter, Briefcase, ShieldCheck, ExternalLink, GraduationCap, AlertTriangle, UserCircle, FileText, CalendarCheck, MessageSquareText, Globe, Users2, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Image from 'next/image';
import Link from 'next/link';
import { Separator } from '../ui/separator';

export function JobBoard() {
    const { instituteId, user } = useAuth();
    const { toast } = useToast();
    const [offers, setOffers] = useState<JobOffer[]>([]);
    const [myApplications, setMyApplications] = useState<JobApplication[]>([]);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [loading, setLoading] = useState(true);
    
    // UI state for expandable descriptions
    const [expandedOfferIds, setExpandedOfferIds] = useState<Set<string>>(new Set());

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [modalityFilter, setModalityFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');

    const fetchData = useCallback(async () => {
        if (!instituteId || !user?.documentId) return;
        setLoading(true);
        try {
            const studentProgramId = (user as any).programId;
            const [fetchedOffers, fetchedApps, fetchedPrograms] = await Promise.all([
                getJobOffers(instituteId, { programId: studentProgramId }),
                getApplicationsForStudent(instituteId, user.documentId),
                getPrograms(instituteId)
            ]);
            setOffers(fetchedOffers);
            setMyApplications(fetchedApps);
            setPrograms(fetchedPrograms);
        } catch (error) {
            console.error("Error fetching job board data:", error);
        } finally {
            setLoading(false);
        }
    }, [instituteId, user]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const filteredOffers = useMemo(() => {
        const now = new Date();
        return offers.filter(o => {
            // Check expiry: exclude if deadline passed
            const isExpired = o.deadline && o.deadline.toDate() < now;
            if (isExpired) return false;

            const matchesText = o.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                               o.companyName.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesModality = modalityFilter === 'all' || o.modality === modalityFilter;
            const matchesType = typeFilter === 'all' || o.jobType === typeFilter;
            return matchesText && matchesModality && matchesType;
        });
    }, [offers, searchTerm, modalityFilter, typeFilter]);

    const handleApply = async (offer: JobOffer) => {
        if (!instituteId || !user?.documentId) return;
        
        // Check if it's an external offer
        if (offer.isExternal && offer.externalUrl) {
            window.open(offer.externalUrl, '_blank');
            toast({ title: "Redirigiendo...", description: `Abriendo postulación en ${offer.source}.` });
            return;
        }

        const isProfileComplete = (user.skills?.length || 0) >= 3 && !!user.bio && !!user.cvUrl;
        const currentSem = (user as any).currentSemester || 1;
        const meetsSemRequirement = currentSem >= (offer.minSemester || 1);

        if (!isProfileComplete || !meetsSemRequirement) {
            toast({ title: "No puedes postular", description: "Verifica que cumplas con los requisitos del puesto y tengas tu perfil completo.", variant: "destructive" });
            return;
        }

        try {
            await applyToJob(instituteId, {
                jobId: offer.id,
                jobTitle: offer.title,
                companyId: offer.companyId,
                companyName: offer.companyName,
                studentId: user.documentId,
                studentName: user.displayName || 'Estudiante'
            });
            toast({ title: "Postulación Enviada", description: "La empresa ha recibido tu perfil verificado." });
            fetchData();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const toggleExpand = (offerId: string) => {
        setExpandedOfferIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(offerId)) newSet.delete(offerId);
            else newSet.add(offerId);
            return newSet;
        });
    };

    if (loading) return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-80 w-full rounded-2xl" />
            <Skeleton className="h-80 w-full rounded-2xl" />
            <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
    );

    const isProfileComplete = (user?.skills?.length || 0) >= 3 && !!user?.bio && !!user?.cvUrl;
    const currentSem = (user as any)?.currentSemester || 1;

    return (
        <div className="w-full">
            <Tabs defaultValue="ofertas" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 h-12 bg-muted/50 p-1 rounded-xl">
                    <TabsTrigger value="ofertas" className="text-sm font-black uppercase tracking-tight"><Search className="mr-2 h-4 w-4" /> Vacantes para Mi Perfil</TabsTrigger>
                    <TabsTrigger value="mis-postulaciones" className="text-sm font-black uppercase tracking-tight"><Briefcase className="mr-2 h-4 w-4" /> Mis Postulaciones</TabsTrigger>
                </TabsList>

                <TabsContent value="ofertas" className="space-y-6">
                    {!isProfileComplete && (
                        <div className="p-4 bg-amber-50 border-2 border-dashed border-amber-200 rounded-xl flex gap-4 items-center animate-in fade-in slide-in-from-top-4">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                <UserCircle className="h-6 w-6 text-amber-500" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-black text-amber-800 uppercase text-xs">Tu Perfil está Incompleto</h4>
                                <p className="text-[11px] text-amber-700 font-medium">Para postular a vacantes oficiales, debes registrar al menos 3 habilidades, una biografía y <strong>subir tu CV en PDF</strong>.</p>
                            </div>
                            <Button variant="outline" size="sm" className="font-bold h-8 text-[11px] border-amber-200 text-amber-700 bg-white" asChild>
                                <Link href="/dashboard/academic">Ir a Mi Perfil</Link>
                            </Button>
                        </div>
                    )}

                    <Card className="border-primary/10 shadow-md rounded-2xl overflow-hidden">
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                <div className="md:col-span-2 space-y-1.5">
                                    <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Búsqueda Directa</Label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input placeholder="Puesto, empresa o palabra clave..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 h-10 rounded-lg bg-muted/30 border-none shadow-inner text-sm" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Modalidad</Label>
                                    <Select value={modalityFilter} onValueChange={setModalityFilter}>
                                        <SelectTrigger className="h-10 rounded-lg bg-muted/30 border-none shadow-inner text-sm"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todas</SelectItem>
                                            <SelectItem value="Presencial">Presencial</SelectItem>
                                            <SelectItem value="Remoto">Remoto</SelectItem>
                                            <SelectItem value="Híbrido">Híbrido</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Categoría</Label>
                                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                                        <SelectTrigger className="h-10 rounded-lg bg-muted/30 border-none shadow-inner text-sm"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Cualquiera</SelectItem>
                                            <SelectItem value="Trabajo (Laboral)">Oportunidad Laboral</SelectItem>
                                            <SelectItem value="Prácticas (EFSRT)">Prácticas (EFSRT)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {filteredOffers.length > 0 ? filteredOffers.map(offer => {
                            const alreadyApplied = myApplications.some(a => a.jobId === offer.id);
                            const meetsSemRequirement = currentSem >= (offer.minSemester || 1);
                            const canApply = offer.isExternal || (isProfileComplete && meetsSemRequirement && !alreadyApplied);
                            const isExpanded = expandedOfferIds.has(offer.id);

                            return (
                                <Card key={offer.id} className="group hover:border-primary/40 hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden flex flex-col border-slate-100 shadow-md bg-white">
                                    <CardHeader className="relative pb-0 p-5">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className="h-14 w-14 relative rounded-xl overflow-hidden border-2 border-slate-50 bg-white shadow-sm p-1.5 shrink-0 group-hover:scale-105 transition-transform duration-300">
                                                    <Image 
                                                        src={offer.companyLogo || `https://placehold.co/200x200.png?text=${offer.companyName[0]}`} 
                                                        alt={offer.companyName} 
                                                        fill 
                                                        className="object-contain p-1"
                                                    />
                                                </div>
                                                <div className="truncate">
                                                    <p className="text-[13px] font-black uppercase text-primary leading-none truncate tracking-tight mb-1">{offer.companyName}</p>
                                                    <div className="flex items-center gap-1.5">
                                                        <Badge variant="outline" className="uppercase font-black text-[8px] px-1.5 h-4 border-primary/20 text-primary bg-primary/5">
                                                            {offer.jobType}
                                                        </Badge>
                                                        {!offer.isExternal && <ShieldCheck className="h-3 w-3 text-green-500" />}
                                                    </div>
                                                </div>
                                            </div>
                                            <Badge className={cn(
                                                "border-none px-2 py-0.5 rounded-full font-black text-[8px] uppercase tracking-tighter flex items-center gap-1",
                                                offer.isExternal ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                                            )}>
                                                {offer.isExternal ? <Globe className="h-2.5 w-2.5" /> : <CheckCircle2 className="h-2.5 w-2.5" />} 
                                                {offer.isExternal ? offer.source : "VIGENTE"}
                                            </Badge>
                                        </div>
                                        <CardTitle className="text-lg font-black uppercase tracking-tight group-hover:text-primary transition-colors leading-tight line-clamp-2">
                                            {offer.title}
                                        </CardTitle>
                                    </CardHeader>
                                    
                                    <CardContent className="flex-grow space-y-4 p-5 pt-2">
                                        <div className="space-y-3">
                                            <div className="relative">
                                                <p className={cn(
                                                    "text-[12px] text-slate-500 leading-snug font-medium transition-all duration-300",
                                                    isExpanded ? "" : "line-clamp-2"
                                                )}>
                                                    {offer.description}
                                                </p>
                                                <Button 
                                                    variant="link" 
                                                    size="sm" 
                                                    className="h-auto p-0 text-primary font-bold text-[11px] mt-1"
                                                    onClick={() => toggleExpand(offer.id)}
                                                >
                                                    {isExpanded ? "Ver menos" : "Leer más..."}
                                                </Button>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100 transition-colors group-hover:bg-white">
                                                    <div className="p-1.5 bg-white rounded-lg shadow-xs text-primary"><MapPin className="h-3.5 w-3.5" /></div>
                                                    <span className="text-[9px] font-black uppercase truncate text-slate-600">{offer.location}</span>
                                                </div>
                                                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100 transition-colors group-hover:bg-white">
                                                    <div className="p-1.5 bg-white rounded-lg shadow-xs text-green-600"><DollarSign className="h-3.5 w-3.5" /></div>
                                                    <span className="text-[10px] font-black truncate text-slate-800">S/ {offer.salaryRange || 'Acordar'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-primary/5 p-2.5 rounded-xl flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <GraduationCap className="h-4 w-4 text-primary" />
                                                    <div>
                                                        <p className="text-[8px] font-black uppercase text-muted-foreground leading-none mb-0.5">Requisito</p>
                                                        <p className="text-[10px] font-bold uppercase">{offer.minSemester || 1}° Ciclo</p>
                                                    </div>
                                                </div>
                                                {meetsSemRequirement ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <XCircle className="h-3.5 w-3.5 text-destructive" />}
                                            </div>
                                            <div className="bg-primary/5 p-2.5 rounded-xl flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Users2 className="h-4 w-4 text-primary" />
                                                    <div>
                                                        <p className="text-[8px] font-black uppercase text-muted-foreground leading-none mb-0.5">Vacantes</p>
                                                        <p className="text-[10px] font-bold uppercase">{offer.vacancies || 1} Libres</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <Separator className="opacity-30" />
                                        
                                        <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="flex items-center gap-1 text-slate-400"><Clock className="h-3 w-3" /> {format(offer.createdAt.toDate(), "dd MMM", { locale: es })}</span>
                                                {offer.deadline && <span className="flex items-center gap-1 text-destructive"><AlertTriangle className="h-3 w-3" /> Límite: {format(offer.deadline.toDate(), "dd MMM", { locale: es })}</span>}
                                            </div>
                                            <span className="bg-muted px-2 py-0.5 rounded text-slate-500">{offer.contractType || '---'}</span>
                                        </div>
                                    </CardContent>
                                    
                                    <CardFooter className="p-5 pt-0 mt-auto flex flex-col gap-2">
                                        {!offer.isExternal && !meetsSemRequirement && (
                                            <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg text-red-700 w-full">
                                                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                                <p className="text-[9px] font-bold">Ciclo insuficiente para este puesto.</p>
                                            </div>
                                        )}
                                        
                                        {!offer.isExternal && !isProfileComplete && (
                                            <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg text-amber-700 w-full">
                                                <Info className="h-3.5 w-3.5 shrink-0" />
                                                <p className="text-[9px] font-bold">Completa tu CV (PDF) y biografía.</p>
                                            </div>
                                        )}

                                        {alreadyApplied && !offer.isExternal ? (
                                            <Button className="w-full h-11 bg-green-50 text-green-700 border-2 border-green-200 hover:bg-green-100 rounded-xl font-black text-xs uppercase tracking-widest" variant="outline" disabled>
                                                <CheckCircle2 className="mr-2 h-4 w-4" /> POSTULACIÓN ENVIADA
                                            </Button>
                                        ) : (
                                            <Button 
                                                className={cn(
                                                    "w-full h-11 font-black text-xs uppercase tracking-[0.1em] rounded-xl shadow-lg transition-all",
                                                    offer.isExternal ? "bg-blue-600 hover:bg-blue-700 text-white" : ""
                                                )}
                                                onClick={() => handleApply(offer)}
                                                disabled={!offer.isExternal && !canApply}
                                            >
                                                {offer.isExternal ? <ExternalLink className="mr-2 h-4 w-4" /> : <Send className="mr-2 h-4 w-4" />} 
                                                {offer.isExternal ? `Ver en ${offer.source}` : (canApply ? 'Postular Ahora' : 'Bloqueado')}
                                            </Button>
                                        )}
                                    </CardFooter>
                                </Card>
                            )
                        }) : (
                            <div className="col-span-full py-24 text-center text-muted-foreground bg-white rounded-3xl border-2 border-dashed border-slate-200">
                                <Info className="h-12 w-12 mx-auto mb-4 opacity-10" />
                                <p className="text-lg font-black uppercase tracking-widest">Sin ofertas disponibles</p>
                                <p className="mt-1 text-xs font-medium">Prueba ajustando los filtros de búsqueda.</p>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="mis-postulaciones">
                    <Card className="rounded-3xl border-none shadow-lg overflow-hidden">
                        <CardContent className="p-6">
                            {myApplications.length > 0 ? (
                                <div className="space-y-4">
                                    {myApplications.map(app => (
                                        <div key={app.id} className="p-4 rounded-2xl border bg-card flex flex-col gap-4 group hover:border-primary/40 hover:bg-primary/5 transition-all duration-300">
                                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                                <div className="flex items-center gap-4 flex-1 w-full sm:w-auto">
                                                    <div className="p-3 bg-primary/10 rounded-xl text-primary transition-transform group-hover:rotate-6">
                                                        <Briefcase className="h-5 w-5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-black text-sm uppercase tracking-tight text-slate-800 truncate">{app.jobTitle}</h4>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">{app.companyName}</p>
                                                            <span className="h-0.5 w-0.5 rounded-full bg-slate-300" />
                                                            <p className="text-[9px] text-slate-400 font-bold uppercase">{format(app.appliedAt.toDate(), "dd MMM", { locale: es })}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Badge className={cn(
                                                    "font-black text-[10px] uppercase px-4 h-8 rounded-full border-none shadow-sm",
                                                    app.status === 'Pendiente' ? "bg-amber-100 text-amber-700" :
                                                    app.status === 'Visto' ? "bg-blue-100 text-blue-700" :
                                                    app.status === 'En Proceso' ? "bg-blue-100 text-blue-700" :
                                                    app.status === 'Aceptado' ? "bg-green-100 text-green-700" :
                                                    app.status === 'Rechazado' ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"
                                                )}>
                                                    {app.status}
                                                </Badge>
                                            </div>

                                            {(app.interviewDate || app.notes) && (
                                                <div className="bg-white rounded-xl p-4 border border-primary/10 shadow-sm animate-in zoom-in-95 duration-500">
                                                    <h5 className="text-[9px] font-black uppercase text-primary tracking-widest mb-3 flex items-center gap-1.5">
                                                        <Info className="h-3.5 w-3.5" /> Feedback de la Empresa
                                                    </h5>
                                                    
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {app.interviewDate && (
                                                            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                                                <div className="p-1.5 bg-white rounded-md text-blue-600 shadow-xs"><CalendarCheck className="h-4 w-4" /></div>
                                                                <div>
                                                                    <p className="text-[8px] font-black text-blue-800 uppercase leading-none mb-1">Cita para Entrevista</p>
                                                                    <p className="text-[11px] font-black text-blue-700">
                                                                        {format(app.interviewDate.toDate(), "EEE dd 'de' MMM", { locale: es })}
                                                                    </p>
                                                                    <p className="text-[10px] font-bold text-blue-500 mt-0.5">{format(app.interviewDate.toDate(), 'HH:mm')}</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                        
                                                        {app.notes && (
                                                            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                                                <div className="p-1.5 bg-white rounded-md text-slate-600 shadow-xs"><MessageSquareText className="h-4 w-4" /></div>
                                                                <div>
                                                                    <p className="text-[8px] font-black text-slate-500 uppercase leading-none mb-1">Nota del Reclutador</p>
                                                                    <p className="text-[10px] font-medium text-slate-700 italic">"{app.notes}"</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-20 text-center text-muted-foreground flex flex-col items-center opacity-30">
                                    <Briefcase className="h-10 w-10 mb-4" />
                                    <p className="font-black uppercase tracking-[0.1em] text-xs">Sin postulaciones registradas</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
