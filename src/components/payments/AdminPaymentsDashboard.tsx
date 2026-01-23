
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Payment, PaymentStatus, PaymentConcept } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { getPaymentsByStatus, updatePaymentStatus, getPaymentConcepts } from '@/config/firebase';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Eye, Check, X, Info, FileX, RotateCcw, Loader2 } from 'lucide-react';
import { ApprovePaymentDialog } from './ApprovePaymentDialog';
import { RejectPaymentDialog } from './RejectPaymentDialog';
import { AnnulPaymentDialog } from './AnnulPaymentDialog'; // New Import
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Image from 'next/image';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { DocumentSnapshot } from 'firebase/firestore';
import * as XLSX from 'xlsx';


interface AdminPaymentsDashboardProps {
    status: PaymentStatus;
}

export function AdminPaymentsDashboard({ status }: AdminPaymentsDashboardProps) {
    const { instituteId } = useAuth();
    const { toast } = useToast();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [concepts, setConcepts] = useState<PaymentConcept[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
    const [isApproveOpen, setIsApproveOpen] = useState(false);
    const [isRejectOpen, setIsRejectOpen] = useState(false);
    const [isAnnulOpen, setIsAnnulOpen] = useState(false); // New state
    const [viewingVoucherUrl, setViewingVoucherUrl] = useState<string | null>(null);
    const [dniSearch, setDniSearch] = useState('');
    const [conceptSearch, setConceptSearch] = useState('all');

    // Pagination state
    const [lastVisible, setLastVisible] = useState<DocumentSnapshot | null>(null);
    const [page, setPage] = useState(1);
    const [isLastPage, setIsLastPage] = useState(false);


    const fetchPayments = useCallback(async (pageDirection?: 'next') => {
        if (!instituteId) return;
        setLoading(true);

        const options = pageDirection === 'next' && lastVisible ? { lastVisible } : {};

        try {
            const { payments: fetchedPayments, newLastVisible } = await getPaymentsByStatus(instituteId, status, options);
            
            if (pageDirection === 'next') {
                setPayments(prev => [...prev, ...fetchedPayments]);
            } else {
                setPayments(fetchedPayments);
            }
            
            setLastVisible(newLastVisible);
            setIsLastPage(!newLastVisible || fetchedPayments.length < 20);

            if (page === 1) { // Only fetch concepts on initial load
                const fetchedConcepts = await getPaymentConcepts(instituteId);
                setConcepts(fetchedConcepts);
            }
        } catch (error) {
            console.error(`Error fetching ${status} payments:`, error);
            // toast({ title: "Error", description: "No se pudieron cargar los pagos.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [instituteId, toast, status, lastVisible, page]);
    
    useEffect(() => {
        setPayments([]);
        setLastVisible(null);
        setPage(1);
        setIsLastPage(false);
        fetchPayments();
    }, [status, instituteId]); // Refetch when status or institute changes
    
    const loadNextPage = () => {
        if (!isLastPage) {
            setPage(p => p + 1);
            fetchPayments('next');
        }
    }
    
    const handleAction = async () => {
        // Reset and refetch after any action
        setPayments([]);
        setLastVisible(null);
        setPage(1);
        setIsLastPage(false);
        await fetchPayments();
    };

    const handleApprove = async (paymentId: string, receiptNumber: string) => {
        if (!instituteId) return;
        try {
            await updatePaymentStatus(instituteId, paymentId, 'Aprobado', { receiptNumber });
            await handleAction();
            setIsApproveOpen(false);
        } catch (error) {
            // toast({ title: "Error", description: "No se pudo aprobar el pago.", variant: "destructive" });
        }
    };
    
    const handleReject = async (paymentId: string, rejectionReason: string) => {
        if (!instituteId) return;
        try {
            await updatePaymentStatus(instituteId, paymentId, 'Rechazado', { rejectionReason });
            await handleAction();
            setIsRejectOpen(false);
        } catch (error) {
            // toast({ title: "Error", description: "No se pudo rechazar el pago.", variant: "destructive" });
        }
    };

    const handleAnnul = async (paymentId: string, annulmentReason: string) => {
        if (!instituteId) return;
        try {
            await updatePaymentStatus(instituteId, paymentId, 'Anulado', { annulmentReason });
            await handleAction();
            setIsAnnulOpen(false);
        } catch (error) {
            // toast({ title: "Error", description: "No se pudo anular el pago.", variant: "destructive" });
        }
    };
    
     const filteredPayments = useMemo(() => {
        return payments.filter(p => {
            const matchesDni = dniSearch === '' || p.payerId.includes(dniSearch);
            const matchesConcept = conceptSearch === 'all' || p.concept === conceptSearch;
            return matchesDni && matchesConcept;
        });
    }, [payments, dniSearch, conceptSearch]);

    const handleExport = () => {
        const dataToExport = filteredPayments.map(p => ({
            "Fecha Pago": format(p.paymentDate.toDate(), 'dd/MM/yyyy HH:mm'),
            "Pagador": p.payerName,
            "DNI": p.payerId,
            "Concepto": p.concept,
            "Monto": p.amount,
            "Nro Operación": p.operationNumber,
            "Nro Comprobante": p.receiptNumber || 'N/A',
            "Motivo Rechazo": p.rejectionReason || 'N/A',
            "Motivo Anulación": p.annulmentReason || 'N/A',
        }));
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Pagos");
        XLSX.writeFile(workbook, `Reporte_Pagos_${status}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    };

    const renderTable = () => {
         if (loading && page === 1) {
            return (
                <div className="space-y-4 p-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            );
        }

        if (filteredPayments.length === 0) {
            return (
                <div className="text-center p-10 text-muted-foreground">
                    <Info className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium">No hay pagos</h3>
                    <p className="mt-1 text-sm">No se encontraron pagos con los filtros actuales.</p>
                </div>
            )
        }

        return (
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Fecha de Pago</TableHead>
                        <TableHead>Pagador (DNI)</TableHead>
                        <TableHead>Concepto</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>N° Operación</TableHead>
                        {status === 'Rechazado' && <TableHead>Motivo Rechazo</TableHead>}
                        {status === 'Aprobado' && <TableHead>N° Comprobante</TableHead>}
                        {status === 'Anulado' && <TableHead>Motivo Anulación</TableHead>}
                        <TableHead className="text-right">Voucher</TableHead>
                        {(status === 'Pendiente' || status === 'Aprobado') && <TableHead className="text-right">Acciones</TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredPayments.map(payment => (
                        <TableRow key={payment.id}>
                            <TableCell>{format(payment.paymentDate.toDate(), 'dd/MM/yyyy HH:mm')}</TableCell>
                            <TableCell className="font-medium">
                                {payment.payerName}
                                <p className="text-xs text-muted-foreground font-mono">{payment.payerId}</p>
                            </TableCell>
                            <TableCell>{payment.concept}</TableCell>
                            <TableCell>S/ {payment.amount.toFixed(2)}</TableCell>
                            <TableCell>{payment.operationNumber}</TableCell>
                            {status === 'Rechazado' && <TableCell className="text-destructive text-xs">{payment.rejectionReason}</TableCell>}
                            {status === 'Aprobado' && <TableCell className="font-mono">{payment.receiptNumber}</TableCell>}
                            {status === 'Anulado' && <TableCell className="text-destructive text-xs">{payment.annulmentReason}</TableCell>}
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
                             {status === 'Aprobado' && (
                                <TableCell className="text-right">
                                    <Button variant="destructive" size="sm" onClick={() => { setSelectedPayment(payment); setIsAnnulOpen(true); }}>
                                        <RotateCcw className="mr-2 h-4 w-4"/> Anular
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
             <Card className="mb-6">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Filtros de Búsqueda</CardTitle>
                        <Button onClick={handleExport} variant="outline" size="sm">
                            <FileX className="mr-2 h-4 w-4" />
                            Exportar a Excel
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 space-y-2">
                        <Label htmlFor="dni-search">Buscar por DNI del Pagador</Label>
                        <Input 
                            id="dni-search"
                            placeholder="Ingrese DNI..."
                            value={dniSearch}
                            onChange={(e) => setDniSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex-1 space-y-2">
                        <Label htmlFor="concept-search">Filtrar por Concepto</Label>
                        <Select value={conceptSearch} onValueChange={setConceptSearch}>
                            <SelectTrigger id="concept-search">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los Conceptos</SelectItem>
                                {concepts.map(c => (
                                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <div className="rounded-md border overflow-auto">
                   {renderTable()}
                </div>
                {!isLastPage && (
                    <CardContent className="pt-4 flex justify-center">
                        <Button onClick={loadNextPage} disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Cargar más resultados
                        </Button>
                    </CardContent>
                )}
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
                    <AnnulPaymentDialog
                        isOpen={isAnnulOpen}
                        onClose={() => setIsAnnulOpen(false)}
                        payment={selectedPayment}
                        onConfirm={handleAnnul}
                    />
                </>
            )}
        </>
    );
}
