
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
import { Search, MapPin, DollarSign, Clock, Building2, Send, CheckCircle2, Info, Filter, Briefcase, ShieldCheck, ExternalLink, GraduationCap, AlertTriangle, UserCircle, FileText } from 'lucide-react';
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
        return offers.filter(o => {
            const matchesText = o.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                               o.companyName.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesModality = modalityFilter === 'all' || o.modality === modalityFilter;
            const matchesType = typeFilter === 'all' || o.jobType === typeFilter;
            return matchesText && matchesModality && matchesType;
        });
    }, [offers, searchTerm, modalityFilter, typeFilter]);

    const handleApply = async (offer: JobOffer) => {
        if (!instituteId || !user?.documentId) return;
        
        // Final sanity check before applying (client-side)
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

    if (loading) return <div className="grid md:grid-cols-2 gap-6"><Skeleton className="h-64 w-full" /><Skeleton className="h-64 w-full" /></div>;

    const isProfileComplete = (user?.skills?.length || 0) >= 3 && !!user?.bio && !!user?.cvUrl;
    const currentSem = (user as any)?.currentSemester || 1;

    return (
        <Tabs defaultValue="ofertas" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 h-14 bg-muted/50 p-1 rounded-2xl">
                <TabsTrigger value="ofertas" className="text-base font-black uppercase tracking-tight"><Search className="mr-2 h-5 w-5" /> Vacantes para Mi Perfil</TabsTrigger>
                <TabsTrigger value="mis-postulaciones" className="text-base font-black uppercase tracking-tight"><Briefcase className="mr-2 h-5 w-5" /> Mis Postulaciones</TabsTrigger>
            </TabsList>

            <TabsContent value="ofertas" className="space-y-8">
                {/* Alerta de Perfil Incompleto */}
                {!isProfileComplete && (
                    <div className="p-4 bg-amber-50 border-2 border-dashed border-amber-200 rounded-2xl flex gap-4 items-center animate-in fade-in slide-in-from-top-4">
                        <div className="p-3 bg-white rounded-xl shadow-sm">
                            <UserCircle className="h-8 w-8 text-amber-500" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-black text-amber-800 uppercase text-sm">Tu Perfil está Incompleto</h4>
                            <p className="text-xs text-amber-700 font-medium">Para postular a vacantes oficiales, debes registrar al menos 3 habilidades, una biografía y <strong>subir tu CV en PDF</strong> en tu perfil.</p>
                        </div>
                        <Button variant="outline" size="sm" className="font-bold border-amber-200 text-amber-700 bg-white" asChild>
                            <Link href="/dashboard/academic">Ir a Mi Perfil</Link>
                        </Button>
                    </div>
                )}

                {/* Filtros */}
                <Card className="border-primary/10 shadow-lg rounded-3xl overflow-hidden">
                    <CardContent className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                            <div className="md:col-span-2 space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Búsqueda Directa</Label>
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input placeholder="Puesto, empresa o palabra clave..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-12 h-12 rounded-xl bg-muted/30 border-none shadow-inner" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Modalidad</Label>
                                <Select value={modalityFilter} onValueChange={setModalityFilter}>
                                    <SelectTrigger className="h-12 rounded-xl bg-muted/30 border-none shadow-inner"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas</SelectItem>
                                        <SelectItem value="Presencial">Presencial</SelectItem>
                                        <SelectItem value="Remoto">Remoto</SelectItem>
                                        <SelectItem value="Híbrido">Híbrido</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Categoría</Label>
                                <Select value={typeFilter} onValueChange={setTypeFilter}>
                                    <SelectTrigger className="h-12 rounded-xl bg-muted/30 border-none shadow-inner"><SelectValue /></SelectTrigger>
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

                {/* Grid de Ofertas */}
                <div className="grid gap-8 md:grid-cols-2">
                    {filteredOffers.length > 0 ? filteredOffers.map(offer => {
                        const alreadyApplied = myApplications.some(a => a.jobId === offer.id);
                        const meetsSemRequirement = currentSem >= (offer.minSemester || 1);
                        const canApply = isProfileComplete && meetsSemRequirement && !alreadyApplied;

                        return (
                            <Card key={offer.id} className="group hover:border-primary/40 hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] overflow-hidden flex flex-col border-none shadow-xl bg-white">
                                <CardHeader className="relative pb-0 p-8">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="h-20 w-20 relative rounded-3xl overflow-hidden border-4 border-slate-50 bg-white shadow-lg p-2 transition-transform duration-500 group-hover:scale-110">
                                            <Image 
                                                src={offer.companyLogo || `https://placehold.co/200x200.png?text=${offer.companyName[0]}`} 
                                                alt={offer.companyName} 
                                                fill 
                                                className="object-contain p-1"
                                            />
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <Badge variant="outline" className="uppercase font-black text-[10px] px-3 py-1 rounded-full border-primary/20 text-primary bg-primary/5">
                                                {offer.jobType}
                                            </Badge>
                                            <Badge className="bg-green-100 text-green-700 border-none px-3 py-1 rounded-full font-black text-[9px] uppercase tracking-tighter flex items-center gap-1">
                                                <ShieldCheck className="h-3 w-3" /> Verificada
                                            </Badge>
                                        </div>
                                    </div>
                                    <CardTitle className="text-2xl font-black uppercase tracking-tight group-hover:text-primary transition-colors leading-tight line-clamp-2 min-h-[4rem]">
                                        {offer.title}
                                    </CardTitle>
                                    <CardDescription className="text-lg font-bold text-slate-700 mt-2 flex items-center gap-2">
                                        <Building2 className="h-5 w-5 text-primary/60" /> {offer.companyName}
                                    </CardDescription>
                                </CardHeader>
                                
                                <CardContent className="flex-grow space-y-6 p-8">
                                    <div className="space-y-4">
                                        <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed font-medium">
                                            {offer.description}
                                        </p>
                                        
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 transition-colors group-hover:bg-white">
                                                <div className="p-2 bg-white rounded-lg shadow-sm text-primary"><MapPin className="h-4 w-4" /></div>
                                                <span className="text-[10px] font-black uppercase truncate text-slate-600">{offer.location}</span>
                                            </div>
                                            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 transition-colors group-hover:bg-white">
                                                <div className="p-2 bg-white rounded-lg shadow-sm text-green-600"><DollarSign className="h-4 w-4" /></div>
                                                <span className="text-[11px] font-black truncate text-slate-800">S/ {offer.salaryRange || 'Acordar'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-primary/5 p-4 rounded-2xl flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <GraduationCap className="h-5 w-5 text-primary" />
                                            <div>
                                                <p className="text-[9px] font-black uppercase text-muted-foreground leading-none mb-1">Requisito de Avance</p>
                                                <p className="text-xs font-bold uppercase">{offer.minSemester}° Semestre o superior</p>
                                            </div>
                                        </div>
                                        {meetsSemRequirement ? (
                                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                                        ) : (
                                            <Badge variant="destructive" className="text-[8px] font-black uppercase">Faltan {offer.minSemester - currentSem} ciclos</Badge>
                                        )}
                                    </div>

                                    <Separator className="opacity-40" />
                                    
                                    <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                        <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Publicado {format(offer.createdAt.toDate(), "dd MMM", { locale: es })}</span>
                                        <span className="bg-muted px-2 py-1 rounded-md">{offer.contractType || 'Por definir'}</span>
                                    </div>
                                </CardContent>
                                
                                <CardFooter className="p-8 pt-0 mt-auto flex flex-col gap-3">
                                    {!meetsSemRequirement && (
                                        <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl text-red-700 w-full">
                                            <AlertTriangle className="h-4 w-4 shrink-0" />
                                            <p className="text-[10px] font-bold">No cumples con el semestre mínimo requerido para este puesto.</p>
                                        </div>
                                    )}
                                    
                                    {!isProfileComplete && (
                                        <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl text-amber-700 w-full">
                                            <Info className="h-4 w-4 shrink-0" />
                                            <p className="text-[10px] font-bold">Debes completar tu CV (PDF), habilidades y biografía en tu perfil.</p>
                                        </div>
                                    )}

                                    {alreadyApplied ? (
                                        <Button className="w-full h-14 bg-green-50 text-green-700 border-2 border-green-200 hover:bg-green-100 rounded-2xl font-black uppercase tracking-widest" variant="outline" disabled>
                                            <CheckCircle2 className="mr-2 h-5 w-5" /> POSTULACIÓN ENVIADA
                                        </Button>
                                    ) : (
                                        <Button 
                                            className="w-full h-14 font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl transition-all" 
                                            onClick={() => handleApply(offer)}
                                            disabled={!canApply}
                                        >
                                            <Send className="mr-2 h-5 w-5" /> {canApply ? 'Postular con Perfil STEM' : 'Postulación Bloqueada'}
                                        </Button>
                                    )}
                                </CardFooter>
                            </Card>
                        )
                    }) : (
                        <div className="col-span-full py-32 text-center text-muted-foreground bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                            <Info className="h-16 w-16 mx-auto mb-6 opacity-10" />
                            <p className="text-xl font-black uppercase tracking-widest">Sin ofertas para tu perfil</p>
                            <p className="mt-2 text-sm font-medium">Vuelve pronto o ajusta tus habilidades en tu perfil personal.</p>
                        </div>
                    )}
                </div>
            </TabsContent>

            <TabsContent value="mis-postulaciones">
                <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden">
                    <CardContent className="p-8">
                        {myApplications.length > 0 ? (
                            <div className="space-y-4">
                                {myApplications.map(app => (
                                    <div key={app.id} className="p-6 rounded-[1.5rem] border bg-card flex flex-col sm:flex-row items-center justify-between gap-6 group hover:border-primary/40 hover:bg-primary/5 transition-all duration-300">
                                        <div className="flex items-center gap-6 flex-1 w-full sm:w-auto">
                                            <div className="p-4 bg-primary/10 rounded-2xl text-primary transition-transform group-hover:rotate-12">
                                                <Briefcase className="h-6 w-6" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-black text-lg uppercase tracking-tight text-slate-800 truncate">{app.jobTitle}</h4>
                                                <div className="flex items-center gap-3 mt-1.5">
                                                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-tighter">{app.companyName}</p>
                                                    <span className="h-1 w-1 rounded-full bg-slate-300" />
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Enviado el {format(app.appliedAt.toDate(), "dd 'de' MMMM", { locale: es })}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 w-full sm:w-auto justify-between">
                                            <Badge className={cn(
                                                "font-black text-[10px] uppercase px-4 h-8 rounded-full border-none",
                                                app.status === 'Pendiente' ? "bg-amber-100 text-amber-700" :
                                                app.status === 'Aceptado' ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                                            )}>
                                                {app.status}
                                            </Badge>
                                            <Button variant="ghost" size="icon" className="rounded-full text-primary hover:bg-primary/10" asChild>
                                                <Link href={app.cvUrl || '#'} target="_blank">
                                                    <FileText className="h-5 w-5" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-24 text-center text-muted-foreground flex flex-col items-center opacity-40">
                                <Briefcase className="h-12 w-12 mb-4" />
                                <p className="font-black uppercase tracking-[0.2em] text-sm">Aún no has postulado a ninguna vacante</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}
