
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { Delivery } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { getDeliveries } from '@/config/firebase';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Info } from 'lucide-react';
import { Badge } from '../ui/badge';

export function AdminDeliveriesList() {
    const { instituteId } = useAuth();
    const { toast } = useToast();
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!instituteId) return;
        setLoading(true);
        try {
            const fetchedDeliveries = await getDeliveries(instituteId);
            setDeliveries(fetchedDeliveries);
        } catch (error) {
            toast({ title: "Error", description: "No se pudieron cargar las entregas.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [instituteId, toast]);

    useEffect(() => { fetchData() }, [fetchData]);
    
    if (loading) {
        return <Skeleton className="h-48 w-full" />;
    }

    if (deliveries.length === 0) {
        return (
            <div className="text-center p-10 text-muted-foreground">
                <Info className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium">No hay entregas</h3>
                <p className="mt-1 text-sm">No se han registrado entregas de insumos todavía.</p>
            </div>
        );
    }
    
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Receptor</TableHead>
                        <TableHead>Insumos Entregados</TableHead>
                        <TableHead>Origen</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {deliveries.map(delivery => (
                        <TableRow key={delivery.id}>
                            <TableCell className="font-mono">{delivery.code}</TableCell>
                            <TableCell className="text-xs">{format(delivery.deliveryDate.toDate(), 'dd/MM/yy HH:mm')}</TableCell>
                            <TableCell>{delivery.recipientName}</TableCell>
                            <TableCell>
                                <ul className="list-disc list-inside text-xs">
                                    {delivery.items.map(item => (
                                        <li key={item.itemId}>{item.quantity} x {item.name}</li>
                                    ))}
                                </ul>
                            </TableCell>
                            <TableCell>
                                {delivery.originRequestId ? 
                                    <Badge variant="secondary">Pedido</Badge> : 
                                    <Badge variant="outline">Directa</Badge>
                                }
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
