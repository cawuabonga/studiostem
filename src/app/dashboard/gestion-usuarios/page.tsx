
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const userModules = [
  {
    title: "Administrar Usuarios",
    description: "Gestionar los perfiles de estudiantes y personal del instituto.",
    href: "/dashboard/gestion-usuarios/administrar",
    icon: Users,
    roles: ["Admin", "Coordinator"],
  },
  // Se pueden agregar más módulos aquí en el futuro.
  // {
  //   title: "Carga Masiva de Usuarios",
  //   description: "Registrar múltiples usuarios a la vez usando una plantilla.",
  //   href: "/dashboard/gestion-usuarios/carga-masiva",
  //   icon: UserPlus,
  //   roles: ["Admin", "Coordinator"],
  // },
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
