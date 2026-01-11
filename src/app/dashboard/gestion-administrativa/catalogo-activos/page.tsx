
"use client";

import { AssetCatalogManager } from "@/components/infra/AssetCatalogManager";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function CatalogoActivosPage() {
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
            <AssetCatalogManager instituteId={instituteId} />
        </div>
    );
}
