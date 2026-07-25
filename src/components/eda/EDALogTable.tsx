
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getEDAHistory } from '@/services/eda-service';
import type { DocumentGenerationLog } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FileText, User, Printer, CalendarDays, Loader2, History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function EDALogTable() {
    const { instituteId } = useAuth();
    const { toast } = useToast();
    const [logs, setLogs] = useState<DocumentGenerationLog[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!instituteId) return;
        setLoading(true);
        try {
            const data = await getEDAHistory(instituteId);
            setLogs(data);
        } catch (error) {
            toast({ title: "Error", description: "No se pudo cargar el historial.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [instituteId, toast]);

    useEffect(() => { fetchData(); }, [fetchData]);

    if (loading) return <Skeleton className="h-64 w-full rounded-2xl" />;

    return (
        <Card className="rounded-3xl border shadow-sm overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/50 border-b p-6">
                <div className="flex items-center gap-2">
                    <History className="h-5 w-5 text-primary" />
                    <div>
                        <CardTitle className="text-lg font-black uppercase tracking-tight">Registro de Actividad</CardTitle>
                        <CardDescription>Últimas 50 emisiones de documentos oficiales.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow>
                                <TableHead className="font-black text-[10px] uppercase pl-8 py-4">Fecha y Hora</TableHead>
                                <TableHead className="font-black text-[10px] uppercase">Estudiante</TableHead>
                                <TableHead className="font-black text-[10px] uppercase">Documento</TableHead>
                                <TableHead className="font-black text-[10px] uppercase">Punto de Impresión</TableHead>
                                <TableHead className="text-right font-black text-[10px] uppercase pr-8">Estado</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.length > 0 ? logs.map(log => (
                                <TableRow key={log.id} className="group hover:bg-muted/30 transition-colors">
                                    <TableCell className="pl-8 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black">{format(log.timestamp.toDate(), 'dd/MM/yyyy', { locale: es })}</span>
                                            <span className="text-[10px] font-bold text-muted-foreground">{format(log.timestamp.toDate(), 'HH:mm:ss')}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-primary/5 rounded-lg text-primary">
                                                <User className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-xs uppercase">{log.studentName}</p>
                                                <p className="text-[9px] font-mono text-muted-foreground">{log.studentId}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-3.5 w-3.5 text-blue-500" />
                                            <span className="text-xs font-bold uppercase">{log.templateName}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Printer className="h-3.5 w-3.5 text-slate-400" />
                                            <span className="text-xs font-medium uppercase">{log.printPointId}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right pr-8">
                                        <Badge className="bg-green-100 text-green-700 border-none font-black text-[9px] uppercase">
                                            {log.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-40 text-center text-muted-foreground italic">
                                        No hay registros de emisiones todavía.
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
