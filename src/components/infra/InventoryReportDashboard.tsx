
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getAllAssets, getBuildings } from '@/config/firebase';
import type { Asset, Building } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Archive, Building2, CheckCircle, Package, Wrench, XCircle } from 'lucide-react';

const assetTypes = ['Equipamiento Electrónico', 'Mobiliario', 'Material Didáctico', 'Otro'];
const assetStatuses = ['Operativo', 'En Mantenimiento', 'De Baja'];

const StatCard = ({ title, value, icon: Icon, description }: { title: string, value: string | number, icon: React.ElementType, description?: string }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </CardContent>
    </Card>
);

export function InventoryReportDashboard() {
    const { instituteId } = useAuth();
    const { toast } = useToast();
    const [allAssets, setAllAssets] = useState<Asset[]>([]);
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [buildingFilter, setBuildingFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [textFilter, setTextFilter] = useState('');

    const fetchData = useCallback(async () => {
        if (!instituteId) return;
        setLoading(true);
        try {
            const [assetsData, buildingsData] = await Promise.all([
                getAllAssets(instituteId),
                getBuildings(instituteId),
            ]);
            setAllAssets(assetsData);
            setBuildings(buildingsData);
        } catch (error) {
            console.error("Error fetching inventory data:", error);
            toast({ title: "Error", description: "No se pudieron cargar los datos del inventario.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [instituteId, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredAssets = useMemo(() => {
        return allAssets.filter(asset => {
            const matchesBuilding = buildingFilter === 'all' || asset.buildingId === buildingFilter;
            const matchesType = typeFilter === 'all' || asset.type === typeFilter;
            const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;
            const matchesText = textFilter === '' ||
                asset.name.toLowerCase().includes(textFilter.toLowerCase()) ||
                asset.codeOrSerial.toLowerCase().includes(textFilter.toLowerCase());
            
            return matchesBuilding && matchesType && matchesStatus && matchesText;
        });
    }, [allAssets, buildingFilter, typeFilter, statusFilter, textFilter]);

    const stats = useMemo(() => {
        const total = filteredAssets.length;
        const operative = filteredAssets.filter(a => a.status === 'Operativo').length;
        const maintenance = filteredAssets.filter(a => a.status === 'En Mantenimiento').length;
        const decommissioned = filteredAssets.filter(a => a.status === 'De Baja').length;
        return { total, operative, maintenance, decommissioned };
    }, [filteredAssets]);

    if (loading) {
        return <Skeleton className="h-[60vh] w-full" />;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Reporte de Inventario de Activos</CardTitle>
                    <CardDescription>
                        Filtre y visualice todos los activos físicos registrados en el instituto.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <div className="space-y-1.5">
                            <Label htmlFor="text-filter">Búsqueda</Label>
                            <Input id="text-filter" placeholder="Buscar por nombre o código..." value={textFilter} onChange={e => setTextFilter(e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="building-filter">Edificio</Label>
                            <Select value={buildingFilter} onValueChange={setBuildingFilter}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">Todos los Edificios</SelectItem>{buildings.map(b=><SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent></Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="type-filter">Tipo de Activo</Label>
                            <Select value={typeFilter} onValueChange={setTypeFilter}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">Todos los Tipos</SelectItem>{assetTypes.map(t=><SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
                        </div>
                         <div className="space-y-1.5">
                            <Label htmlFor="status-filter">Estado</Label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">Todos los Estados</SelectItem>{assetStatuses.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
                        </div>
                     </div>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total de Activos" value={stats.total} icon={Archive} description="Activos que coinciden con el filtro" />
                <StatCard title="Operativos" value={stats.operative} icon={CheckCircle} description="Activos en buen estado" />
                <StatCard title="En Mantenimiento" value={stats.maintenance} icon={Wrench} description="Activos en reparación" />
                <StatCard title="De Baja" value={stats.decommissioned} icon={XCircle} description="Activos dados de baja" />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-3">
                     <Card>
                        <CardHeader>
                            <CardTitle>Listado de Activos</CardTitle>
                        </CardHeader>
                        <CardContent>
                           <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Activo</TableHead>
                                            <TableHead>Código/Serial</TableHead>
                                            <TableHead>Ubicación</TableHead>
                                            <TableHead>Tipo</TableHead>
                                            <TableHead>Estado</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredAssets.length > 0 ? filteredAssets.map(asset => (
                                            <TableRow key={asset.id}>
                                                <TableCell className="font-medium">{asset.name}</TableCell>
                                                <TableCell>{asset.codeOrSerial}</TableCell>
                                                <TableCell className="text-xs text-muted-foreground">{asset.buildingName} - {asset.environmentName}</TableCell>
                                                <TableCell>{asset.type}</TableCell>
                                                <TableCell>{asset.status}</TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="h-24 text-center">No se encontraron activos con los filtros seleccionados.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                           </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
