
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getAllAssets, getBuildings, bulkUpdateAssetsStatus, moveAssets, getEnvironmentsForBuilding } from '@/config/firebase';
import type { Asset, Building, Environment } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Archive, Building2, CheckCircle, Package, Wrench, XCircle, Trash2, Move, Printer } from 'lucide-react';
import { AssetCharts } from './AssetCharts';
import { Checkbox } from '../ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { MoveAssetsDialog } from './MoveAssetsDialog';
import { PrintInventoryList } from './PrintInventoryList';

const assetTypes = ['Equipamiento Electrónico', 'Mobiliario', 'Material Didáctico', 'Otro'];
const assetStatuses = ['Operativo', 'En Mantenimiento', 'De Baja'] as const;
type AssetStatus = typeof assetStatuses[number];


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
    const { instituteId, institute } = useAuth();
    const { toast } = useToast();
    const [allAssets, setAllAssets] = useState<Asset[]>([]);
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [environments, setEnvironments] = useState<Environment[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingEnvironments, setLoadingEnvironments] = useState(false);
    const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());

    // Filters
    const [buildingFilter, setBuildingFilter] = useState('all');
    const [environmentFilter, setEnvironmentFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [textFilter, setTextFilter] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);


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
            setSelectedAssetIds(new Set()); // Reset selection on fetch
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

    useEffect(() => {
        if (buildingFilter !== 'all' && instituteId) {
            setLoadingEnvironments(true);
            getEnvironmentsForBuilding(instituteId, buildingFilter)
                .then(setEnvironments)
                .catch(console.error)
                .finally(() => setLoadingEnvironments(false));
        } else {
            setEnvironments([]);
        }
        setEnvironmentFilter('all'); // Reset environment filter when building changes
    }, [buildingFilter, instituteId]);

    const filteredAssets = useMemo(() => {
        return allAssets.filter(asset => {
            const matchesBuilding = buildingFilter === 'all' || asset.buildingId === buildingFilter;
            const matchesEnvironment = environmentFilter === 'all' || asset.environmentId === environmentFilter;
            const matchesType = typeFilter === 'all' || asset.type === typeFilter;
            const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;
            const matchesText = textFilter === '' ||
                asset.name.toLowerCase().includes(textFilter.toLowerCase()) ||
                asset.codeOrSerial.toLowerCase().includes(textFilter.toLowerCase());
            
            return matchesBuilding && matchesEnvironment && matchesType && matchesStatus && matchesText;
        });
    }, [allAssets, buildingFilter, environmentFilter, typeFilter, statusFilter, textFilter]);

    const handlePrint = () => {
        const printContent = document.getElementById('print-area')?.innerHTML;
        const styles = Array.from(document.styleSheets)
            .map(s => s.href ? `<link rel="stylesheet" href="${s.href}">` : '')
            .join('');

        const printWindow = window.open('', '_blank');
        if (printWindow && printContent) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Reporte de Inventario</title>
                        ${styles}
                         <style>
                            @media print {
                                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                                .no-print { display: none !important; }
                                .page-break { page-break-after: always; }
                            }
                        </style>
                    </head>
                    <body>${printContent}</body>
                </html>
            `);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 500);
        }
    };

    const chartData = useMemo(() => {
        const byType = filteredAssets.reduce((acc, asset) => {
            acc[asset.type] = (acc[asset.type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const byStatus = filteredAssets.reduce((acc, asset) => {
            acc[asset.status] = (acc[asset.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            byType: Object.entries(byType).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value),
            byStatus: Object.entries(byStatus).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value),
        };
    }, [filteredAssets]);

    const stats = useMemo(() => {
        const total = chartData.byType.reduce((acc, item) => acc + item.value, 0);
        return { 
            total, 
            operative: chartData.byStatus.find(s => s.name === 'Operativo')?.value || 0,
            maintenance: chartData.byStatus.find(s => s.name === 'En Mantenimiento')?.value || 0,
            decommissioned: chartData.byStatus.find(s => s.name === 'De Baja')?.value || 0,
        };
    }, [chartData]);
    
    const handleSelectAll = (checked: boolean | string) => {
        if (checked) {
            setSelectedAssetIds(new Set(filteredAssets.map(a => a.id)));
        } else {
            setSelectedAssetIds(new Set());
        }
    };
    
    const handleSelectOne = (assetId: string) => {
        const newSet = new Set(selectedAssetIds);
        if (newSet.has(assetId)) {
            newSet.delete(assetId);
        } else {
            newSet.add(assetId);
        }
        setSelectedAssetIds(newSet);
    };

    const handleBulkStatusChange = async (newStatus: AssetStatus) => {
        if (!instituteId || selectedAssetIds.size === 0) return;
        setIsSubmitting(true);
        try {
            const assetsToUpdate = Array.from(selectedAssetIds).map(id => allAssets.find(a => a.id === id)).filter(Boolean) as Asset[];
            await bulkUpdateAssetsStatus(instituteId, assetsToUpdate, newStatus);
            toast({
                title: "Actualización Exitosa",
                description: `${selectedAssetIds.size} activos actualizados a "${newStatus}".`,
            });
            fetchData(); // Refreshes data and clears selection
        } catch (error) {
             toast({ title: "Error", description: "No se pudieron actualizar los activos.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    }
    
    const handleMoveAssets = async (targetEnvironment: Environment) => {
        if (!instituteId || selectedAssetIds.size === 0) return;
        setIsSubmitting(true);
        try {
            const assetsToMove = Array.from(selectedAssetIds).map(id => allAssets.find(a => a.id === id)).filter(Boolean) as Asset[];
            await moveAssets(instituteId, assetsToMove, targetEnvironment);
            toast({
                title: "Movimiento Exitoso",
                description: `${assetsToMove.length} activos movidos a "${targetEnvironment.name}".`
            });
            fetchData();
        } catch (error) {
            toast({ title: "Error al Mover", description: "No se pudieron mover los activos.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
            setIsMoveDialogOpen(false);
        }
    }


    if (loading) {
        return <Skeleton className="h-[60vh] w-full" />;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Gestor y Reporte de Inventario</CardTitle>
                    <CardDescription>
                        Filtre y visualice todos los activos físicos registrados en el instituto.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                        <div className="space-y-1.5">
                            <Label htmlFor="text-filter">Búsqueda</Label>
                            <Input id="text-filter" placeholder="Buscar por nombre o código..." value={textFilter} onChange={e => setTextFilter(e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="building-filter">Edificio</Label>
                            <Select value={buildingFilter} onValueChange={setBuildingFilter}><SelectTrigger id="building-filter"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">Todos los Edificios</SelectItem>{buildings.map(b=><SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent></Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="environment-filter">Ambiente</Label>
                            <Select value={environmentFilter} onValueChange={setEnvironmentFilter} disabled={buildingFilter === 'all' || loadingEnvironments}>
                                <SelectTrigger id="environment-filter"><SelectValue placeholder={loadingEnvironments ? "Cargando..." : "Todos los Ambientes"} /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los Ambientes</SelectItem>
                                    {environments.map(e=><SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="type-filter">Tipo de Activo</Label>
                            <Select value={typeFilter} onValueChange={setTypeFilter}><SelectTrigger id="type-filter"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">Todos los Tipos</SelectItem>{assetTypes.map(t=><SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
                        </div>
                         <div className="space-y-1.5">
                            <Label htmlFor="status-filter">Estado</Label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger id="status-filter"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">Todos los Estados</SelectItem>{assetStatuses.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
                        </div>
                     </div>
                      <div className="flex justify-end mt-4">
                        <Button onClick={handlePrint} variant="outline">
                            <Printer className="mr-2 h-4 w-4" />
                            Imprimir Vista Actual
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total de Activos" value={stats.total} icon={Archive} description="Activos que coinciden con el filtro" />
                <StatCard title="Operativos" value={stats.operative} icon={CheckCircle} description="Activos en buen estado" />
                <StatCard title="En Mantenimiento" value={stats.maintenance} icon={Wrench} description="Activos en reparación" />
                <StatCard title="De Baja" value={stats.decommissioned} icon={XCircle} description="Activos dados de baja" />
            </div>
            
            <AssetCharts data={chartData} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-3">
                     <Card>
                        <CardHeader>
                           <div className="flex items-center justify-between">
                             <CardTitle>Listado de Activos</CardTitle>
                             {selectedAssetIds.size > 0 && (
                                <div className="flex items-center gap-2 bg-muted p-2 rounded-lg">
                                    <p className="text-sm font-medium">{selectedAssetIds.size} seleccionado(s)</p>
                                    <Button variant="outline" size="sm" onClick={() => setIsMoveDialogOpen(true)}>
                                        <Move className="mr-2 h-4 w-4" />
                                        Mover
                                    </Button>
                                    <Select onValueChange={(value) => handleBulkStatusChange(value as AssetStatus)}>
                                        <SelectTrigger className="w-[200px]">
                                            <SelectValue placeholder="Cambiar estado..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {assetStatuses.map(status => (
                                                <SelectItem key={status} value={status}>Marcar como {status}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                             )}
                           </div>
                        </CardHeader>
                        <CardContent>
                           <div className="rounded-md border overflow-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[50px]">
                                                <Checkbox
                                                    checked={selectedAssetIds.size === filteredAssets.length && filteredAssets.length > 0}
                                                    onCheckedChange={handleSelectAll}
                                                />
                                            </TableHead>
                                            <TableHead className="w-[40px]">N°</TableHead>
                                            <TableHead>Activo</TableHead>
                                            <TableHead>Código/Serial</TableHead>
                                            <TableHead>Ubicación</TableHead>
                                            <TableHead>Tipo</TableHead>
                                            <TableHead>Estado</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredAssets.length > 0 ? filteredAssets.map((asset, index) => (
                                            <TableRow key={asset.id} data-state={selectedAssetIds.has(asset.id) && "selected"}>
                                                <TableCell><Checkbox checked={selectedAssetIds.has(asset.id)} onCheckedChange={() => handleSelectOne(asset.id)} /></TableCell>
                                                <TableCell className="text-center text-muted-foreground">{index + 1}</TableCell>
                                                <TableCell className="font-medium">{asset.name}</TableCell>
                                                <TableCell>{asset.codeOrSerial}</TableCell>
                                                <TableCell className="text-xs text-muted-foreground">{asset.buildingName} - {asset.environmentName}</TableCell>
                                                <TableCell>{asset.type}</TableCell>
                                                <TableCell>{asset.status}</TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={7} className="h-24 text-center">No se encontraron activos con los filtros seleccionados.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                           </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
             <MoveAssetsDialog 
                isOpen={isMoveDialogOpen}
                onClose={() => setIsMoveDialogOpen(false)}
                onConfirm={handleMoveAssets}
                buildings={buildings}
                instituteId={instituteId!}
                isSubmitting={isSubmitting}
                assetCount={selectedAssetIds.size}
            />
            <div id="print-area" className="hidden">
                 <PrintInventoryList 
                    assets={filteredAssets} 
                    institute={institute}
                    filters={{buildingFilter, environmentFilter, typeFilter, statusFilter, textFilter}}
                    buildings={buildings}
                    allEnvironments={environments}
                 />
            </div>
        </div>
    );
}
