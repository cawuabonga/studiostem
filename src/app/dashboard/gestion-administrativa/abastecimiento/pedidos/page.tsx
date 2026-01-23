"use client";

import { AdminSupplyRequestsList } from "@/components/supplies/AdminSupplyRequestsList";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function GestionPedidosPage() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Gestión de Pedidos de Insumos</CardTitle>
                    <CardDescription>
                       Revise, apruebe, rechace y gestione la entrega de las solicitudes de insumos del personal.
                    </CardDescription>
                </CardHeader>
            </Card>
            <AdminSupplyRequestsList />
        </div>
    );
}
