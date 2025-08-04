
"use client";

import { StudentPaymentsHistory } from "@/components/payments/StudentPaymentsHistory";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function StudentPaymentsPage() {

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Mi Historial de Pagos</CardTitle>
                    <CardDescription>
                       Aquí puedes ver el estado de todos los pagos que has registrado en el sistema, organizados por estado.
                    </CardDescription>
                </CardHeader>
            </Card>
            <Tabs defaultValue="Pendiente" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="Pendiente">Pendientes</TabsTrigger>
                    <TabsTrigger value="Aprobado">Aprobados</TabsTrigger>
                    <TabsTrigger value="Rechazado">Rechazados</TabsTrigger>
                </TabsList>
                <TabsContent value="Pendiente">
                   <StudentPaymentsHistory status="Pendiente" key="Pendiente" />
                </TabsContent>
                <TabsContent value="Aprobado">
                    <StudentPaymentsHistory status="Aprobado" key="Aprobado" />
                </TabsContent>
                <TabsContent value="Rechazado">
                    <StudentPaymentsHistory status="Rechazado" key="Rechazado" />
                </TabsContent>
            </Tabs>
        </div>
    );
}
