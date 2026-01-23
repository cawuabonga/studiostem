
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { getRequestsForUser } from '@/config/firebase';
import type { SupplyRequest } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '../ui/skeleton';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '../ui/tooltip';

const getStatusColor = (status: SupplyRequest['status']) => {
    switch(status) {
        case 'Pendiente': return 'bg-yellow-100 text-yellow-800';
        case 'Aprobado': return 'bg-blue-100 text-blue-800';
        case 'Rechazado': return 'bg-red-100 text-red-800';
        case 'Entregado': return 'bg-green-100 text-green-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

export function MySupplyRequests() {
    const { instituteId, user } = useAuth();
    const { toast } = useToast();
    
    const [requests, setRequests] = useState<SupplyRequest[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!instituteId || !user?.documentId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const fetchedRequests = await getRequestsForUser(instituteId, user.documentId);
            setRequests(fetchedRequests);
        } catch (error) {
            toast({ title: "Error", description: "No se pudieron cargar tus pedidos.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [instituteId, user, toast]);

    useEffect(() => { fetchData() }, [fetchData]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Historial de Solicitudes</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Fecha de Solicitud</TableHead>
                                <TableHead>Insumos Solicitados</TableHead>
                                <TableHead>Estado</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={3}><Skeleton className="h-24 w-full" /></TableCell></TableRow>
                            ) : requests.length > 0 ? (
                                requests.map(req => (
                                    <TableRow key={req.id}>
                                        <TableCell>{format(req.createdAt.toDate(), 'dd/MM/yyyy HH:mm')}</TableCell>
                                        <TableCell>
                                            <ul className="list-disc list-inside">
                                                {req.items.map(item => (
                                                    <li key={item.itemId}>{item.requestedQuantity} x {item.name} ({item.unitOfMeasure})</li>
                                                ))}
                                            </ul>
                                        </TableCell>
                                        <TableCell>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                         <Badge className={cn("text-xs font-semibold", getStatusColor(req.status))}>
                                                            {req.status}
                                                        </Badge>
                                                    </TooltipTrigger>
                                                    {req.rejectionReason && (
                                                        <TooltipContent>
                                                            <p>Motivo: {req.rejectionReason}</p>
                                                        </TooltipContent>
                                                    )}
                                                </Tooltip>
                                            </TooltipProvider>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={3} className="h-24 text-center">No has realizado ninguna solicitud.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
