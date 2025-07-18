
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const userModules = [
  {
    title: "Listado de Personal",
    description: "Ver y gestionar los perfiles del personal (docentes, administrativos, etc.).",
    href: "/dashboard/gestion-usuarios/listado-personal",
    icon: Users,
  },
  {
    title: "Registrar Personal",
    description: "Crear nuevos perfiles para el personal del instituto.",
    href: "/dashboard/gestion-usuarios/registrar-personal",
    icon: UserPlus,
  },
   {
    title: "Listado de Estudiantes",
    description: "Ver y gestionar los perfiles de los estudiantes.",
    href: "/dashboard/gestion-usuarios/listado-estudiantes",
    icon: Users,
  },
  {
    title: "Registrar Estudiante",
    description: "Crear nuevos perfiles para los estudiantes.",
    href: "/dashboard/gestion-usuarios/registrar-estudiante",
    icon: UserPlus,
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
  
  if (loading || !user) {
    return <p>Cargando...</p>;
  }

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
        {userModules.map((module) => (
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
