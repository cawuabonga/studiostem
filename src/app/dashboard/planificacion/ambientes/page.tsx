// This page has been moved to /dashboard/gestion-administrativa/infraestructura
// as part of the infrastructure management refactoring.
// This file can be deleted.

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AmbientesRedirectPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Página Movida</CardTitle>
                <CardDescription>
                    La gestión de ambientes ahora forma parte del módulo de Infraestructura en Gestión Administrativa.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p>Por favor, navegue a la nueva sección para continuar.</p>
            </CardContent>
        </Card>
    );
}
