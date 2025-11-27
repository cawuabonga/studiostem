

"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { Payment, PaymentStatus } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { getPaymentsByStatus, updatePaymentStatus } from '@/config/firebase';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Eye, Check, X, Info } from 'lucide-react';
import { ApprovePaymentDialog } from './ApprovePaymentDialog';
import { RejectPaymentDialog } from './RejectPaymentDialog';
import { Card } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Image from 'next/image';


interface AdminPaymentsDashboardProps {
    status: PaymentStatus;
}


export function AdminPaymentsDashboard({ status }: AdminPaymentsDashboardProps) {
    const { instituteId } = useAuth();
    const { toast } = useToast();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
    const [isApproveOpen, setIsApproveOpen] = useState(false);
    const [isRejectOpen, setIsRejectOpen] = useState(false);
    const [viewingVoucherUrl, setViewingVoucherUrl] = useState<string | null>(null);

    const fetchPayments = useCallback(async () => {
        if (!instituteId) return;
        setLoading(true);
        try {
            const fetchedPayments = await getPaymentsByStatus(instituteId, status);
            setPayments(fetchedPayments);
        } catch (error) {
            console.error(`Error fetching ${status} payments:`, error);
            // toast({ title: "Error", description: "No se pudieron cargar los pagos.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [instituteId, toast, status]);

    useEffect(() => {
        fetchPayments();
    }, [fetchPayments]);
    
    const handleApprove = async (paymentId: string, receiptNumber: string) => {
        if (!instituteId) return;
        try {
            await updatePaymentStatus(instituteId, paymentId, 'Aprobado', { receiptNumber });
            // toast({ title: "Pago Aprobado", description: "El pago ha sido aprobado y se ha asignado el comprobante." });
            fetchPayments();
            setIsApproveOpen(false);
        } catch (error) {
            // toast({ title: "Error", description: "No se pudo aprobar el pago.", variant: "destructive" });
        }
    };
    
    const handleReject = async (paymentId: string, rejectionReason: string) => {
        if (!instituteId) return;
        try {
            await updatePaymentStatus(instituteId, paymentId, 'Rechazado', { rejectionReason });
            // toast({ title: "Pago Rechazado", description: "El pago ha sido rechazado." });
            fetchPayments();
            setIsRejectOpen(false);
        } catch (error) {
            // toast({ title: "Error", description: "No se pudo rechazar el pago.", variant: "destructive" });
        }
    };
    
    const renderTable = () => {
         if (loading) {
            return (
                <div className="space-y-4 p-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            );
        }

        if (payments.length === 0) {
            return (
                <div className="text-center p-10 text-muted-foreground">
                    <Info className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium">No hay pagos</h3>
                    <p className="mt-1 text-sm">No se encontraron pagos con el estado "{status}".</p>
                </div>
            )
        }

        return (
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Fecha de Pago</TableHead>
                        <TableHead>Estudiante</TableHead>
                        <TableHead>Concepto</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>N° Operación</TableHead>
                         {status === 'Rechazado' && <TableHead>Motivo Rechazo</TableHead>}
                         {status === 'Aprobado' && <TableHead>N° Comprobante</TableHead>}
                        <TableHead className="text-right">Voucher</TableHead>
                         {status === 'Pendiente' && <TableHead className="text-right">Acciones</TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {payments.map(payment => (
                        <TableRow key={payment.id}>
                            <TableCell>{format(payment.paymentDate.toDate(), 'dd/MM/yyyy')}</TableCell>
                            <TableCell className="font-medium">{payment.studentName}</TableCell>
                            <TableCell>{payment.concept}</TableCell>
                            <TableCell>S/ {payment.amount.toFixed(2)}</TableCell>
                            <TableCell>{payment.operationNumber}</TableCell>
                             {status === 'Rechazado' && <TableCell className="text-destructive text-xs">{payment.rejectionReason}</TableCell>}
                            {status === 'Aprobado' && <TableCell className="font-mono">{payment.receiptNumber}</TableCell>}
                            <TableCell className="text-right">
                                 <Button variant="outline" size="sm" onClick={() => setViewingVoucherUrl(payment.voucherUrl)}>
                                    <Eye className="mr-2 h-4 w-4"/> Ver
                                </Button>
                            </TableCell>
                             {status === 'Pendiente' && (
                                <TableCell className="text-right space-x-2">
                                    <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700" onClick={() => { setSelectedPayment(payment); setIsApproveOpen(true); }}>
                                        <Check className="mr-2 h-4 w-4"/> Aprobar
                                    </Button>
                                    <Button variant="destructive" size="sm" onClick={() => { setSelectedPayment(payment); setIsRejectOpen(true); }}>
                                        <X className="mr-2 h-4 w-4"/> Rechazar
                                    </Button>
                                </TableCell>
                             )}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        )
    }

    return (
        <>
            <Card>
                <div className="rounded-md">
                   {renderTable()}
                </div>
            </Card>

            <Dialog open={!!viewingVoucherUrl} onOpenChange={(isOpen) => !isOpen && setViewingVoucherUrl(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                    <DialogTitle>Voucher de Pago</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        {viewingVoucherUrl && (
                             <Image src={viewingVoucherUrl} alt="Voucher de pago" width={400} height={600} className="w-full h-auto object-contain rounded-md" data-ai-hint="payment voucher" />
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {selectedPayment && (
                <>
                    <ApprovePaymentDialog
                        isOpen={isApproveOpen}
                        onClose={() => setIsApproveOpen(false)}
                        payment={selectedPayment}
                        onConfirm={handleApprove}
                    />
                    <RejectPaymentDialog
                        isOpen={isRejectOpen}
                        onClose={() => setIsRejectOpen(false)}
                        payment={selectedPayment}
                        onConfirm={handleReject}
                    />
                </>
            )}
        </>
    );
}
