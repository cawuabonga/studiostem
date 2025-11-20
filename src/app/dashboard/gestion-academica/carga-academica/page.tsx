"use client";

import { AcademicLoadDashboard } from "@/components/academic-load/AcademicLoadDashboard";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function CargaAcademicaPage() {
    const { user, loading, hasPermission } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !hasPermission('academic:load:view')) {
            router.push('/dashboard');
        }
    }, [user, loading, hasPermission, router]);

    if (loading || !hasPermission('academic:load:view')) {
        return <p>Cargando o no autorizado...</p>;
    }

    return (
        <div className="space-y-6">
            <AcademicLoadDashboard />
        </div>
    );
}
