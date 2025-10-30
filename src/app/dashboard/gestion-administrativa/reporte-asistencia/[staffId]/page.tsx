
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { StaffAttendanceDetail } from "@/components/users/StaffAttendanceDetail";

export default function StaffAttendanceDetailPage() {
    const { hasPermission } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const staffId = pathname.split('/').pop() || '';
    
    useEffect(() => {
      if (!hasPermission('admin:attendance:report')) {
        router.push('/dashboard');
      }
    }, [hasPermission, router]);

    if (!hasPermission('admin:attendance:report')) {
        return <p>Cargando o no autorizado...</p>;
    }

    if (!staffId) {
        return (
            <div>
                 <Button variant="ghost" onClick={() => router.push('/dashboard/gestion-administrativa/reporte-asistencia')} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver al listado
                </Button>
                <p>No se ha proporcionado un ID de personal.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <Button variant="ghost" onClick={() => router.push('/dashboard/gestion-administrativa/reporte-asistencia')} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al listado del personal
            </Button>
            <StaffAttendanceDetail staffId={staffId} />
        </div>
    );
}
