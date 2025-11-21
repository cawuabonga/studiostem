
"use client";

import { NewsManager } from "@/components/institute/NewsManager";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";


export default function GestionarNoticiasPage() {
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
        <NewsManager instituteId={instituteId} />
    );
}
