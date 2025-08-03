
"use client";

import { StudentPaymentsHistory } from "@/components/payments/StudentPaymentsHistory";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function StudentPaymentsPage() {

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Mi Historial de Pagos</CardTitle>
                    <CardDescription>
                       Aquí puedes ver el estado de todos los pagos que has registrado en el sistema.
                    </CardDescription>
                </CardHeader>
            </Card>
            <StudentPaymentsHistory />
        </div>
    );
}
