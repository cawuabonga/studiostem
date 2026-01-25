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
import { AlertTriangle, CheckCircle, Clock, XCircle, Info, Printer } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import Image from 'next/image';
import { PrintSupplyRequest } from './PrintSupplyRequest';

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
    const { instituteId, user, institute } = useAuth();
    const { toast } = useToast();
    
    const [requests, setRequests] = useState<SupplyRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<SupplyRequest | null>(null);
    const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);


    const fetchData = useCallback(async () => {
        const requesterAuthUid = user?.uid;
        if (!instituteId || !requesterAuthUid) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const fetchedRequests = await getRequestsForUser(instituteId, requesterAuthUid);
            setRequests(fetchedRequests);
        } catch (error) {
            toast({ title: "Error", description: "No se pudieron cargar tus pedidos.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [instituteId, user, toast]);

    useEffect(() => { fetchData() }, [fetchData]);
    
    const handlePrintRequest = (request: SupplyRequest) => {
        setSelectedRequest(request);
        setIsPrintDialogOpen(true);
    };

    const handleActualPrint = () => {
        const printContent = document.getElementById('request-print-area')?.innerHTML;
        const styles = Array.from(document.styleSheets)
            .map(s => s.href ? `<link rel="stylesheet" href="${s.href}">` : '')
            .join('');

        const printWindow = window.open('', '_blank');
        if (printWindow && printContent) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Solicitud de Insumos - ${selectedRequest?.code}</title>
                        ${styles}
                         <style>
                            @media print {
                                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
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


    return (
        <>
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
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={4}><Skeleton className="h-24 w-full" /></TableCell></TableRow>
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
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" onClick={() => handlePrintRequest(req)}>
                                                <Printer className="mr-2 h-4 w-4" />
                                                Imprimir Cargo
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={4} className="h-24 text-center">No has realizado ninguna solicitud.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>

        {selectedRequest && institute && (
            <Dialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
                <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Previsualización de Cargo de Solicitud</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 py-4 bg-gray-100 rounded-md overflow-y-auto">
                        <div style={{ transform: 'scale(0.8)', transformOrigin: 'top center' }}>
                             <PrintSupplyRequest request={selectedRequest} institute={institute} />
                        </div>
                    </div>
                    <DialogFooter className="mt-4 flex-shrink-0">
                        <Button variant="ghost" onClick={() => setIsPrintDialogOpen(false)}>Cerrar</Button>
                        <Button onClick={handleActualPrint}>Imprimir</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )}

        <div id="request-print-area" className="hidden">
             {selectedRequest && institute && (
                <PrintSupplyRequest request={selectedRequest} institute={institute} />
             )}
        </div>
        </>
    );
}
