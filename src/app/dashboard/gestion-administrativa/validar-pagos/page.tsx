
"use client";

import { AdminPaymentsDashboard } from "@/components/payments/AdminPaymentsDashboard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PaymentStatus } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ValidatePaymentsPage() {
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
            <Card>
                <CardHeader>
                    <CardTitle>Gestión de Pagos de Estudiantes</CardTitle>
                    <CardDescription>
                       Revisa los pagos pendientes, consulta el historial de pagos aprobados y los que han sido rechazados.
                    </CardDescription>
                </CardHeader>
            </Card>
             <Tabs defaultValue="Pendiente" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="Pendiente">Pendientes de Verificación</TabsTrigger>
                    <TabsTrigger value="Aprobado">Aprobados</TabsTrigger>
                    <TabsTrigger value="Rechazado">Rechazados</TabsTrigger>
                </TabsList>
                <TabsContent value="Pendiente">
                   <AdminPaymentsDashboard status="Pendiente" key="Pendiente" />
                </TabsContent>
                <TabsContent value="Aprobado">
                    <AdminPaymentsDashboard status="Aprobado" key="Aprobado" />
                </TabsContent>
                <TabsContent value="Rechazado">
                    <AdminPaymentsDashboard status="Rechazado" key="Rechazado" />
                </TabsContent>
            </Tabs>
        </div>
    );
}
