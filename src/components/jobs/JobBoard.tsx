
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
import { Search, MapPin, DollarSign, Clock, Building2, Send, CheckCircle2, Info, Filter, Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
            const [fetchedOffers, fetchedApps, fetchedPrograms] = await Promise.all([
                getJobOffers(instituteId, { programId: (user as any).programId }),
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

    return (
        <Tabs defaultValue="ofertas" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 h-14 bg-muted/50 p-1">
                <TabsTrigger value="ofertas" className="text-base font-bold"><Search className="mr-2 h-5 w-5" /> Vacantes Disponibles</TabsTrigger>
                <TabsTrigger value="mis-postulaciones" className="text-base font-bold"><Briefcase className="mr-2 h-5 w-5" /> Mis Postulaciones</TabsTrigger>
            </TabsList>

            <TabsContent value="ofertas" className="space-y-6">
                {/* Filtros */}
                <Card className="border-primary/10 shadow-md">
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                            <div className="md:col-span-2 space-y-2">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground">Búsqueda Directa</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input placeholder="Puesto, empresa o palabra clave..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 h-11" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground">Modalidad</Label>
                                <Select value={modalityFilter} onValueChange={setModalityFilter}>
                                    <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas</SelectItem>
                                        <SelectItem value="Presencial">Presencial</SelectItem>
                                        <SelectItem value="Remoto">Remoto</SelectItem>
                                        <SelectItem value="Híbrido">Híbrido</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground">Tipo de Contrato</Label>
                                <Select value={typeFilter} onValueChange={setTypeFilter}>
                                    <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Cualquiera</SelectItem>
                                        <SelectItem value="Prácticas">Prácticas Pre-profesionales</SelectItem>
                                        <SelectItem value="Tiempo Completo">Tiempo Completo</SelectItem>
                                        <SelectItem value="Medio Tiempo">Medio Tiempo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Grid de Ofertas */}
                <div className="grid gap-6 md:grid-cols-2">
                    {filteredOffers.length > 0 ? filteredOffers.map(offer => {
                        const alreadyApplied = myApplications.some(a => a.jobId === offer.id);
                        return (
                            <Card key={offer.id} className="group hover:border-primary/40 hover:shadow-xl transition-all duration-300 flex flex-col">
                                <CardHeader>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-muted rounded-xl">
                                            <Building2 className="h-6 w-6 text-primary" />
                                        </div>
                                        <Badge variant="secondary" className="uppercase font-black text-[10px]">{offer.jobType}</Badge>
                                    </div>
                                    <CardTitle className="text-xl font-black uppercase tracking-tight group-hover:text-primary transition-colors">{offer.title}</CardTitle>
                                    <CardDescription className="text-base font-bold text-slate-800">{offer.companyName}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow space-y-4">
                                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">{offer.description}</p>
                                    <div className="grid grid-cols-2 gap-4 text-xs font-bold text-muted-foreground uppercase">
                                        <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> {offer.modality} - {offer.location}</div>
                                        {offer.salaryRange && <div className="flex items-center gap-2"><DollarSign className="h-3.5 w-3.5" /> {offer.salaryRange}</div>}
                                    </div>
                                </CardContent>
                                <CardFooter className="border-t pt-6 bg-muted/10">
                                    {alreadyApplied ? (
                                        <Button className="w-full bg-green-50 text-green-700 border-green-200 hover:bg-green-50" variant="outline" disabled>
                                            <CheckCircle2 className="mr-2 h-4 w-4" /> POSTULACIÓN ENVIADA
                                        </Button>
                                    ) : (
                                        <Button className="w-full font-black uppercase tracking-widest" onClick={() => handleApply(offer)}>
                                            <Send className="mr-2 h-4 w-4" /> Postular con Perfil STEM
                                        </Button>
                                    )}
                                </CardFooter>
                            </Card>
                        )
                    }) : (
                        <div className="col-span-full py-20 text-center text-muted-foreground bg-muted/20 rounded-2xl border-2 border-dashed">
                            <Info className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p className="text-lg font-bold">No hay ofertas que coincidan con los filtros.</p>
                            <p className="text-sm">Vuelva a intentarlo más tarde o cambie los criterios de búsqueda.</p>
                        </div>
                    )}
                </div>
            </TabsContent>

            <TabsContent value="mis-postulaciones">
                <Card>
                    <CardContent className="pt-6">
                        {myApplications.length > 0 ? (
                            <div className="space-y-4">
                                {myApplications.map(app => (
                                    <div key={app.id} className="p-4 rounded-xl border flex items-center justify-between group hover:bg-muted/30 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-primary/10 rounded-lg"><Briefcase className="h-5 w-5 text-primary" /></div>
                                            <div>
                                                <h4 className="font-black text-sm uppercase">{app.jobTitle}</h4>
                                                <p className="text-xs text-muted-foreground font-bold">{app.companyName} • Enviado el {format(app.appliedAt.toDate(), "dd 'de' MMMM", { locale: es })}</p>
                                            </div>
                                        </div>
                                        <Badge className={cn(
                                            "font-black text-[10px] uppercase",
                                            app.status === 'Pendiente' ? "bg-amber-100 text-amber-700" :
                                            app.status === 'Aceptado' ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                                        )}>
                                            {app.status}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-20 text-center text-muted-foreground">
                                <p>Aún no has postulado a ninguna vacante.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}
