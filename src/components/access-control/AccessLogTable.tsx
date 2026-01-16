
"use client";

import React from 'react';
import type { AccessLog } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from 'date-fns';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AccessLogTableProps {
  logs: AccessLog[];
  loading: boolean;
}

export function AccessLogTable({ logs, loading }: AccessLogTableProps) {
  
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
    <div className="rounded-md border overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha y Hora</TableHead>
            <TableHead>DNI</TableHead>
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
                <TableCell className="font-mono">{log.userDocumentId || 'N/A'}</TableCell>
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
              <TableCell colSpan={7} className="h-24 text-center">
                Aún no hay registros de acceso que coincidan con los filtros.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
