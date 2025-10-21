
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, List, ListPlus } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const modules = [
  {
    title: "Registrar Unidades Didácticas",
    description: "Añadir nuevas unidades de forma individual o mediante una carga masiva.",
    href: "/dashboard/gestion-academica/unidades/register",
    icon: ListPlus,
  },
  {
    title: "Listar y Gestionar Unidades",
    description: "Ver, editar, filtrar y eliminar las unidades didácticas existentes.",
    href: "/dashboard/gestion-academica/unidades/list",
    icon: List,
  },
];

export default function ManageUnitsPage() {
  const { user, loading, hasPermission } = useAuth();
  const router = useRouter();
  
  const canView = hasPermission('academic:unit:manage') || hasPermission('academic:unit:manage:own');

  useEffect(() => {
    if (!loading && !canView) {
      router.push('/dashboard');
    }
  }, [user, loading, router, canView]);

  if (loading || !canView) {
      return <p>Cargando o no autorizado...</p>
  }
  
  return (
    <div className="space-y-6">
       <Card>
        <CardHeader>
          <CardTitle>Módulo de Gestión de Unidades Didácticas</CardTitle>
          <CardDescription>
            Administra los cursos o materias de cada programa de estudio. Selecciona una opción para comenzar.
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
               <CardFooter>
                  <p className="text-sm font-medium text-primary flex items-center">
                    Ir a {module.title} <ArrowRight className="ml-2 h-4 w-4" />
                  </p>
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
