
"use client";

import { InventoryReportDashboard } from "@/components/infra/InventoryReportDashboard";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ReporteInventarioPage() {
    const { user, loading, hasPermission } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !hasPermission('admin:infra:manage')) {
            router.push('/dashboard');
        }
    }, [user, loading, hasPermission, router]);

    if (loading || !hasPermission('admin:infra:manage')) {
        return <p>Cargando o no autorizado...</p>;
    }

    return (
        <div className="space-y-6">
            <InventoryReportDashboard />
        </div>
    );
}
