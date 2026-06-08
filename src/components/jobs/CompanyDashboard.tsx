
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getJobOffers, addJobOffer, getJobApplications, getPrograms } from '@/config/firebase';
import type { JobOffer, JobApplication, Program } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Users, ExternalLink, Eye, Loader2, Save, Trash2, MapPin, Briefcase } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';

export function CompanyDashboard() {
    const { instituteId, user } = useAuth();
    const { toast } = useToast();
    const [offers, setOffers] = useState<JobOffer[]>([]);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Offer Creation
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        location: '',
        modality: 'Presencial' as any,
        jobType: 'Tiempo Completo' as any,
        salaryRange: '',
        programIds: [] as string[]
    });

    // Applications View
    const [selectedOffer, setSelectedOffer] = useState<JobOffer | null>(null);
    const [applications, setApplications] = useState<JobApplication[]>([]);
    const [loadingApps, setLoadingApps] = useState(false);

    const fetchData = useCallback(async () => {
        if (!instituteId || !user?.documentId) return;
        setLoading(true);
        try {
            const [fetchedOffers, fetchedPrograms] = await Promise.all([
                getJobOffers(instituteId, { companyId: user.documentId }),
                getPrograms(instituteId)
            ]);
            setOffers(fetchedOffers);
            setPrograms(fetchedPrograms);
        } catch (error) {
            console.error("Error fetching company dashboard:", error);
        } finally {
            setLoading(false);
        }
    }, [instituteId, user]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleCreateOffer = async () => {
        if (!instituteId || !user?.documentId) return;
        setIsSubmitting(true);
        try {
            await addJobOffer(instituteId, {
                ...formData,
                companyId: user.documentId,
                companyName: user.displayName || 'Empresa Aliada',
                requirements: [], // Extensible later
            });
            toast({ title: "Oferta Publicada", description: "Los estudiantes podrán verla y postular ahora mismo." });
            setIsDialogOpen(false);
            setFormData({ title: '', description: '', location: '', modality: 'Presencial', jobType: 'Tiempo Completo', salaryRange: '', programIds: [] });
            fetchData();
        } catch (error) {
            toast({ title: "Error", variant: "destructive" });
        } finally { setIsSubmitting(false); }
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

    if (loading) return <div className="space-y-6"><Skeleton className="h-12 w-1/4" /><Skeleton className="h-64 w-full" /></div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black uppercase tracking-tight text-primary flex items-center gap-2">
                    <Briefcase className="h-6 w-6" /> Mis Vacantes Publicadas
                </h3>
                <Button onClick={() => setIsDialogOpen(true)} className="font-bold shadow-lg">
                    <PlusCircle className="mr-2 h-4 w-4" /> PUBLICAR NUEVA OFERTA
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {offers.length > 0 ? offers.map(offer => (
                    <Card key={offer.id} className="hover:border-primary transition-all">
                        <CardHeader>
                            <div className="flex justify-between items-start mb-2">
                                <Badge variant="outline" className="text-[10px] font-black uppercase">{offer.jobType}</Badge>
                                <Badge variant="secondary" className="bg-green-100 text-green-700">{offer.status}</Badge>
                            </div>
                            <CardTitle className="text-lg font-black uppercase">{offer.title}</CardTitle>
                            <CardDescription className="text-xs font-bold flex items-center gap-1"><MapPin className="h-3 w-3" /> {offer.modality} • {offer.location}</CardDescription>
                        </CardHeader>
                        <CardFooter className="border-t pt-4">
                            <Button variant="outline" className="w-full font-bold" onClick={() => handleViewApplicants(offer)}>
                                <Users className="mr-2 h-4 w-4" /> Gestionar Candidatos
                            </Button>
                        </CardFooter>
                    </Card>
                )) : (
                    <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-xl">
                        <p className="font-bold">No tienes ofertas activas.</p>
                        <p className="text-sm">Crea una oferta para empezar a recibir perfiles.</p>
                    </div>
                )}
            </div>

            {/* Dialog: Nueva Oferta */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black uppercase text-primary">Publicar Vacante Laboral</DialogTitle>
                        <DialogDescription>Describa los requisitos y condiciones del puesto.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Título del Puesto</Label>
                            <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Ej: Técnico en Mantenimiento Junior" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Modalidad</Label>
                                <Select value={formData.modality} onValueChange={v => setFormData({...formData, modality: v})}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Presencial">Presencial</SelectItem>
                                        <SelectItem value="Remoto">Remoto</SelectItem>
                                        <SelectItem value="Híbrido">Híbrido</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Tipo de Trabajo</Label>
                                <Select value={formData.jobType} onValueChange={v => setFormData({...formData, jobType: v})}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Tiempo Completo">Tiempo Completo</SelectItem>
                                        <SelectItem value="Medio Tiempo">Medio Tiempo</SelectItem>
                                        <SelectItem value="Prácticas">Prácticas</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Ubicación</Label>
                            <Input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="Ciudad o Distrito" />
                        </div>
                        <div className="space-y-2">
                            <Label>Descripción y Requisitos</Label>
                            <Textarea rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleCreateOffer} disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} PUBLICAR AHORA</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog: Candidatos */}
            <Dialog open={!!selectedOffer} onOpenChange={open => !open && setSelectedOffer(null)}>
                <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0">
                    <DialogHeader className="p-6 border-b shrink-0">
                        <DialogTitle className="text-xl uppercase font-black">Postulantes: {selectedOffer?.title}</DialogTitle>
                        <DialogDescription>Revise los perfiles y contacte a los mejores candidatos.</DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-hidden">
                        <ScrollArea className="h-full p-6">
                            {loadingApps ? <Skeleton className="h-20 w-full" /> : applications.length > 0 ? (
                                <div className="space-y-4">
                                    {applications.map(app => (
                                        <div key={app.id} className="p-4 rounded-xl border bg-card flex items-center justify-between gap-4 group">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center font-black text-primary uppercase">{app.studentName[0]}</div>
                                                <div>
                                                    <h4 className="font-bold text-sm uppercase">{app.studentName}</h4>
                                                    <p className="text-[10px] font-mono opacity-60">ID: {app.studentId}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button size="sm" variant="outline" className="font-black text-[10px] h-8" asChild>
                                                    <Link href={`/profile/${app.studentId}`} target="_blank">
                                                        <Eye className="mr-2 h-3.5 w-3.5" /> VER PERFIL VERIFICADO
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center py-12 text-muted-foreground">Aún no hay postulaciones para esta vacante.</p>
                            )}
                        </ScrollArea>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
