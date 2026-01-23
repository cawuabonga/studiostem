
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Archive, Edit, List, PlusCircle } from "lucide-react";
import Link from "next/link";

const modules = [
  {
    title: "Catálogo de Insumos",
    description: "Crear y administrar los tipos de insumos (papel, toner, etc.) disponibles en el instituto.",
    href: "/dashboard/gestion-administrativa/abastecimiento/catalogo",
    icon: List,
  },
  {
    title: "Gestión de Stock",
    description: "Ver el inventario actual y registrar la entrada de nuevos insumos (compras).",
    href: "/dashboard/gestion-administrativa/abastecimiento/stock",
    icon: Archive,
  },
  {
    title: "Gestionar Pedidos",
    description: "Revisar, aprobar y despachar las solicitudes de insumos realizadas por el personal.",
    href: "/dashboard/gestion-administrativa/abastecimiento/pedidos",
    icon: Edit,
  },
   {
    title: "Registrar Entrega Directa",
    description: "Registra la entrega de insumos a un personal sin necesidad de una solicitud previa.",
    href: "/dashboard/gestion-administrativa/abastecimiento/entrega-directa",
    icon: PlusCircle,
  },
];

export default function AbastecimientoPage() {
  return (
    <div className="space-y-6">
       <Card>
        <CardHeader>
          <CardTitle>Módulo de Abastecimiento</CardTitle>
          <CardDescription>
            Gestión centralizada del catálogo de insumos, inventario y solicitudes del personal.
          </CardDescription>
        </CardHeader>
      </Card>
      <div className="grid gap-6 md:grid-cols-2">
        {modules.map((module) => (
          <Link href={module.href} key={module.title} className="flex">
            <Card className="flex flex-col w-full hover:bg-muted/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium">
                  {module.title}
                </CardTitle>
                <module.icon className="h-6 w-6 text-muted-foreground" />
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground">
                  {module.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
