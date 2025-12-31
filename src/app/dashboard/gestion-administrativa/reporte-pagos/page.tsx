
"use client";

import { PaymentsReportDashboard } from "@/components/payments/PaymentsReportDashboard";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PaymentsReportPage() {
    const { user, loading, hasPermission } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !hasPermission('admin:payments:validate')) {
            router.push('/dashboard');
        }
    }, [user, loading, hasPermission, router]);

    if (loading || !hasPermission('admin:payments:validate')) {
        return <p>Cargando o no autorizado...</p>;
    }

    return (
        <div className="space-y-6">
            <PaymentsReportDashboard />
        </div>
    );
}
