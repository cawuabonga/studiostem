
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { Payment } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { getStudentPayments } from '@/config/firebase';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle, Clock, XCircle, Eye } from 'lucide-react';

const statusConfig = {
    'Pendiente': { text: 'Pendiente de Verificación', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
    'Aprobado': { text: 'Aprobado', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
    'Rechazado': { text: 'Rechazado', icon: XCircle, color: 'bg-red-100 text-red-800' },
}

export function StudentPaymentsHistory() {
    const { user, instituteId } = useAuth();
    const { toast } = useToast();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    
    const fetchPayments = useCallback(async () => {
        if (!instituteId || !user?.documentId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const studentPayments = await getStudentPayments(instituteId, user.documentId);
            setPayments(studentPayments);
        } catch (error) {
            console.error("Error fetching student payments:", error);
            toast({ title: "Error", description: "No se pudo cargar tu historial de pagos.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [instituteId, user?.documentId, toast]);

    useEffect(() => {
        fetchPayments();
    }, [fetchPayments]);

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
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Fecha de Registro</TableHead>
                        <TableHead>Concepto</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>N° Comprobante Físico</TableHead>
                        <TableHead>Voucher</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {payments.length > 0 ? (
                        payments.map(payment => {
                            const config = statusConfig[payment.status] || { text: 'Desconocido', icon: AlertTriangle, color: 'bg-gray-100 text-gray-800' };
                            return (
                                <TableRow key={payment.id}>
                                    <TableCell>{format(payment.createdAt.toDate(), 'dd/MM/yyyy HH:mm')}</TableCell>
                                    <TableCell className="font-medium">{payment.concept}</TableCell>
                                    <TableCell>S/ {payment.amount.toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Badge className={cn("text-xs font-semibold", config.color)}>
                                            <config.icon className="mr-2 h-4 w-4"/>
                                            {config.text}
                                        </Badge>
                                        {payment.status === 'Rechazado' && (
                                            <p className="text-xs text-destructive mt-1 italic">{payment.rejectionReason}</p>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-mono">{payment.receiptNumber || '---'}</TableCell>
                                     <TableCell>
                                        <a href={payment.voucherUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                                            <Eye className="h-4 w-4"/> Ver
                                        </a>
                                    </TableCell>
                                </TableRow>
                            )
                        })
                    ) : (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                                Aún no has registrado ningún pago.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
