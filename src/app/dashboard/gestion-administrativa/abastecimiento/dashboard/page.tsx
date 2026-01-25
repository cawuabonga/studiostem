"use client";

import { SupplyDashboard } from "@/components/supplies/SupplyDashboard";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AbastecimientoDashboardPage() {
    const { user, loading, hasPermission } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !hasPermission('admin:supplies:manage')) {
            router.push('/dashboard');
        }
    }, [user, loading, hasPermission, router]);

    if (loading || !hasPermission('admin:supplies:manage')) {
        return <p>Cargando o no autorizado...</p>;
    }

    return <SupplyDashboard />;
}
