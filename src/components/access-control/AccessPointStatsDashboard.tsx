
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { DailyStats, HourlyStats, OverallStats, AccessPoint, AccessLog } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getAccessPointStats, getAccessPoint, listenToAccessLogs } from '@/config/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Clock, ShieldCheck, ShieldOff, Users } from 'lucide-react';
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';

interface AccessPointStatsDashboardProps {
    accessPointId: string;
}

const StatCard = ({ title, value, icon: Icon, description }: { title: string, value: string | number, icon: React.ElementType, description: string }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
    </Card>
);


export function AccessPointStatsDashboard({ accessPointId }: AccessPointStatsDashboardProps) {
    const { instituteId } = useAuth();
    const { toast } = useToast();
    const [stats, setStats] = useState<{ daily: DailyStats | null; hourly: HourlyStats | null; overall: OverallStats | null }>({ daily: null, hourly: null, overall: null });
    const [accessPoint, setAccessPoint] = useState<AccessPoint | null>(null);
    const [logs, setLogs] = useState<AccessLog[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!instituteId) return;
        try {
            const [fetchedStats, fetchedPoint] = await Promise.all([
                getAccessPointStats(instituteId, accessPointId),
                getAccessPoint(instituteId, accessPointId)
            ]);
            setStats(fetchedStats);
            setAccessPoint(fetchedPoint);
        } catch (error) {
            toast({ title: "Error", description: "No se pudieron cargar las estadísticas.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [instituteId, accessPointId, toast]);

    useEffect(() => {
        fetchData();

        // Setup real-time listener for logs for this specific point
        const unsubscribe = listenToAccessLogs(instituteId, (newLogs) => {
            setLogs(newLogs);
        }, accessPointId);

        return () => unsubscribe();
    }, [fetchData, instituteId, accessPointId]);

    const hourlyChartData = React.useMemo(() => {
        if (!stats.hourly) return [];
        return Array.from({ length: 24 }, (_, i) => ({
            hour: `${i}:00`,
            Accesos: stats.hourly?.byHour[i] || 0,
        }));
    }, [stats.hourly]);


    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-10 w-1/2" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Skeleton className="h-28 w-full" />
                    <Skeleton className="h-28 w-full" />
                    <Skeleton className="h-28 w-full" />
                    <Skeleton className="h-28 w-full" />
                </div>
                <Skeleton className="h-80 w-full" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">{accessPoint?.name}</CardTitle>
                    <CardDescription>{accessPoint?.description || `Estadísticas y registros para el punto de acceso con ID: ${accessPoint?.accessPointId}`}</CardDescription>
                </CardHeader>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Accesos Totales Hoy" value={stats.daily?.total ?? 0} icon={Users} description="Total de intentos de acceso registrados hoy."/>
                <StatCard title="Accesos Permitidos Hoy" value={stats.daily?.permitted ?? 0} icon={ShieldCheck} description="Total de accesos concedidos hoy."/>
                <StatCard title="Accesos Denegados Hoy" value={stats.daily?.denied ?? 0} icon={ShieldOff} description="Total de accesos denegados hoy."/>
                <StatCard title="Hora Pico (Histórico)" value={Object.entries(stats.hourly?.byHour || {}).sort(([,a],[,b]) => b-a)[0]?.[0] + ":00" || "N/A"} icon={Clock} description="La hora con más accesos registrados."/>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Distribución de Accesos por Hora (Histórico)</CardTitle>
                    <CardDescription>Muestra el volumen de accesos a lo largo del día.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                         <BarChart data={hourlyChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="hour" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="Accesos" fill="hsl(var(--primary))" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Registros de Acceso Recientes</CardTitle>
                    <CardDescription>Últimos 50 eventos registrados para este punto de acceso.</CardDescription>
                </CardHeader>
                <CardContent>
                     {/* The AccessLogTable component needs to be adapted or passed logs */}
                     <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fecha y Hora</TableHead>
                                    <TableHead>Usuario</TableHead>
                                    <TableHead>Rol</TableHead>
                                    <TableHead>Estado</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                            {logs.length > 0 ? (
                                logs.map(log => (
                                <TableRow key={log.id}>
                                    <TableCell>{log.timestamp ? format(log.timestamp.toDate(), 'dd/MM/yyyy HH:mm:ss') : 'Fecha inválida'}</TableCell>
                                    <TableCell className="font-medium">{log.userName || 'N/A'}</TableCell>
                                    <TableCell>{log.userRole || 'N/A'}</TableCell>
                                    <TableCell>
                                        <Badge variant={log.status === 'Permitido' ? 'default' : 'destructive'}>
                                            {log.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    Aún no hay registros de acceso para este punto.
                                </TableCell>
                                </TableRow>
                            )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )

}
