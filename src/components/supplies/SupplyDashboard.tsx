"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getSupplyRequestsByStatus, getSupplyCatalog } from '@/config/firebase';
import type { SupplyRequest, SupplyItem, StaffProfile } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FileClock, Truck, AlertTriangle, Archive, UserCircle, PackageCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '../ui/button';
import Link from 'next/link';

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

const LOW_STOCK_THRESHOLD = 10;

export function SupplyDashboard() {
    const { instituteId } = useAuth();
    const { toast } = useToast();
    
    const [requests, setRequests] = useState<SupplyRequest[]>([]);
    const [catalog, setCatalog] = useState<SupplyItem[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!instituteId) return;
        setLoading(true);
        try {
            const [
                pending, 
                approved, 
                catalogData
            ] = await Promise.all([
                getSupplyRequestsByStatus(instituteId, 'Pendiente'),
                getSupplyRequestsByStatus(instituteId, 'Aprobado'),
                getSupplyCatalog(instituteId),
            ]);
            setRequests([...pending, ...approved]);
            setCatalog(catalogData);
        } catch (error) {
            toast({ title: "Error", description: "No se pudieron cargar los datos del dashboard.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [instituteId, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const stats = useMemo(() => {
        const pendingCount = requests.filter(r => r.status === 'Pendiente').length;
        const approvedCount = requests.filter(r => r.status === 'Aprobado').length;
        const lowStockItems = catalog.filter(item => item.stock <= LOW_STOCK_THRESHOLD).length;
        const totalItems = catalog.length;

        return { pendingCount, approvedCount, lowStockItems, totalItems };
    }, [requests, catalog]);
    
    const recentRequests = useMemo(() => {
        return requests
            .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
            .slice(0, 5);
    }, [requests]);

    const lowStockItemsList = useMemo(() => {
        return catalog
            .filter(item => item.stock <= LOW_STOCK_THRESHOLD)
            .sort((a,b) => a.stock - b.stock);
    }, [catalog]);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Skeleton className="h-28 w-full" />
                    <Skeleton className="h-28 w-full" />
                    <Skeleton className="h-28 w-full" />
                    <Skeleton className="h-28 w-full" />
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Pedidos Pendientes" value={stats.pendingCount} icon={FileClock} description="Solicitudes esperando aprobación." />
                <StatCard title="Pedidos Aprobados" value={stats.approvedCount} icon={Truck} description="Listos para ser entregados." />
                <StatCard title="Alertas de Stock Bajo" value={stats.lowStockItems} icon={AlertTriangle} description={`Insumos con ${LOW_STOCK_THRESHOLD} o menos unidades.`} />
                <StatCard title="Insumos en Catálogo" value={stats.totalItems} icon={Archive} description="Total de tipos de insumos." />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <Card>
                    <CardHeader>
                        <CardTitle>Actividad Reciente</CardTitle>
                        <CardDescription>Últimas 5 solicitudes recibidas.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {recentRequests.length > 0 ? recentRequests.map(req => (
                            <div key={req.id} className="flex items-center gap-4">
                                <Avatar>
                                    {/* We don't have user photos easily available here, so we use a fallback */}
                                    <AvatarFallback><UserCircle className="h-5 w-5"/></AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <p className="font-medium text-sm">{req.requesterName}</p>
                                    <p className="text-xs text-muted-foreground">
                                        Solicitó {req.items.reduce((acc, item) => acc + item.requestedQuantity, 0)} insumos
                                    </p>
                                </div>
                                <div className="text-right">
                                    <Badge variant={req.status === 'Pendiente' ? 'destructive' : 'default'}>{req.status}</Badge>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {formatDistanceToNow(req.createdAt.toDate(), { addSuffix: true, locale: es })}
                                    </p>
                                </div>
                            </div>
                        )) : (
                            <p className="text-center py-8 text-muted-foreground">No hay actividad reciente.</p>
                        )}
                         <Button asChild variant="outline" className="w-full mt-4">
                            <Link href="/dashboard/gestion-administrativa/abastecimiento/pedidos">
                                Ver todos los pedidos
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Alertas de Stock Bajo</CardTitle>
                        <CardDescription>Insumos que necesitan reabastecimiento.</CardDescription>
                    </CardHeader>
                     <CardContent className="space-y-4">
                        {lowStockItemsList.length > 0 ? lowStockItemsList.map(item => (
                            <div key={item.id} className="flex items-center gap-4">
                                <div className="p-2 bg-muted rounded-full">
                                    <PackageCheck className="h-5 w-5 text-muted-foreground"/>
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-sm">{item.name}</p>
                                    <p className="text-xs text-muted-foreground">{item.unitOfMeasure}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-lg text-destructive">{item.stock}</p>
                                </div>
                            </div>
                        )) : (
                            <p className="text-center py-8 text-muted-foreground">¡Todo el stock está en orden!</p>
                        )}
                         <Button asChild variant="outline" className="w-full mt-4">
                            <Link href="/dashboard/gestion-administrativa/abastecimiento/stock">
                                Gestionar Stock
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
