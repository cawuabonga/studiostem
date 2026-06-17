
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getInstitutes, getInstituteMetrics } from '@/config/firebase';
import type { Institute, InstituteMetrics } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Activity, Users, GraduationCap, DollarSign, Loader2, RefreshCw, BarChart3, TrendingUp, Info } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface InstituteWithMetrics extends Institute {
    metrics?: InstituteMetrics;
}

const COLORS = ['#1e3a8a', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const StatCard = ({ title, value, icon: Icon, description }: { title: string, value: string | number, icon: React.ElementType, description: string }) => (
    <Card className="border-primary/10 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{title}</CardTitle>
            <Icon className="h-4 w-4 text-primary opacity-60" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-black tracking-tighter">{value}</div>
            <p className="text-[9px] text-muted-foreground uppercase font-bold mt-1">{description}</p>
        </CardContent>
    </Card>
);

export function ObservabilityDashboard() {
    const { toast } = useToast();
    const [institutes, setInstitutes] = useState<InstituteWithMetrics[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const allInstitutes = await getInstitutes();
            const metricsPromises = allInstitutes.map(async (inst) => {
                try {
                    const metrics = await getInstituteMetrics(inst.id);
                    return { ...inst, metrics };
                } catch (e) {
                    console.error(`Error loading metrics for ${inst.name}`, e);
                    return inst;
                }
            });
            const data = await Promise.all(metricsPromises);
            setInstitutes(data);
        } catch (error) {
            toast({ title: "Error", description: "No se pudieron cargar las métricas de la plataforma.", variant: "destructive" });
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [toast]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const globalStats = useMemo(() => {
        return institutes.reduce((acc, inst) => {
            if (inst.metrics) {
                acc.students += inst.metrics.totalStudents;
                acc.staff += inst.metrics.totalStaff;
                acc.units += inst.metrics.totalUnits;
                acc.revenue += inst.metrics.totalRevenue;
                acc.payments += inst.metrics.totalPayments;
            }
            return acc;
        }, { students: 0, staff: 0, units: 0, revenue: 0, payments: 0 });
    }, [institutes]);

    const chartData = useMemo(() => {
        return institutes
            .filter(i => i.metrics)
            .map(inst => ({
                name: inst.name.length > 15 ? inst.name.substring(0, 15) + '...' : inst.name,
                Alumnos: inst.metrics!.totalStudents,
                Recaudacion: inst.metrics!.totalRevenue,
            }))
            .sort((a, b) => b.Alumnos - a.Alumnos);
    }, [institutes]);

    const distributionData = useMemo(() => {
        return institutes
            .filter(i => i.metrics)
            .map(inst => ({
                name: inst.name,
                value: inst.metrics!.totalStudents
            }))
            .sort((a, b) => b.value - a.value);
    }, [institutes]);

    if (loading) return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
            </div>
            <Skeleton className="h-[400px] w-full rounded-2xl" />
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Cabecera de Resumen Global */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard title="Estudiantes Globales" value={globalStats.students.toLocaleString()} icon={Users} description="Alumnos en toda la red" />
                <StatCard title="Fuerza Laboral" value={globalStats.staff.toLocaleString()} icon={GraduationCap} description="Docentes y administrativos" />
                <StatCard title="Recaudación Total" value={`S/ ${globalStats.revenue.toLocaleString()}`} icon={DollarSign} description="Monto total procesado" />
                <StatCard title="Unidades de Valor" value={globalStats.units.toLocaleString()} icon={Activity} description="Contenidos educativos" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Gráfico Comparativo */}
                <Card className="lg:col-span-8 shadow-xl border-primary/5 rounded-3xl">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-primary" /> Comparativa de Alumnado
                            </CardTitle>
                            <CardDescription>Distribución de carga por cada institución educativa.</CardDescription>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => { setIsRefreshing(true); fetchData(); }} disabled={isRefreshing}>
                            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                        </Button>
                    </CardHeader>
                    <CardContent className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                <ChartTooltip 
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="Alumnos" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} barSize={45} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Pie Chart: Distribución de Mercado */}
                <Card className="lg:col-span-4 shadow-xl border-primary/5 rounded-3xl">
                    <CardHeader>
                        <CardTitle className="text-lg font-black uppercase tracking-tight">Market Share</CardTitle>
                        <CardDescription>Participación por Alumnado.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px] flex flex-col items-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={distributionData}
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {distributionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <ChartTooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="grid grid-cols-2 gap-2 w-full mt-4">
                            {distributionData.slice(0, 4).map((entry, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                    <span className="text-[9px] font-black uppercase truncate">{entry.name}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Matriz de Consumo Detallada */}
            <Card className="shadow-2xl border-none rounded-3xl overflow-hidden">
                <CardHeader className="bg-muted/30 pb-6 border-b">
                    <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" /> Matriz de Consumo y Actividad
                    </CardTitle>
                    <CardDescription>Detalle técnico y financiero por cada "Tenant" (Instituto).</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow>
                                <TableHead className="font-black text-[10px] uppercase pl-8 py-4">Institución</TableHead>
                                <TableHead className="text-center font-black text-[10px] uppercase">Alumnos</TableHead>
                                <TableHead className="text-center font-black text-[10px] uppercase">Docentes</TableHead>
                                <TableHead className="text-center font-black text-[10px] uppercase">U. Didácticas</TableHead>
                                <TableHead className="text-center font-black text-[10px] uppercase">Pagos Aprob.</TableHead>
                                <TableHead className="text-right font-black text-[10px] uppercase pr-8">Recaudación (S/)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {institutes.map((inst) => (
                                <TableRow key={inst.id} className="hover:bg-primary/5 transition-colors group">
                                    <TableCell className="pl-8 py-4">
                                        <div className="flex items-center gap-3">
                                            {inst.logoUrl ? (
                                                <div className="relative h-10 w-10 border rounded-lg overflow-hidden bg-white p-1">
                                                    <img src={inst.logoUrl} alt="" className="h-full w-full object-contain" />
                                                </div>
                                            ) : (
                                                <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center font-black text-xs text-muted-foreground">?</div>
                                            )}
                                            <div>
                                                <p className="font-bold text-sm uppercase tracking-tight">{inst.name}</p>
                                                <p className="text-[9px] font-mono text-muted-foreground">{inst.id}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline" className="font-black text-xs px-3">{inst.metrics?.totalStudents || 0}</Badge>
                                    </TableCell>
                                    <TableCell className="text-center text-sm font-medium text-slate-600">
                                        {inst.metrics?.totalStaff || 0}
                                    </TableCell>
                                    <TableCell className="text-center text-sm font-medium text-slate-600">
                                        {inst.metrics?.totalUnits || 0}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="text-sm font-black text-green-600">{inst.metrics?.totalPayments || 0}</span>
                                            <span className="text-[8px] font-bold text-muted-foreground uppercase">Transacciones</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right pr-8">
                                        <div className="flex flex-col items-end">
                                            <span className="text-lg font-black text-primary">
                                                {inst.metrics?.totalRevenue.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })}
                                            </span>
                                            <Badge className="bg-green-100 text-green-700 text-[8px] font-black uppercase mt-1 border-none">Activo</Badge>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <div className="p-4 bg-primary/5 rounded-2xl border border-dashed border-primary/20 flex gap-3 items-center no-print">
                <Info className="h-5 w-5 text-primary shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                    Las métricas mostradas son obtenidas mediante consultas de agregación de servidor (Cheap Aggregations), lo que minimiza el consumo de recursos mientras mantiene una visión de negocio precisa de toda la plataforma.
                </p>
            </div>
        </div>
    );
}
