"use client";

import { MySupplyRequests } from "@/components/supplies/MySupplyRequests";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function MisPedidosPage() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Mis Pedidos de Insumos</CardTitle>
                    <CardDescription>
                        Aquí puedes ver el historial y el estado de todas las solicitudes de insumos que has realizado.
                    </CardDescription>
                </CardHeader>
            </Card>
            <MySupplyRequests />
        </div>
    );
}

    