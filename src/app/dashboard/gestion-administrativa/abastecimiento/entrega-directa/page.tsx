"use client";

import { DirectDeliveryForm } from "@/components/supplies/DirectDeliveryForm";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function EntregaDirectaPage() {
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

    return <DirectDeliveryForm />;
}
