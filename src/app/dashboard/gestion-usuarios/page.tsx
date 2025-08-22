
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { Permission } from "@/types";

const userModules: {title: string; description: string; href: string; icon: React.ElementType; permission: Permission}[] = [
  {
    title: "Listado de Personal",
    description: "Ver y gestionar los perfiles del personal (docentes, administrativos, etc.).",
    href: "/dashboard/gestion-usuarios/listado-personal",
    icon: Users,
    permission: "users:staff:manage",
  },
  {
    title: "Registrar Personal",
    description: "Crear nuevos perfiles para el personal del instituto.",
    href: "/dashboard/gestion-usuarios/registrar-personal",
    icon: UserPlus,
    permission: "users:staff:manage",
  },
   {
    title: "Listado de Estudiantes",
    description: "Ver y gestionar los perfiles de los estudiantes.",
    href: "/dashboard/gestion-usuarios/listado-estudiantes",
    icon: Users,
    permission: "users:student:manage",
  },
  {
    title: "Registrar Estudiante",
    description: "Crear nuevos perfiles para los estudiantes.",
    href: "/dashboard/gestion-usuarios/registrar-estudiante",
    icon: UserPlus,
    permission: "users:student:manage",
  },
];

export default function GestionUsuariosPage() {
  const { user, loading, hasPermission } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !hasPermission('users:staff:manage') && !hasPermission('users:student:manage')) {
      router.push("/dashboard");
    }
  }, [user, loading, hasPermission, router]);
  
  if (loading || !user) {
    return <p>Cargando...</p>;
  }

  const accessibleModules = userModules.filter(module => hasPermission(module.permission));

  return (
    <div className="space-y-6">
       <Card>
        <CardHeader>
          <CardTitle>Módulo de Gestión de Usuarios</CardTitle>
          <CardDescription>
            Administra los perfiles de estudiantes y personal del instituto. Selecciona una opción para comenzar.
          </CardDescription>
        </CardHeader>
      </Card>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
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
         {accessibleModules.length === 0 && (
          <p className="text-center md:col-span-2 text-muted-foreground">No tienes permisos para gestionar usuarios.</p>
        )}
      </div>
    </div>
  );
}
