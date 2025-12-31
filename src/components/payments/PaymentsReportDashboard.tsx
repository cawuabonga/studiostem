
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getApprovedPaymentsInDateRange } from '@/config/firebase';
import type { Payment } from '@/types';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import type { DateRange } from 'react-day-picker';
import { subDays, startOfMonth, endOfMonth, startOfToday } from 'date-fns';
import { DollarSign, Receipt, BarChart, TrendingUp } from 'lucide-react';
import { RevenueByConceptChart } from './RevenueByConceptChart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from 'date-fns';

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
    const { instituteId } = useAuth();
    const { toast } = useToast();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);

    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    });

    const fetchData = useCallback(async () => {
        if (!instituteId || !dateRange?.from || !dateRange?.to) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const fetchedPayments = await getApprovedPaymentsInDateRange(instituteId, dateRange.from, dateRange.to);
            setPayments(fetchedPayments);
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
    
    const stats = useMemo(() => {
        const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
        const totalPayments = payments.length;
        const avgPayment = totalPayments > 0 ? totalRevenue / totalPayments : 0;

        const revenueByConcept = payments.reduce((acc, p) => {
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
    }, [payments]);

    const recentPayments = useMemo(() => payments.slice(0, 5), [payments]);


    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex-col md:flex-row md:justify-between md:items-center">
                    <div>
                        <CardTitle>Reporte de Ingresos</CardTitle>
                        <CardDescription>
                            Filtra por fecha para analizar los ingresos de tu instituto.
                        </CardDescription>
                    </div>
                    <div className="pt-4 md:pt-0">
                        <DateRangePicker date={dateRange} onDateChange={setDateRange} />
                    </div>
                </CardHeader>
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
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
