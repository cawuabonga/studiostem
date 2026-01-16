"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getApprovedPaymentsInDateRange, getPaymentConcepts } from '@/config/firebase';
import type { Payment, PaymentConcept } from '@/types';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import type { DateRange } from 'react-day-picker';
import { startOfMonth, endOfMonth } from 'date-fns';
import { DollarSign, Receipt, BarChart, TrendingUp, Printer } from 'lucide-react';
import { RevenueByConceptChart } from './RevenueByConceptChart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from 'date-fns';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { PrintPaymentsReport } from './PrintPaymentsReport';

const StatCard = ({ title, value, icon: Icon, description }: { title: string, value: string | number, icon: React.ElementType, description?: string }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </CardContent>
    </Card>
);


export function PaymentsReportDashboard() {
    const { instituteId, institute } = useAuth();
    const { toast } = useToast();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [concepts, setConcepts] = useState<PaymentConcept[]>([]);
    const [loading, setLoading] = useState(true);

    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    });
    
    const [dniSearch, setDniSearch] = useState('');
    const [conceptSearch, setConceptSearch] = useState('all');

    const fetchData = useCallback(async () => {
        if (!instituteId || !dateRange?.from || !dateRange?.to) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
             const [fetchedPayments, fetchedConcepts] = await Promise.all([
                getApprovedPaymentsInDateRange(instituteId, dateRange.from, dateRange.to),
                getPaymentConcepts(instituteId)
            ]);
            setPayments(fetchedPayments);
            setConcepts(fetchedConcepts);
        } catch (error) {
            console.error("Error fetching payments report:", error);
            toast({ title: "Error", description: "No se pudieron cargar los datos del reporte.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [instituteId, dateRange, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const filteredPayments = useMemo(() => {
        return payments.filter(p => {
            const matchesDni = dniSearch === '' || p.payerId.includes(dniSearch);
            const matchesConcept = conceptSearch === 'all' || p.concept === conceptSearch;
            return matchesDni && matchesConcept;
        });
    }, [payments, dniSearch, conceptSearch]);

    const stats = useMemo(() => {
        const totalRevenue = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
        const totalPayments = filteredPayments.length;
        const avgPayment = totalPayments > 0 ? totalRevenue / totalPayments : 0;

        const revenueByConcept = filteredPayments.reduce((acc, p) => {
            acc[p.concept] = (acc[p.concept] || 0) + p.amount;
            return acc;
        }, {} as Record<string, number>);

        const topConcept = Object.entries(revenueByConcept).sort((a,b) => b[1] - a[1])[0] || ["N/A", 0];

        return {
            totalRevenue,
            totalPayments,
            avgPayment,
            topConcept: { name: topConcept[0], amount: topConcept[1] },
            revenueByConceptChartData: Object.entries(revenueByConcept)
                .map(([name, total]) => ({ name, total }))
                .sort((a,b) => b.total - a.total),
        };
    }, [filteredPayments]);

    const recentPayments = useMemo(() => filteredPayments.slice(0, 5), [filteredPayments]);

    const handlePrint = () => {
        const printContent = document.getElementById('print-area')?.innerHTML;
        const styles = Array.from(document.styleSheets)
            .map(s => s.href ? `<link rel="stylesheet" href="${s.href}">` : '')
            .join('');

        const printWindow = window.open('', '_blank');
        if (printWindow && printContent) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Reporte de Ingresos</title>
                        ${styles}
                         <style>
                            @media print {
                                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                                .print-block { display: block !important; }
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
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Reporte de Ingresos</CardTitle>
                    <CardDescription>
                        Filtra por fecha para analizar los ingresos de tu instituto.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                        <div className="space-y-2">
                            <Label htmlFor="date-range">Rango de Fechas</Label>
                            <DateRangePicker id="date-range" date={dateRange} onDateChange={setDateRange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dni-search">Buscar por DNI</Label>
                            <Input id="dni-search" placeholder="Filtrar por DNI..." value={dniSearch} onChange={e => setDniSearch(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="concept-search">Filtrar por Concepto</Label>
                            <Select value={conceptSearch} onValueChange={setConceptSearch}>
                                <SelectTrigger id="concept-search"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los conceptos</SelectItem>
                                    {concepts.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                     </div>
                      <div className="flex justify-end mt-4">
                        <Button onClick={handlePrint} variant="outline">
                            <Printer className="mr-2 h-4 w-4" />
                            Imprimir Reporte
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {loading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full"/>)}
                </div>
            ) : (
                 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard 
                        title="Ingresos Totales" 
                        value={`S/ ${stats.totalRevenue.toFixed(2)}`} 
                        icon={DollarSign} 
                        description={`Basado en ${stats.totalPayments} pagos`} 
                    />
                    <StatCard 
                        title="Total de Pagos" 
                        value={stats.totalPayments} 
                        icon={Receipt} 
                        description="Transacciones aprobadas en el período" 
                    />
                    <StatCard 
                        title="Pago Promedio" 
                        value={`S/ ${stats.avgPayment.toFixed(2)}`} 
                        icon={BarChart} 
                        description="Monto promedio por transacción" 
                    />
                     <StatCard 
                        title="Concepto Principal" 
                        value={stats.topConcept.name} 
                        icon={TrendingUp} 
                        description={`Generó S/ ${stats.topConcept.amount.toFixed(2)}`} 
                    />
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-12">
                 <Card className="md:col-span-7">
                    <CardHeader>
                        <CardTitle>Ingresos por Concepto de Pago</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-80 w-full" /> : <RevenueByConceptChart data={stats.revenueByConceptChartData} />}
                    </CardContent>
                </Card>
                 <Card className="md:col-span-5">
                    <CardHeader>
                        <CardTitle>Últimos Pagos Aprobados</CardTitle>
                    </CardHeader>
                     <CardContent>
                        {loading ? <Skeleton className="h-80 w-full" /> : (
                             <div className="overflow-auto rounded-md border">
                                 <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Pagador</TableHead>
                                            <TableHead>Concepto</TableHead>
                                            <TableHead className="text-right">Monto</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {recentPayments.length > 0 ? recentPayments.map(p => (
                                            <TableRow key={p.id}>
                                                <TableCell>
                                                    <div className="font-medium">{p.payerName}</div>
                                                    <div className="text-xs text-muted-foreground">{format(p.paymentDate.toDate(), 'dd/MM/yy')}</div>
                                                </TableCell>
                                                <TableCell>{p.concept}</TableCell>
                                                <TableCell className="text-right">S/ {p.amount.toFixed(2)}</TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={3} className="h-24 text-center">No hay pagos aprobados en este período.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                             </div>
                        )}
                    </CardContent>
                </Card>
            </div>
            <div id="print-area" className="hidden">
                 <PrintPaymentsReport 
                    payments={filteredPayments} 
                    stats={stats} 
                    filters={{ dateRange, dniSearch, conceptSearch }}
                    institute={institute}
                    concepts={concepts}
                />
            </div>
        </div>
    );
}