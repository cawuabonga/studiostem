
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AccessLogTable } from "@/components/access-control/AccessLogTable";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Settings, History } from "lucide-react";

export default function ControlDeAccesoPage() {
  const { hasPermission, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !hasPermission('admin:access-control:manage')) {
      router.push('/dashboard');
    }
  }, [loading, hasPermission, router]);

  if (loading || !hasPermission('admin:access-control:manage')) {
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
      
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5" />
            <CardTitle className="text-xl">Historial de Eventos</CardTitle>
          </div>
          <CardDescription>
            Registro de todos los eventos de acceso capturados por los lectores.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AccessLogTable />
        </CardContent>
      </Card>
    </div>
  );
}
