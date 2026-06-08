
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getCompanyProfiles, addCompanyProfile, updateCompanyProfile, deleteCompanyProfile } from '@/config/firebase';
import type { CompanyProfile } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Building, Trash2, Globe, Mail, Phone, Loader2, Search, MapPin, Calendar, User, Edit, Clock, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
import Image from 'next/image';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';

export default function ManageCompaniesPage() {
    const { instituteId } = useAuth();
    const { toast } = useToast();
    const [companies, setCompanies] = useState<CompanyProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [filter, setFilter] = useState('');
    const [editingCompany, setEditingCompany] = useState<CompanyProfile | null>(null);

    const [formData, setFormData] = useState({
        documentId: '',
        name: '',
        industry: '',
        contactEmail: '',
        contactPhone: '',
        website: '',
        address: '',
        representativeName: '',
        agreementStartDate: '',
        agreementEndDate: '',
    });
    
    const [logoFile, setLogoFile] = useState<File | null>(null);

    const fetchData = useCallback(async () => {
        if (!instituteId) return;
        setLoading(true);
        try {
            const data = await getCompanyProfiles(instituteId);
            setCompanies(data);
        } catch (error) {
            toast({ title: "Error", description: "No se pudieron cargar las empresas.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [instituteId, toast]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleOpenDialog = (company?: CompanyProfile) => {
        if (company) {
            setEditingCompany(company);
            setFormData({
                documentId: company.documentId,
                name: company.name,
                industry: company.industry,
                contactEmail: company.contactEmail,
                contactPhone: company.contactPhone || '',
                website: company.website || '',
                address: company.address || '',
                representativeName: company.representativeName || '',
                agreementStartDate: company.agreementStartDate ? company.agreementStartDate.toDate().toISOString().split('T')[0] : '',
                agreementEndDate: company.agreementEndDate ? company.agreementEndDate.toDate().toISOString().split('T')[0] : '',
            });
        } else {
            setEditingCompany(null);
            setFormData({
                documentId: '',
                name: '',
                industry: '',
                contactEmail: '',
                contactPhone: '',
                website: '',
                address: '',
                representativeName: '',
                agreementStartDate: '',
                agreementEndDate: '',
            });
        }
        setLogoFile(null);
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!instituteId || !formData.documentId || !formData.name || !formData.contactEmail) {
            toast({ title: "Atención", description: "Complete los campos obligatorios.", variant: "destructive" });
            return;
        }
        setIsSubmitting(true);
        try {
            const dataToSave = {
                ...formData,
                agreementStartDate: formData.agreementStartDate ? Timestamp.fromDate(new Date(formData.agreementStartDate)) : undefined,
                agreementEndDate: formData.agreementEndDate ? Timestamp.fromDate(new Date(formData.agreementEndDate)) : undefined,
                role: 'Company' as const,
                roleId: 'company',
                instituteId
            };

            if (editingCompany) {
                await updateCompanyProfile(instituteId, editingCompany.documentId, dataToSave, logoFile || undefined);
                toast({ title: "Empresa Actualizada" });
            } else {
                await addCompanyProfile(instituteId, dataToSave, logoFile || undefined);
                toast({ title: "Empresa Registrada" });
            }
            
            setIsDialogOpen(false);
            fetchData();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (ruc: string) => {
        if (!instituteId) return;
        try {
            await deleteCompanyProfile(instituteId, ruc);
            toast({ title: "Empresa Eliminada" });
            fetchData();
        } catch (error) {
            toast({ title: "Error al eliminar", variant: "destructive" });
        }
    };

    const getDaysRemaining = (endDate?: Timestamp) => {
        if (!endDate) return null;
        const diff = differenceInDays(endDate.toDate(), new Date());
        return diff;
    };

    const filtered = companies.filter(c => 
        c.name.toLowerCase().includes(filter.toLowerCase()) || 
        c.documentId.includes(filter)
    );

    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Card className="bg-primary text-primary-foreground border-none shadow-xl overflow-hidden relative rounded-3xl">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Building className="h-32 w-32" />
                </div>
                <CardHeader className="relative z-10 p-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                                <Building className="h-8 w-8 text-accent" />
                            </div>
                            <div>
                                <CardTitle className="text-3xl font-black tracking-tighter uppercase">Socios Estratégicos</CardTitle>
                                <CardDescription className="text-primary-foreground/80 text-lg font-medium">Gestión integral de convenios y alianzas de bolsa laboral.</CardDescription>
                            </div>
                        </div>
                        <Button variant="secondary" onClick={() => handleOpenDialog()} className="font-bold h-12 px-8 shadow-lg">
                            <PlusCircle className="mr-2 h-5 w-5" /> REGISTRAR EMPRESA
                        </Button>
                    </div>
                </CardHeader>
            </Card>

            <div className="flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input placeholder="Buscar por RUC o Razón Social..." value={filter} onChange={e => setFilter(e.target.value)} className="pl-11 h-12 rounded-xl shadow-sm" />
                </div>
            </div>

            {loading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Skeleton className="h-80 w-full rounded-3xl" />
                    <Skeleton className="h-80 w-full rounded-3xl" />
                    <Skeleton className="h-80 w-full rounded-3xl" />
                </div>
            ) : filtered.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filtered.map(company => {
                        const daysLeft = getDaysRemaining(company.agreementEndDate);
                        const isExpired = daysLeft !== null && daysLeft < 0;
                        const isExpiringSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 30;

                        return (
                            <Card key={company.documentId} className="group hover:border-primary/40 hover:shadow-2xl transition-all duration-500 rounded-3xl overflow-hidden flex flex-col border-none shadow-lg">
                                <CardHeader className="relative pb-0">
                                    <div className="flex justify-between items-start">
                                        <div className="h-16 w-16 relative rounded-2xl overflow-hidden border bg-white shadow-inner">
                                            <Image 
                                                src={company.logoUrl || `https://placehold.co/200x200.png?text=${company.name[0]}`} 
                                                alt={company.name} 
                                                fill 
                                                className="object-contain p-2"
                                            />
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <Badge variant={company.linkedUserUid ? 'default' : 'secondary'} className="text-[10px] font-black uppercase">
                                                {company.linkedUserUid ? 'Vinculada' : 'Pendiente'}
                                            </Badge>
                                            {daysLeft !== null && (
                                                <Badge className={cn(
                                                    "text-[10px] font-black uppercase",
                                                    isExpired ? "bg-red-100 text-red-700" : isExpiringSoon ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                                                )}>
                                                    {isExpired ? 'Convenio Vencido' : `${daysLeft} días restantes`}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <CardTitle className="text-xl font-black uppercase tracking-tight line-clamp-1">{company.name}</CardTitle>
                                        <CardDescription className="text-xs font-bold text-primary flex items-center gap-1 mt-1">
                                            <Building className="h-3 w-3" /> {company.industry} • RUC: {company.documentId}
                                        </CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-grow space-y-4 pt-6">
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/50 border border-muted transition-colors group-hover:bg-background">
                                            <MapPin className="h-4 w-4 text-primary shrink-0" />
                                            <span className="text-xs font-medium line-clamp-1">{company.address || 'Ubicación no especificada'}</span>
                                        </div>
                                        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/50 border border-muted transition-colors group-hover:bg-background">
                                            <User className="h-4 w-4 text-primary shrink-0" />
                                            <span className="text-xs font-medium line-clamp-1">{company.representativeName || 'Sin representante'}</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="p-3 rounded-2xl bg-muted/30 border border-dashed text-center">
                                            <p className="text-[9px] font-black uppercase text-muted-foreground mb-1">Inicio Convenio</p>
                                            <p className="text-[11px] font-bold">{company.agreementStartDate ? format(company.agreementStartDate.toDate(), 'dd/MM/yyyy') : '---'}</p>
                                        </div>
                                        <div className="p-3 rounded-2xl bg-muted/30 border border-dashed text-center">
                                            <p className="text-[9px] font-black uppercase text-muted-foreground mb-1">Fin Convenio</p>
                                            <p className="text-[11px] font-bold">{company.agreementEndDate ? format(company.agreementEndDate.toDate(), 'dd/MM/yyyy') : '---'}</p>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="border-t p-4 flex gap-2">
                                    <Button variant="ghost" className="flex-1 font-bold h-10 rounded-xl" onClick={() => handleOpenDialog(company)}>
                                        <Edit className="h-4 w-4 mr-2" /> Editar
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive hover:bg-destructive/10 rounded-xl">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>¿Eliminar aliado estratégico?</AlertDialogTitle>
                                                <AlertDialogDescription>Esta acción es permanente y eliminará todas las vacantes publicadas por {company.name}.</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(company.documentId)} className="bg-destructive hover:bg-destructive/90">Eliminar Permanente</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </CardFooter>
                            </Card>
                        )
                    })}
                </div>
            ) : (
                <div className="py-24 text-center text-muted-foreground bg-muted/20 rounded-3xl border-2 border-dashed">
                    <Building className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <p className="text-xl font-bold uppercase tracking-widest">Sin empresas registradas</p>
                    <p className="mt-2">Comience añadiendo a sus primeros socios estratégicos.</p>
                </div>
            )}

            {/* Dialog: Registro / Edición */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl p-0">
                    <DialogHeader className="p-8 bg-primary text-primary-foreground">
                        <DialogTitle className="text-2xl font-black uppercase tracking-tight">
                            {editingCompany ? 'Editar Perfil de Socio' : 'Nuevo Socio Estratégico'}
                        </DialogTitle>
                        <DialogDescription className="text-primary-foreground/80">Gestión de datos corporativos y vigencia de convenios.</DialogDescription>
                    </DialogHeader>
                    
                    <div className="p-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Logo Upload Section */}
                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Logo Institucional</Label>
                                <div className="flex flex-col items-center gap-4 p-6 bg-muted/30 rounded-3xl border-2 border-dashed">
                                    {(logoFile || (editingCompany && editingCompany.logoUrl)) ? (
                                        <div className="h-32 w-32 relative rounded-2xl overflow-hidden border bg-white shadow-xl">
                                            <Image 
                                                src={logoFile ? URL.createObjectURL(logoFile) : (editingCompany?.logoUrl || '')} 
                                                alt="Preview" 
                                                fill 
                                                className="object-contain p-2" 
                                            />
                                        </div>
                                    ) : (
                                        <div className="h-32 w-32 rounded-2xl bg-muted flex items-center justify-center">
                                            <Building className="h-12 w-12 text-muted-foreground opacity-20" />
                                        </div>
                                    )}
                                    <Input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={e => setLogoFile(e.target.files?.[0] || null)} 
                                        className="h-10 text-xs bg-background"
                                    />
                                </div>
                            </div>

                            {/* Main Info */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>RUC de la Empresa</Label>
                                    <Input value={formData.documentId} onChange={e => setFormData({...formData, documentId: e.target.value})} placeholder="20XXXXXXXXX" disabled={!!editingCompany} className="h-11" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Razón Social / Nombre Comercial</Label>
                                    <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="h-11 font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Sector / Rubro</Label>
                                    <Input value={formData.industry} onChange={e => setFormData({...formData, industry: e.target.value})} placeholder="Ej: Minería, TI, Salud..." className="h-11" />
                                </div>
                            </div>
                        </div>

                        <Separator />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Datos de Contacto</h4>
                                <div className="space-y-4">
                                    <div className="space-y-2"><Label>Representante Legal / RR.HH.</Label><div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input value={formData.representativeName} onChange={e => setFormData({...formData, representativeName: e.target.value})} className="pl-10 h-11" /></div></div>
                                    <div className="space-y-2"><Label>Email Oficial</Label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input type="email" value={formData.contactEmail} onChange={e => setFormData({...formData, contactEmail: e.target.value})} className="pl-10 h-11" /></div></div>
                                    <div className="space-y-2"><Label>Teléfono / Celular</Label><div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input value={formData.contactPhone} onChange={e => setFormData({...formData, contactPhone: e.target.value})} className="pl-10 h-11" /></div></div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Vigencia del Convenio</h4>
                                <div className="space-y-4">
                                    <div className="space-y-2"><Label>Dirección / Sede</Label><div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="pl-10 h-11" /></div></div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2"><Label>Fecha Inicio</Label><Input type="date" value={formData.agreementStartDate} onChange={e => setFormData({...formData, agreementStartDate: e.target.value})} className="h-11" /></div>
                                        <div className="space-y-2"><Label>Fecha Fin</Label><Input type="date" value={formData.agreementEndDate} onChange={e => setFormData({...formData, agreementEndDate: e.target.value})} className="h-11" /></div>
                                    </div>
                                    <div className="space-y-2"><Label>Sitio Web</Label><div className="relative"><Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input placeholder="https://..." value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} className="pl-10 h-11" /></div></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-8 bg-muted/20 border-t">
                        <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="font-bold h-12 px-8">Cancelar</Button>
                        <Button onClick={handleSave} disabled={isSubmitting} className="font-black h-12 px-12 shadow-xl">
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editingCompany ? 'GUARDAR CAMBIOS' : 'REGISTRAR SOCIO'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
