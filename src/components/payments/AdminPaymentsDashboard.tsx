

"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { Payment } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { getPaymentsByStatus, updatePaymentStatus } from '@/config/firebase';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Eye, Check, X } from 'lucide-react';
import { ApprovePaymentDialog } from './ApprovePaymentDialog';
import { RejectPaymentDialog } from './RejectPaymentDialog';
import Image from 'next/image';

export function AdminPaymentsDashboard() {
    const { instituteId } = useAuth();
    const { toast } = useToast();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
    const [isApproveOpen, setIsApproveOpen] = useState(false);
    const [isRejectOpen, setIsRejectOpen] = useState(false);
    
    const fetchPayments = useCallback(async () => {
        if (!instituteId) return;
        setLoading(true);
        try {
            const pendingPayments = await getPaymentsByStatus(instituteId, 'Pendiente');
            setPayments(pendingPayments);
        } catch (error) {
            console.error("Error fetching pending payments:", error);
            toast({ title: "Error", description: "No se pudieron cargar los pagos pendientes.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [instituteId, toast]);

    useEffect(() => {
        fetchPayments();
    }, [fetchPayments]);
    
    const handleApprove = async (paymentId: string, receiptNumber: string) => {
        if (!instituteId) return;
        try {
            await updatePaymentStatus(instituteId, paymentId, 'Aprobado', { receiptNumber });
            toast({ title: "Pago Aprobado", description: "El pago ha sido aprobado y se ha asignado el comprobante." });
            fetchPayments();
            setIsApproveOpen(false);
        } catch (error) {
            toast({ title: "Error", description: "No se pudo aprobar el pago.", variant: "destructive" });
        }
    };
    
    const handleReject = async (paymentId: string, rejectionReason: string) => {
        if (!instituteId) return;
        try {
            await updatePaymentStatus(instituteId, paymentId, 'Rechazado', { rejectionReason });
            toast({ title: "Pago Rechazado", description: "El pago ha sido rechazado." });
            fetchPayments();
            setIsRejectOpen(false);
        } catch (error) {
            toast({ title: "Error", description: "No se pudo rechazar el pago.", variant: "destructive" });
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        );
    }
    
    return (
        <>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fecha de Registro</TableHead>
                            <TableHead>Estudiante</TableHead>
                            <TableHead>Concepto</TableHead>
                            <TableHead>Monto</TableHead>
                            <TableHead>N° Operación</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {payments.length > 0 ? (
                            payments.map(payment => (
                                <TableRow key={payment.id}>
                                    <TableCell>{format(payment.createdAt.toDate(), 'dd/MM/yyyy HH:mm')}</TableCell>
                                    <TableCell className="font-medium">{payment.studentName}</TableCell>
                                    <TableCell>{payment.concept}</TableCell>
                                    <TableCell>S/ {payment.amount.toFixed(2)}</TableCell>
                                    <TableCell>{payment.operationNumber}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button variant="outline" size="sm" asChild>
                                            <a href={payment.voucherUrl} target="_blank" rel="noopener noreferrer">
                                                <Eye className="mr-2 h-4 w-4"/> Ver Voucher
                                            </a>
                                        </Button>
                                        <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700" onClick={() => { setSelectedPayment(payment); setIsApproveOpen(true); }}>
                                            <Check className="mr-2 h-4 w-4"/> Aprobar
                                        </Button>
                                         <Button variant="destructive" size="sm" onClick={() => { setSelectedPayment(payment); setIsRejectOpen(true); }}>
                                            <X className="mr-2 h-4 w-4"/> Rechazar
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No hay pagos pendientes de validación.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
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
