"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DoorClosed, CalendarDays, CalendarClock, Settings2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { Permission } from "@/types";

const planningModules: { title: string; description: string; href: string; icon: React.ElementType; permission: Permission}[] = [
  {
    title: "Gestionar Ambientes",
    description: "Crear, editar y organizar las aulas, laboratorios y oficinas del instituto.",
    href: "/dashboard/planificacion/ambientes",
    icon: DoorClosed,
    permission: "planning:environment:manage",
  },
  {
    title: "Configuración de Horarios",
    description: "Define las plantillas de horas y turnos para el generador de horarios.",
    href: "/dashboard/planificacion/configuracion-horario",
    icon: Settings2,
    permission: "planning:schedule:manage",
  },
  {
    title: "Generar Horarios",
    description: "Asignar unidades didácticas y actividades a docentes, ambientes y bloques horarios.",
    href: "/dashboard/planificacion/generador",
    icon: CalendarDays,
    permission: "planning:schedule:manage",
  },
  {
    title: "Mi Horario",
    description: "Visualiza tu horario de clases o de trabajo semanal.",
    href: "/dashboard/planificacion/mi-horario",
    icon: CalendarClock,
    permission: "planning:schedule:view:own",
  },
];

export default function PlanificacionPage() {
  const { user, loading, hasPermission } = useAuth();
  const router = useRouter();

  // A user can access this page if they can perform any planning task.
  const canAccessPage = planningModules.some(module => hasPermission(module.permission));

  useEffect(() => {
    if (!loading && !canAccessPage) { 
      router.push("/dashboard");
    }
  }, [user, loading, hasPermission, router, canAccessPage]);
  
  const accessibleModules = planningModules.filter(module => hasPermission(module.permission));

  if (loading || !user || !canAccessPage) {
    return <p>Cargando...</p>;
  }

  return (
    <div className="space-y-6">
       <Card>
        <CardHeader>
          <CardTitle>Módulo de Planificación y Horarios</CardTitle>
          <CardDescription>
            Administra los ambientes y la asignación de horarios para docentes y estudiantes.
          </CardDescription>
        </CardHeader>
      </Card>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {accessibleModules.map((module) => (
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
