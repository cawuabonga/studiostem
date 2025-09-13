"use client";

import React from 'react';
import type { AccessLog } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { ArrowDown, ArrowUp, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';

interface ProfileAccessLogsProps {
    logs: AccessLog[];
    loading: boolean;
}

export function ProfileAccessLogs({ logs, loading }: ProfileAccessLogsProps) {

    if (loading) {
        return (
            <Card className="mt-8 w-full max-w-4xl">
                <CardHeader>
                    <Skeleton className="h-8 w-1/3" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Card className="mt-8 w-full max-w-4xl">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <History className="h-6 w-6" />
                    Historial de Accesos Recientes
                </CardTitle>
                <CardDescription>
                    Últimos 20 eventos de acceso registrados para este perfil.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Fecha y Hora</TableHead>
                            <TableHead>DNI</TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Punto de Acceso</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Estado</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {logs.length > 0 ? (
                            logs.map(log => (
                            <TableRow key={log.id}>
                                <TableCell>{log.timestamp ? format(log.timestamp.toDate(), 'dd/MM/yyyy HH:mm:ss') : 'Fecha inválida'}</TableCell>
                                <TableCell>{log.userDocumentId || 'N/A'}</TableCell>
                                <TableCell>{log.userName || 'N/A'}</TableCell>
                                <TableCell>{log.accessPointName || log.accessPointId}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={cn(log.type === 'Entrada' ? "text-green-600" : "text-blue-600")}>
                                        {log.type === 'Entrada' ? <ArrowDown className="mr-2 h-4 w-4" /> : <ArrowUp className="mr-2 h-4 w-4" />}
                                        {log.type}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={log.status === 'Permitido' ? 'default' : 'destructive'}>
                                        {log.status}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                            ))
                        ) : (
                            <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                                No se encontraron registros de acceso.
                            </TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
