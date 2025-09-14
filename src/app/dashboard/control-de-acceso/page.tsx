
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { AccessLogTable } from "@/components/access-control/AccessLogTable";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Settings, History } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { listenToAllAccessLogs } from "@/config/firebase";
import type { AccessLog } from "@/types";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import type { DateRange } from "react-day-picker";

export default function ControlDeAccesoPage() {
  const { hasPermission, loading: authLoading, instituteId } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [dniSearch, setDniSearch] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  useEffect(() => {
    if (!authLoading && !hasPermission('admin:access-control:manage')) {
      router.push('/dashboard');
    }
  }, [authLoading, hasPermission, router]);

  useEffect(() => {
    if (!instituteId) {
      setLogsLoading(false);
      return;
    }

    setLogsLoading(true);
    
    // This listener fetches the last 50 logs initially. Filtering is done on the client.
    // For larger datasets, a more complex querying strategy would be needed.
    const unsubscribe = listenToAllAccessLogs(instituteId, (newLogs) => {
      setLogs(newLogs);
      setLogsLoading(false);
    });
    
    return () => unsubscribe();
  }, [instituteId]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const isDniMatch = dniSearch ? log.userDocumentId?.includes(dniSearch) : true;
      const isDateMatch = dateRange?.from && dateRange?.to
        ? log.timestamp.toDate() >= dateRange.from && log.timestamp.toDate() <= dateRange.to
        : true;
      return isDniMatch && isDateMatch;
    });
  }, [logs, dniSearch, dateRange]);


  if (authLoading || !hasPermission('admin:access-control:manage')) {
    return <p>Cargando o no autorizado...</p>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
                <CardTitle>Control de Acceso</CardTitle>
                <CardDescription>
                    Monitorea los eventos de entrada/salida y gestiona los puntos de acceso (lectores RFID).
                </CardDescription>
            </div>
            <Button asChild>
                <Link href="/dashboard/control-de-acceso/puntos-de-acceso">
                    <Settings className="mr-2 h-4 w-4" />
                    Gestionar Puntos de Acceso
                </Link>
            </Button>
        </CardHeader>
      </Card>
      
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5" />
            <CardTitle className="text-xl">Historial de Eventos</CardTitle>
          </div>
          <CardDescription>
            Registro de todos los eventos de acceso capturados por los lectores en tiempo real.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full md:w-auto">
              <Label htmlFor="dni-search">Buscar por DNI</Label>
              <Input
                id="dni-search"
                placeholder="Ingrese un DNI para filtrar..."
                value={dniSearch}
                onChange={(e) => setDniSearch(e.target.value)}
              />
            </div>
            <div className="flex-1 w-full md:w-auto">
              <Label>Filtrar por Fecha</Label>
               <DateRangePicker 
                date={dateRange}
                onDateChange={setDateRange}
                className="w-full"
              />
            </div>
          </div>
          <AccessLogTable logs={filteredLogs} loading={logsLoading} />
        </CardContent>
      </Card>
    </div>
  );
}
