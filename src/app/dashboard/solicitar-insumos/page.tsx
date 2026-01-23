"use client";

import { SupplyRequestForm } from "@/components/supplies/SupplyRequestForm";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function SolicitarInsumosPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Solicitar Insumos de Almacén</CardTitle>
                <CardDescription>
                    Seleccione los insumos que necesita del catálogo y la cantidad. Su pedido será enviado al encargado de abastecimiento para su aprobación.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <SupplyRequestForm />
            </CardContent>
        </Card>
    );
}

    