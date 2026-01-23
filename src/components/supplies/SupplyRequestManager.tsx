

"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminSupplyRequestsList } from './AdminSupplyRequestsList';

export function SupplyRequestManager() {
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
             <Tabs defaultValue="Pendiente" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="Pendiente">Pendientes</TabsTrigger>
                    <TabsTrigger value="Aprobado">Aprobados</TabsTrigger>
                    <TabsTrigger value="Entregado">Entregados</TabsTrigger>
                    <TabsTrigger value="Rechazado">Rechazados</TabsTrigger>
                </TabsList>
                <TabsContent value="Pendiente">
                   <AdminSupplyRequestsList status="Pendiente" key="Pendiente" />
                </TabsContent>
                <TabsContent value="Aprobado">
                    <AdminSupplyRequestsList status="Aprobado" key="Aprobado" />
                </TabsContent>
                 <TabsContent value="Entregado">
                    <AdminSupplyRequestsList status="Entregado" key="Entregado" />
                </TabsContent>
                <TabsContent value="Rechazado">
                    <AdminSupplyRequestsList status="Rechazado" key="Rechazado" />
                </TabsContent>
            </Tabs>
        </div>
    );
}
