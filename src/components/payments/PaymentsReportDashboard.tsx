
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
import { startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { DollarSign, Receipt, BarChart, TrendingUp, Printer, Calendar as CalendarIcon, Filter } from 'lucide-react';
import { RevenueByConceptChart } from './RevenueByConceptChart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { PrintPaymentsReport } from './PrintPaymentsReport';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import '@/app/dashboard/gestion-academica/print-grades.css';

const StatCard = ({ title, value, icon: Icon, description }: { title: string, value: string | number, icon: React.ElementType, description?: string }) => (
    <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">{title}</CardTitle>
            <Icon className="h-3.5 w-3.5 text-muted-foreground/60" />
        </CardHeader>
        <CardContent>
            <div className="text-xl font-black tracking-tight">{value}</div>
            {description && <p className="text-[9px] text-muted-foreground mt-0.5 leading-none">{description}</p>}
        </CardContent>
    </Card>
);

const months = [
    { value: 'all', label: 'Todo el año' },
    { value: '0', label: 'Enero' },
    { value: '1', label: 'Febrero' },
    { value: '2', label: 'Marzo' },
    { value: '3', label: 'Abril' },
    { value: '4', label: 'Mayo' },
    { value: '5', label: 'Junio' },
    { value: '6', label: 'Julio' },
    { value: '7', label: 'Agosto' },
    { value: '8', label: 'Septiembre' },
    { value: '9', label: 'Octubre' },
    { value: '10', label: 'Noviembre' },
    { value: '11', label: 'Diciembre' },
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 10 }, (_, i) => (currentYear - 5 + i).toString());

export function PaymentsReportDashboard() {
    const { instituteId, institute } = useAuth();
    const { toast } = useToast();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [concepts, setConcepts] = useState<PaymentConcept[]>([]);
    const [loading, setLoading] = useState(true);

    const [filterMode, setFilterMode] = useState<'period' | 'custom'>('period');
    const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
    const [selectedMonth, setSelectedMonth] = useState<string>(new Date().getMonth().toString());

    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    });
    
    const [dniSearch, setDniSearch] = useState('');
    const [conceptSearch, setConceptSearch] = useState('all');

    useEffect(() => {
        if (filterMode === 'period') {
            const year = parseInt(selectedYear);
            if (selectedMonth === 'all') {
                const date = new Date(year, 0, 1);
                setDateRange({
                    from: startOfYear(date),
                    to: endOfYear(date),
                });
            } else {
                const month = parseInt(selectedMonth);
                const date = new Date(year, month, 1);
                setDateRange({
                    from: startOfMonth(date),
                    to: endOfMonth(date),
                });
            }
        }
    }, [filterMode, selectedYear, selectedMonth]);

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
        window.print();
    };


    return (
        <div className="space-y-6">
            <Card className="no-print border-primary/10 shadow-sm">
                <CardHeader className="pb-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <CardTitle>Análisis de Ingresos Institucionales</CardTitle>
                            <CardDescription>
                                Consulta y filtra la recaudación por tiempo, alumno o concepto de pago.
                            </CardDescription>
                        </div>
                        <Button onClick={handlePrint} variant="outline" className="shadow-sm">
                            <Printer className="mr-2 h-4 w-4" />
                            Imprimir Reporte
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center justify-between border-b pb-4">
                            <div className="flex items-center gap-4">
                                <Tabs value={filterMode} onValueChange={(v) => setFilterMode(v as any)} className="w-auto">
                                    <TabsList className="grid w-[400px] grid-cols-2">
                                        <TabsTrigger value="period" className="flex items-center gap-2">
                                            <CalendarIcon className="h-4 w-4" />
                                            Por Mes / Año
                                        </TabsTrigger>
                                        <TabsTrigger value="custom" className="flex items-center gap-2">
                                            <Filter className="h-4 w-4" />
                                            Rango Libre
                                        </TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                            {filterMode === 'period' ? (
                                <>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">Año Académico</Label>
                                        <Select value={selectedYear} onValueChange={setSelectedYear}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">Mes</Label>
                                        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </>
                            ) : (
                                <div className="col-span-1 md:col-span-2 space-y-2">
                                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">Rango de Días Específicos</Label>
                                    <DateRangePicker date={dateRange} onDateChange={setDateRange} className="w-full" />
                                </div>
                            )}
                            
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase text-muted-foreground">DNI del Alumno</Label>
                                <Input placeholder="Escriba para buscar..." value={dniSearch} onChange={e => setDniSearch(e.target.value)} />
                            </div>
                            
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Concepto</Label>
                                <Select value={conceptSearch} onValueChange={setConceptSearch}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos los conceptos</SelectItem>
                                        {concepts.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {loading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 no-print">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full"/>)}
                </div>
            ) : (
                 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 no-print">
                    <StatCard 
                        title="Ingresos Totales" 
                        value={`S/ ${stats.totalRevenue.toFixed(0)}`} 
                        icon={DollarSign} 
                        description={`En el período seleccionado`} 
                    />
                    <StatCard 
                        title="Total de Pagos" 
                        value={stats.totalPayments} 
                        icon={Receipt} 
                        description="Transacciones" 
                    />
                    <StatCard 
                        title="Pago Promedio" 
                        value={`S/ ${stats.avgPayment.toFixed(0)}`} 
                        icon={BarChart} 
                        description="Monto medio" 
                    />
                     <StatCard 
                        title="Más Recaudado" 
                        value={stats.topConcept.name} 
                        icon={TrendingUp} 
                        description={`Aportó S/ ${stats.topConcept.amount.toFixed(0)}`} 
                    />
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-12 no-print">
                 <Card className="md:col-span-7 border-primary/10 shadow-sm">
                    <CardHeader>
                        <CardTitle>Recaudación por Concepto</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-80 w-full" /> : <RevenueByConceptChart data={stats.revenueByConceptChartData} />}
                    </CardContent>
                </Card>
                 <Card className="md:col-span-5 border-primary/10 shadow-sm">
                    <CardHeader>
                        <CardTitle>Registros Recientes</CardTitle>
                    </CardHeader>
                     <CardContent>
                        {loading ? <Skeleton className="h-80 w-full" /> : (
                             <div className="overflow-auto rounded-md border">
                                 <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead>Pagador</TableHead>
                                            <TableHead className="text-right">Monto</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {recentPayments.length > 0 ? recentPayments.map(p => (
                                            <TableRow key={p.id} className="hover:bg-muted/30 transition-colors">
                                                <TableCell>
                                                    <div className="font-bold text-xs uppercase">{p.payerName}</div>
                                                    <div className="text-[9px] text-muted-foreground flex gap-2">
                                                        <span>{format(p.paymentDate.toDate(), 'dd/MM/yy')}</span>
                                                        <span className="font-mono">{p.concept}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-black text-primary text-sm">S/ {p.amount.toFixed(0)}</TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={2} className="h-24 text-center text-muted-foreground italic">No se encontraron pagos.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                             </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="print-only">
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

