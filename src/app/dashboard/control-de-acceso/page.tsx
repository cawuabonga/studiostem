
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AccessLogTable } from "@/components/access-control/AccessLogTable";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Settings, History, Send } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { processAccessAttemptFlow } from "@/ai/flows/process-access-attempt-flow";
import { listenToAllAccessLogs } from "@/config/firebase";
import type { AccessLog } from "@/types";

function AccessSimulationForm() {
  const [accessPointId, setAccessPointId] = useState("PUERTA-01");
  const [rfidCardId, setRfidCardId] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessPointId || !rfidCardId) {
      toast({
        title: "Campos incompletos",
        description: "Por favor, complete ambos campos.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const result = await processAccessAttemptFlow({ accessPointId, rfidCardId });
      toast({
        title: `Simulación de Acceso: ${result.status === 'success' ? 'Éxito' : 'Error'}`,
        description: `${result.message} (Acción: ${result.action})`,
        variant: result.status === 'success' ? 'default' : 'destructive',
      });
    } catch (error: any) {
      toast({
        title: "Error en la simulación",
        description: error.message || "Ocurrió un error al procesar la solicitud.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Simulador de Acceso RFID</CardTitle>
        <CardDescription>
          Esta herramienta permite probar el `processAccessAttemptFlow` simulando el escaneo de una tarjeta RFID.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="accessPointId">ID Punto de Acceso</Label>
              <Input
                id="accessPointId"
                value={accessPointId}
                onChange={(e) => setAccessPointId(e.target.value)}
                placeholder="Ej: PUERTA-01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rfidCardId">ID Tarjeta RFID</Label>
              <Input
                id="rfidCardId"
                value={rfidCardId}
                onChange={(e) => setRfidCardId(e.target.value)}
                placeholder="Escanee o ingrese un ID de tarjeta"
              />
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Enviar Intento de Acceso
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}


export default function ControlDeAccesoPage() {
  const { hasPermission, loading: authLoading, instituteId } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);

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
    
    const unsubscribe = listenToAllAccessLogs(instituteId, (newLogs) => {
      setLogs(newLogs);
      if (logsLoading) setLogsLoading(false);
    });
    
    return () => unsubscribe();
  }, [instituteId]);

  if (authLoading || !hasPermission('admin:access-control:manage')) {
    return <p>Cargando o no autorizado...</p>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
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

      <AccessSimulationForm />
      
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
        <CardContent>
          <AccessLogTable logs={logs} loading={logsLoading} />
        </CardContent>
      </Card>
    </div>
  );
}
