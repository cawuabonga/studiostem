"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { SupplyRequest, SupplyRequestStatus } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { getSupplyRequestsByStatus } from '@/config/firebase';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Check, X, Truck, Info, Loader2 } from 'lucide-react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ApproveRequestDialog } from './ApproveRequestDialog';
import { RejectRequestDialog } from './RejectRequestDialog';
import { DeliverRequestDialog } from './DeliverRequestDialog';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '../ui/tooltip';


interface AdminSupplyRequestsListProps {
    status: SupplyRequestStatus;
}

export function AdminSupplyRequestsList({ status }: AdminSupplyRequestsListProps) {
    const { instituteId } = useAuth();
    const { toast } = useToast();
    const [requests, setRequests] = useState<SupplyRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<SupplyRequest | null>(null);
    
    const [isApproveOpen, setIsApproveOpen] = useState(false);
    const [isRejectOpen, setIsRejectOpen] = useState(false);
    const [isDeliverOpen, setIsDeliverOpen] = useState(false);
    
    const [filter, setFilter] = useState('');

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

    const filteredRequests = useMemo(() => {
        return requests.filter(req => 
            req.requesterName.toLowerCase().includes(filter.toLowerCase()) ||
            (req.code || '').toLowerCase().includes(filter.toLowerCase())
        );
    }, [requests, filter]);

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
        <>
            <div className="mb-4">
                <Label htmlFor="search-requests">Buscar por solicitante o código</Label>
                <Input 
                    id="search-requests"
                    placeholder="Escriba para filtrar..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="max-w-sm mt-1"
                />
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Código</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Solicitante</TableHead>
                            <TableHead>Insumos</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredRequests.map(req => (
                            <TableRow key={req.id} className="bg-card">
                                <TableCell className="font-mono">{req.code}</TableCell>
                                <TableCell className="text-xs">{format(req.createdAt.toDate(), 'dd/MM/yy HH:mm')}</TableCell>
                                <TableCell>{req.requesterName}</TableCell>
                                <TableCell>
                                    <ul className="list-disc list-inside text-sm">
                                        {req.items.map(item => (
                                            <li key={item.itemId}>
                                                {item.requestedQuantity} x {item.name}
                                                {item.approvedQuantity !== undefined && item.approvedQuantity !== item.requestedQuantity && (
                                                    <span className="text-xs font-bold text-blue-600"> (Aprobado: {item.approvedQuantity})</span>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </TableCell>
                                <TableCell className="text-right">
                                    {status === 'Pendiente' && (
                                        <TooltipProvider>
                                            <div className="space-x-1">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="text-green-600 hover:bg-green-100 hover:text-green-700" onClick={() => { setSelectedRequest(req); setIsApproveOpen(true); }}>
                                                            <Check className="h-5 w-5"/>
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Aprobar Pedido</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="text-red-600 hover:bg-red-100 hover:text-red-700" onClick={() => { setSelectedRequest(req); setIsRejectOpen(true); }}>
                                                            <X className="h-5 w-5"/>
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Rechazar Pedido</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </TooltipProvider>
                                    )}
                                    {status === 'Aprobado' && (
                                        <Button size="sm" onClick={() => { setSelectedRequest(req); setIsDeliverOpen(true); }}>
                                            <Truck className="mr-2 h-4 w-4"/> Entregar (PECOSA)
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            
            {selectedRequest && isApproveOpen && (
                <ApproveRequestDialog
                    isOpen={isApproveOpen}
                    onClose={() => setIsApproveOpen(false)}
                    request={selectedRequest}
                    onConfirm={() => { setIsApproveOpen(false); fetchData(); }}
                />
            )}
             {selectedRequest && isRejectOpen && (
                <RejectRequestDialog
                    isOpen={isRejectOpen}
                    onClose={() => setIsRejectOpen(false)}
                    request={selectedRequest}
                    onConfirm={() => { setIsRejectOpen(false); fetchData(); }}
                />
            )}
             {selectedRequest && isDeliverOpen && (
                <DeliverRequestDialog
                    isOpen={isDeliverOpen}
                    onClose={() => setIsDeliverOpen(false)}
                    request={selectedRequest}
                    onConfirm={() => { setIsDeliverOpen(false); fetchData(); }}
                />
            )}
        </>
    )
}
