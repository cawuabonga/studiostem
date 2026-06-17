
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getInstitutes, getInstituteMetrics } from '@/config/firebase';
import type { Institute, InstituteMetrics } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Activity, Users, GraduationCap, DollarSign, Loader2, RefreshCw, BarChart3, TrendingUp, Info, UserCheck, ShieldCheck, Briefcase } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';

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
            <div className="text-2xl font-bold">{value}</div>
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
                acc.totalStudents += inst.metrics.totalStudents;
                acc.totalStaff += inst.metrics.totalStaff;
                acc.activeToday += (inst.metrics.activeToday?.total || 0);
                acc.activeStudents += (inst.metrics.activeToday?.student || 0);
                acc.activeTeachers += (inst.metrics.activeToday?.teacher || 0);
            }
            return acc;
        }, { totalStudents: 0, totalStaff: 0, activeToday: 0, activeStudents: 0, activeTeachers: 0 });
    }, [institutes]);

    const chartData = useMemo(() => {
        return institutes
            .filter(i => i.metrics)
            .map(inst => ({
                name: inst.name.length > 15 ? inst.name.substring(0, 15) + '...' : inst.name,
                "Activos Hoy": inst.metrics!.activeToday?.total || 0,
                "Total Alumnos": inst.metrics!.totalStudents,
            }))
            .sort((a, b) => b["Activos Hoy"] - a["Activos Hoy"]);
    }, [institutes]);

    const distributionData = useMemo(() => {
        return [
            { name: 'Estudiantes', value: globalStats.activeStudents },
            { name: 'Docentes', value: globalStats.activeTeachers },
            { name: 'Otros', value: globalStats.activeToday - globalStats.activeStudents - globalStats.activeTeachers }
        ].filter(d => d.value > 0);
    }, [globalStats]);

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
            {/* Cabecera de Resumen de Adopción */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard title="Usuarios Activos Hoy" value={globalStats.activeToday.toLocaleString()} icon={UserCheck} description="Total de Sesiones Únicas hoy" />
                <StatCard title="Estudiantes en Plataforma" value={globalStats.totalStudents.toLocaleString()} icon={Users} description="Alumnos registrados" />
                <StatCard title="Docentes Activos" value={globalStats.activeTeachers.toLocaleString()} icon={GraduationCap} description="Sesiones de docentes hoy" />
                <StatCard title="Salud de Adopción" value={`${globalStats.totalStudents > 0 ? Math.round((globalStats.activeStudents / globalStats.totalStudents) * 100) : 0}%`} icon={Activity} description="Tasa de uso estudiantil" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Gráfico de Actividad Diaria */}
                <Card className="lg:col-span-8 shadow-xl border-primary/5 rounded-3xl">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-primary" /> Actividad por Instituto (Hoy)
                            </CardTitle>
                            <CardDescription>Sesiones únicas detectadas en las últimas 24 horas.</CardDescription>
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
                                <Legend verticalAlign="top" align="right" height={36}/>
                                <Bar dataKey="Activos Hoy" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} barSize={45} />
                                <Bar dataKey="Total Alumnos" fill="hsl(var(--muted))" radius={[8, 8, 0, 0]} barSize={45} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Pie Chart: Mix de Usuarios */}
                <Card className="lg:col-span-4 shadow-xl border-primary/5 rounded-3xl">
                    <CardHeader>
                        <CardTitle className="text-lg font-black uppercase tracking-tight">Mix de Usuarios</CardTitle>
                        <CardDescription>Distribución de sesiones activas hoy.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px] flex flex-col items-center">
                        {distributionData.length > 0 ? (
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
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full opacity-20">
                                <Users className="h-12 w-12" />
                                <p className="text-[10px] font-black uppercase">Sin actividad</p>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-2 w-full mt-4">
                            {distributionData.map((entry, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                    <span className="text-[9px] font-black uppercase truncate">{entry.name}: {entry.value}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Matriz de Adopción Detallada */}
            <Card className="shadow-2xl border-none rounded-3xl overflow-hidden">
                <CardHeader className="bg-muted/30 pb-6 border-b">
                    <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-primary" /> Matriz de Adopción por Rol
                    </CardTitle>
                    <CardDescription>Usuarios únicos que han interactuado hoy con la plataforma.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow>
                                <TableHead className="font-black text-[10px] uppercase pl-8 py-4">Institución</TableHead>
                                <TableHead className="text-center font-black text-[10px] uppercase">Estudiantes Hoy</TableHead>
                                <TableHead className="text-center font-black text-[10px] uppercase">Docentes Hoy</TableHead>
                                <TableHead className="text-center font-black text-[10px] uppercase">Admin Hoy</TableHead>
                                <TableHead className="text-center font-black text-[10px] uppercase">Egresados/Emp.</TableHead>
                                <TableHead className="text-right font-black text-[10px] uppercase pr-8">Total Activos</TableHead>
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
                                        <div className="flex flex-col items-center">
                                            <span className="text-sm font-black text-blue-600">{inst.metrics?.activeToday?.student || 0}</span>
                                            <span className="text-[8px] font-bold text-muted-foreground uppercase">de {inst.metrics?.totalStudents || 0}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="text-sm font-black text-green-600">{inst.metrics?.activeToday?.teacher || 0}</span>
                                            <span className="text-[8px] font-bold text-muted-foreground uppercase">Sesiones</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                         <Badge variant="outline" className="font-black text-xs">{inst.metrics?.activeToday?.admin || 0}</Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className="text-xs font-bold text-slate-500">
                                            {(inst.metrics?.activeToday?.graduate || 0) + (inst.metrics?.activeToday?.company || 0)}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right pr-8">
                                        <div className="flex flex-col items-end">
                                            <span className="text-xl font-black text-primary">
                                                {inst.metrics?.activeToday?.total || 0}
                                            </span>
                                            <Badge className="bg-green-100 text-green-700 text-[8px] font-black uppercase mt-1 border-none">Online Hoy</Badge>
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
                    La métrica de **"Total Activos"** representa usuarios únicos diarios (DAU). El sistema utiliza una estrategia de rastreo pasivo que minimiza el consumo de lecturas/escrituras, cumpliendo con los estándares de eficiencia de la plataforma.
                </p>
            </div>
        </div>
    );
}
