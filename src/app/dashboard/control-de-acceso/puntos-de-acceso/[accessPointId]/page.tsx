
"use client";

import { AccessPointStatsDashboard } from "@/components/access-control/AccessPointStatsDashboard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";


export default function AccessPointDetailPage() {
  const { hasPermission, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const accessPointId = pathname.split('/').pop() || '';

  useEffect(() => {
    if (!loading && !hasPermission('admin:access-control:manage')) {
      router.push('/dashboard');
    }
  }, [loading, hasPermission, router]);

  if (loading || !hasPermission('admin:access-control:manage')) {
    return <p>Cargando o no autorizado...</p>
  }
  
  if (!accessPointId) {
      return <p>ID de Punto de Acceso no encontrado.</p>
  }

  return (
    <div className="space-y-6">
        <Button variant="ghost" asChild>
            <Link href="/dashboard/control-de-acceso/puntos-de-acceso">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a Puntos de Acceso
            </Link>
        </Button>
        <AccessPointStatsDashboard accessPointId={accessPointId} />
    </div>
  );
}
