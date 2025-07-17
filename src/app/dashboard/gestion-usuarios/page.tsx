
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus, List, UserCheck } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const userModules = [
  {
    title: "Registrar Estudiantes",
    description: "Crear cuentas individuales para nuevos estudiantes.",
    href: "/dashboard/gestion-usuarios/registrar-estudiante",
    icon: UserPlus,
    roles: ["Admin", "Coordinator"],
  },
  {
    title: "Listado de Estudiantes",
    description: "Ver, editar y gestionar los usuarios con rol de estudiante.",
    href: "/dashboard/gestion-usuarios/listado-estudiantes",
    icon: List,
    roles: ["Admin", "Coordinator"],
  },
   {
    title: "Registrar Personal",
    description: "Crear cuentas para docentes, coordinadores y administradores.",
    href: "/dashboard/gestion-usuarios/registrar-personal",
    icon: UserCheck,
    roles: ["Admin", "Coordinator"],
  },
  {
    title: "Listado de Personal",
    description: "Ver y gestionar los perfiles del personal del instituto.",
    href: "/dashboard/gestion-usuarios/listado-personal",
    icon: Users,
    roles: ["Admin", "Coordinator"],
  },
];

export default function GestionUsuariosPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !["Admin", "Coordinator"].includes(user.role))) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);
  
  const accessibleModules = userModules.filter(module => user?.role && module.roles.includes(user.role));

  if (loading || !user || !["Admin", "Coordinator"].includes(user.role)) {
    return <p>Cargando...</p>;
  }

  return (
    <div className="space-y-6">
       <Card>
        <CardHeader>
          <CardTitle>Módulo de Gestión de Usuarios</CardTitle>
          <CardDescription>
            Administra los usuarios, perfiles y roles de tu instituto. Selecciona una opción para comenzar.
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
      </div>
    </div>
  );
}
