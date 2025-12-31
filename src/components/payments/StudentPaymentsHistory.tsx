

"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { Payment, PaymentStatus } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { getStudentPaymentsByStatus } from '@/config/firebase';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle, Clock, XCircle, Eye, Info } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import Image from 'next/image';
import { Card } from '../ui/card';

const statusConfig = {
    'Pendiente': { text: 'Pendiente de Verificación', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
    'Aprobado': { text: 'Aprobado', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
    'Rechazado': { text: 'Rechazado', icon: XCircle, color: 'bg-red-100 text-red-800' },
}

interface StudentPaymentsHistoryProps {
    status: PaymentStatus;
}

export function StudentPaymentsHistory({ status }: StudentPaymentsHistoryProps) {
    const { user, instituteId } = useAuth();
    const { toast } = useToast();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewingVoucherUrl, setViewingVoucherUrl] = useState<string | null>(null);

    const fetchPayments = useCallback(async () => {
        if (!instituteId || !user?.documentId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const studentPayments = await getStudentPaymentsByStatus(instituteId, user.documentId, status);
            setPayments(studentPayments);
        } catch (error) {
            console.error("Error fetching student payments:", error);
            toast({ title: "Error", description: "No se pudo cargar tu historial de pagos.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [instituteId, user?.documentId, toast, status]);

    useEffect(() => {
        fetchPayments();
    }, [fetchPayments]);

    if (loading) {
        return (
             <Card>
                <div className="space-y-4 p-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            </Card>
        );
    }
    
    if (payments.length === 0) {
        return (
             <Card>
                <div className="text-center p-10 text-muted-foreground">
                    <Info className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium">No hay pagos</h3>
                    <p className="mt-1 text-sm">No se encontraron pagos con el estado "{status}".</p>
                </div>
            </Card>
        )
    }

    return (
        <>
        <Card>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fecha de Pago</TableHead>
                            <TableHead>Concepto</TableHead>
                            <TableHead>Monto</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Observaciones</TableHead>
                            <TableHead>Voucher</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {payments.map(payment => {
                            const config = statusConfig[payment.status] || { text: 'Desconocido', icon: AlertTriangle, color: 'bg-gray-100 text-gray-800' };
                            return (
                                <TableRow key={payment.id}>
                                    <TableCell>{format(payment.paymentDate.toDate(), 'dd/MM/yyyy')}</TableCell>
                                    <TableCell className="font-medium">{payment.concept}</TableCell>
                                    <TableCell>S/ {payment.amount.toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Badge className={cn("text-xs font-semibold", config.color)}>
                                            <config.icon className="mr-2 h-4 w-4"/>
                                            {config.text}
                                        </Badge>
                                    </TableCell>
                                     <TableCell>
                                        {payment.status === 'Aprobado' && <span className="font-mono text-xs">Comprobante: {payment.receiptNumber || 'N/A'}</span>}
                                        {payment.status === 'Rechazado' && <p className="text-xs text-destructive italic">{payment.rejectionReason}</p>}
                                    </TableCell>
                                     <TableCell>
                                        <Button variant="link" className="p-0 h-auto" onClick={() => setViewingVoucherUrl(payment.voucherUrl)}>
                                            <Eye className="mr-1 h-4 w-4"/> Ver
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>
        </Card>
        <Dialog open={!!viewingVoucherUrl} onOpenChange={(isOpen) => !isOpen && setViewingVoucherUrl(null)}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                <DialogTitle>Mi Voucher de Pago</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    {viewingVoucherUrl && (
                        <Image src={viewingVoucherUrl} alt="Voucher de pago" width={400} height={600} className="w-full h-auto object-contain rounded-md" data-ai-hint="payment voucher"/>
                    )}
                </div>
            </DialogContent>
        </Dialog>
        </>
    );
}
