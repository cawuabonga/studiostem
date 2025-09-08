
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AccessLogTable } from "@/components/access-control/AccessLogTable";

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
        <CardHeader>
          <CardTitle>Control de Acceso</CardTitle>
          <CardDescription>
            Historial de todos los eventos de entrada y salida registrados por los puntos de acceso (lectores RFID).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AccessLogTable />
        </CardContent>
      </Card>
    </div>
  );
}
