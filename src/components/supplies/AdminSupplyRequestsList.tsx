"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { SupplyRequest, SupplyRequestStatus } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { getSupplyRequestsByStatus, updateSupplyRequestStatus } from '@/config/firebase';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Check, X, Truck, Info, Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface AdminSupplyRequestsListProps {
    status: SupplyRequestStatus;
}

export function AdminSupplyRequestsList({ status }: AdminSupplyRequestsListProps) {
    const { instituteId } = useAuth();
    const { toast } = useToast();
    const [requests, setRequests] = useState<SupplyRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null); // track loading for a specific request
    const [rejectionReason, setRejectionReason] = useState('');

    const fetchData = useCallback(async () => {
        if (!instituteId) return;
        setLoading(true);
        try {
            const fetchedRequests = await getSupplyRequestsByStatus(instituteId, status);
            setRequests(fetchedRequests);
        } catch (error) {
            toast({ title: "Error", description: "No se pudieron cargar los pedidos.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [instituteId, status, toast]);

    useEffect(() => { fetchData() }, [fetchData]);

    const handleUpdateStatus = async (requestId: string, newStatus: SupplyRequestStatus, extraData?: any) => {
        if (!instituteId) return;
        setActionLoading(requestId);
        try {
            await updateSupplyRequestStatus(instituteId, requestId, newStatus, extraData);
            toast({ title: "Estado Actualizado", description: "El estado del pedido ha sido actualizado." });
            fetchData(); // Refresh the list
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setActionLoading(null);
            setRejectionReason('');
        }
    };
    
    if (loading) {
        return <Skeleton className="h-48 w-full" />;
    }

    if (requests.length === 0) {
        return (
            <div className="text-center p-10 text-muted-foreground">
                <Info className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium">No hay pedidos</h3>
                <p className="mt-1 text-sm">No se encontraron pedidos con el estado "{status}".</p>
            </div>
        );
    }
    
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Solicitante</TableHead>
                        <TableHead>Insumos</TableHead>
                        {status === 'Rechazado' && <TableHead>Motivo</TableHead>}
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {requests.map(req => (
                        <TableRow key={req.id}>
                            <TableCell className="text-xs">{format(req.createdAt.toDate(), 'dd/MM/yy HH:mm')}</TableCell>
                            <TableCell>{req.requesterName}</TableCell>
                            <TableCell>
                                <ul className="list-disc list-inside">
                                    {req.items.map(item => (
                                        <li key={item.itemId}>{item.quantity} x {item.name}</li>
                                    ))}
                                </ul>
                            </TableCell>
                             {status === 'Rechazado' && <TableCell className="text-xs text-destructive">{req.rejectionReason}</TableCell>}
                            <TableCell className="text-right">
                                {actionLoading === req.id ? <Loader2 className="animate-spin" /> : (
                                    <div className="space-x-2">
                                        {status === 'Pendiente' && (
                                            <>
                                                <Button size="sm" variant="outline" className="text-green-600" onClick={() => handleUpdateStatus(req.id, 'Aprobado')}>
                                                    <Check className="mr-2 h-4 w-4"/> Aprobar
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button size="sm" variant="destructive"><X className="mr-2 h-4 w-4"/> Rechazar</Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Rechazar Pedido</AlertDialogTitle>
                                                            <AlertDialogDescription>Por favor, ingrese el motivo del rechazo.</AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <div className="py-4">
                                                            <Label htmlFor="reason">Motivo</Label>
                                                            <Input id="reason" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} />
                                                        </div>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleUpdateStatus(req.id, 'Rechazado', { rejectionReason })}>Confirmar Rechazo</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </>
                                        )}
                                        {status === 'Aprobado' && (
                                             <Button size="sm" variant="default" onClick={() => handleUpdateStatus(req.id, 'Entregado')}>
                                                <Truck className="mr-2 h-4 w-4"/> Marcar como Entregado
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
