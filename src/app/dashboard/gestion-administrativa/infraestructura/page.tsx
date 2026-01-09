"use client";

import { BuildingManager } from "@/components/infra/BuildingManager";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function InfraestructuraPage() {
    const { user, instituteId, loading, hasPermission } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !hasPermission('admin:infra:manage')) {
            router.push('/dashboard');
        }
    }, [user, loading, router, hasPermission]);
    
    if (loading || !hasPermission('admin:infra:manage') || !instituteId) {
        return <p>Cargando o no autorizado...</p>
    }

    return (
        <div className="space-y-6">
            <BuildingManager instituteId={instituteId} />
        </div>
    );
}
