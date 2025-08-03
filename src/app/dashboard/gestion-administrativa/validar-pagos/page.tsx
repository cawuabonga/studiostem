
"use client";

import { AdminPaymentsDashboard } from "@/components/payments/AdminPaymentsDashboard";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ValidatePaymentsPage() {

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Validación de Pagos Pendientes</CardTitle>
                    <CardDescription>
                       Revisa los vouchers enviados por los estudiantes, aprueba los que son correctos o rechaza los que tienen problemas.
                    </CardDescription>
                </CardHeader>
            </Card>
            <AdminPaymentsDashboard />
        </div>
    );
}
