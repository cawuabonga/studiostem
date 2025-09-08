
"use client";

import { AccessPointManager } from "@/components/access-control/AccessPointManager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";


export default function PuntosDeAccesoPage() {
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
        <Button variant="ghost" asChild>
            <Link href="/dashboard/control-de-acceso">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al Control de Acceso
            </Link>
        </Button>

      <Card>
        <CardHeader>
          <CardTitle>Gestionar Puntos de Acceso</CardTitle>
          <CardDescription>
            Registre, edite o elimine los lectores (Arduinos) utilizados para el control de acceso en el instituto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AccessPointManager />
        </CardContent>
      </Card>
    </div>
  );
}

