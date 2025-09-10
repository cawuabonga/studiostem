
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { AccessLog } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { listenToAccessLogs } from '@/config/firebase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from 'date-fns';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AccessLogTable() {
  const { instituteId } = useAuth();
  const { toast } = useToast();
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!instituteId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Set up the real-time listener
    const unsubscribe = listenToAccessLogs(instituteId, (newLogs) => {
      setLogs(newLogs);
      if (loading) setLoading(false); // Set loading to false on first data fetch
    });
    
    // Cleanup function to unsubscribe when the component unmounts
    return () => unsubscribe();

  }, [instituteId]);
  
  if (loading) {
    return (
        <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha y Hora</TableHead>
            <TableHead>Usuario</TableHead>
            <TableHead>Rol</TableHead>
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
                <TableCell className="font-medium">{log.userName || 'N/A'}</TableCell>
                <TableCell>{log.userRole || 'N/A'}</TableCell>
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
                Aún no hay registros de acceso.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
