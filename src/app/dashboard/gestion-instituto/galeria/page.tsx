"use client";

import { AlbumManager } from "@/components/institute/AlbumManager";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";


export default function GestionarGaleriaPage() {
    const { user, instituteId, loading, hasPermission } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !hasPermission('admin:institute:manage')) {
            router.push('/dashboard');
        }
    }, [user, loading, router, hasPermission]);
    
    if (loading || !hasPermission('admin:institute:manage') || !instituteId) {
        return <p>Cargando o no autorizado...</p>
    }

    return (
        <AlbumManager instituteId={instituteId} />
    );
}
