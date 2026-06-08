
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getCompanyProfiles, addCompanyProfile, deleteCompanyProfile } from '@/config/firebase';
import type { CompanyProfile } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Building, Trash2, Globe, Mail, Phone, Loader2, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

export default function ManageCompaniesPage() {
    const { instituteId } = useAuth();
    const { toast } = useToast();
    const [companies, setCompanies] = useState<CompanyProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [filter, setFilter] = useState('');

    const [formData, setFormData] = useState({
        documentId: '',
        name: '',
        industry: '',
        contactEmail: '',
        contactPhone: '',
        website: ''
    });

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

    const handleSave = async () => {
        if (!instituteId || !formData.documentId || !formData.name || !formData.contactEmail) {
            toast({ title: "Atención", description: "Complete los campos obligatorios.", variant: "destructive" });
            return;
        }
        setIsSubmitting(true);
        try {
            await addCompanyProfile(instituteId, {
                ...formData,
                role: 'Company',
                roleId: 'company'
            });
            toast({ title: "Empresa Registrada", description: "El perfil aliado ha sido creado." });
            setIsDialogOpen(false);
            setFormData({ documentId: '', name: '', industry: '', contactEmail: '', contactPhone: '', website: '' });
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

    const filtered = companies.filter(c => 
        c.name.toLowerCase().includes(filter.toLowerCase()) || 
        c.documentId.includes(filter)
    );

    return (
        <div className="space-y-6">
            <Card className="bg-primary text-primary-foreground">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <Building className="h-8 w-8" />
                            <div>
                                <CardTitle className="text-2xl font-black uppercase">Gestión de Empresas Aliadas</CardTitle>
                                <CardDescription className="text-primary-foreground/80">Registre los socios estratégicos que publicarán ofertas en la bolsa laboral.</CardDescription>
                            </div>
                        </div>
                        <Button variant="secondary" onClick={() => setIsDialogOpen(true)} className="font-bold">
                            <PlusCircle className="mr-2 h-4 w-4" /> Registrar Empresa
                        </Button>
                    </div>
                </CardHeader>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Buscar por RUC o Razón Social..." value={filter} onChange={e => setFilter(e.target.value)} className="pl-9" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>RUC</TableHead>
                                        <TableHead>Empresa / Sector</TableHead>
                                        <TableHead>Contacto</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead className="text-right">Acción</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filtered.map(company => (
                                        <TableRow key={company.documentId}>
                                            <TableCell className="font-mono text-xs">{company.documentId}</TableCell>
                                            <TableCell>
                                                <p className="font-bold uppercase text-sm">{company.name}</p>
                                                <p className="text-xs text-muted-foreground">{company.industry}</p>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1 text-xs">
                                                    <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {company.contactEmail}</span>
                                                    {company.website && <span className="flex items-center gap-1 text-primary"><Globe className="h-3 w-3" /> {company.website}</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={company.linkedUserUid ? 'default' : 'secondary'}>
                                                    {company.linkedUserUid ? 'Vinculada' : 'Pendiente'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(company.documentId)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Nueva Empresa Aliada</DialogTitle>
                        <DialogDescription>Los datos de contacto se usarán para que la empresa reclame su cuenta.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>RUC</Label><Input value={formData.documentId} onChange={e => setFormData({...formData, documentId: e.target.value})} placeholder="20XXXXXXXXX" /></div>
                            <div className="space-y-2"><Label>Nombre Comercial / Razón Social</Label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                        </div>
                        <div className="space-y-2"><Label>Rubro / Sector</Label><Input value={formData.industry} onChange={e => setFormData({...formData, industry: e.target.value})} placeholder="Ej: Tecnología, Salud..." /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>Email de Contacto</Label><Input type="email" value={formData.contactEmail} onChange={e => setFormData({...formData, contactEmail: e.target.value})} /></div>
                            <div className="space-y-2"><Label>Teléfono</Label><Input value={formData.contactPhone} onChange={e => setFormData({...formData, contactPhone: e.target.value})} /></div>
                        </div>
                        <div className="space-y-2"><Label>Sitio Web (Opcional)</Label><Input value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} placeholder="https://..." /></div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Registrar Socio</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
