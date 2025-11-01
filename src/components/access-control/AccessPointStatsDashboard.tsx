
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { AccessPoint, AccessLog } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getAccessPoint, listenToAccessLogsForPoint } from '@/config/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart as BarChartIcon, Clock, ShieldCheck, ShieldOff, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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
    const [accessPoint, setAccessPoint] = useState<AccessPoint | null>(null);
    const [logs, setLogs] = useState<AccessLog[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!instituteId) return;
        setLoading(true);
        try {
            const fetchedPoint = await getAccessPoint(instituteId, accessPointId);
            setAccessPoint(fetchedPoint);
        } catch (error) {
            toast({ title: "Error", description: "No se pudo cargar la información del punto de acceso.", variant: "destructive" });
        }
    }, [instituteId, accessPointId, toast]);

    useEffect(() => {
        fetchData();
        const unsubscribe = listenToAccessLogsForPoint(instituteId, accessPointId, (newLogs) => {
            setLogs(newLogs);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [fetchData, instituteId, accessPointId]);

    const stats = useMemo(() => {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        const todayLogs = logs.filter(log => log.timestamp.toDate().toISOString().startsWith(todayStr));
        const totalToday = todayLogs.length;
        const permittedToday = todayLogs.filter(log => log.status === 'Permitido').length;
        const deniedToday = todayLogs.filter(log => log.status === 'Denegado').length;

        const hourlyCounts: Record<string, number> = {};
        for(let i=0; i<24; i++) { hourlyCounts[i] = 0; }
        logs.forEach(log => {
            const hour = log.timestamp.toDate().getHours();
            hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;
        });

        const peakHour = Object.entries(hourlyCounts).sort(([,a],[,b]) => b-a)[0]?.[0] || "N/A";
        
        return {
            totalToday,
            permittedToday,
            deniedToday,
            hourlyCounts,
            peakHour
        };
    }, [logs]);

    const hourlyChartData = React.useMemo(() => {
        return Array.from({ length: 24 }, (_, i) => ({
            hour: `${i}:00`,
            Accesos: stats.hourlyCounts[i] || 0,
        }));
    }, [stats.hourlyCounts]);


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
                <StatCard title="Accesos Totales Hoy" value={stats.totalToday} icon={Users} description="Total de intentos de acceso registrados hoy."/>
                <StatCard title="Accesos Permitidos Hoy" value={stats.permittedToday} icon={ShieldCheck} description="Total de accesos concedidos hoy."/>
                <StatCard title="Accesos Denegados Hoy" value={stats.deniedToday} icon={ShieldOff} description="Total de accesos denegados hoy."/>
                <StatCard title="Hora Pico (Histórico)" value={stats.peakHour + ":00"} icon={Clock} description="La hora con más accesos registrados."/>
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
                     {loading ? <Skeleton className="h-48 w-full"/> : (
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
                     )}
                </CardContent>
            </Card>
        </div>
    )

}

    
