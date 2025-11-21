"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutDashboard, Newspaper, Image as GalleryIcon } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { Permission } from "@/types";

const instituteModules: {title: string; description: string; href: string; icon: React.ElementType; permission: Permission}[] = [
  {
    title: "Perfil Público del Instituto",
    description: "Edita la información que se muestra en la página pública de tu instituto.",
    href: "/dashboard/gestion-instituto/perfil-publico",
    icon: LayoutDashboard,
    permission: "admin:institute:manage",
  },
  {
    title: "Gestionar Noticias",
    description: "Crea y administra las noticias y anuncios para la página pública.",
    href: "#", // To be implemented
    icon: Newspaper,
    permission: "admin:institute:manage",
  },
   {
    title: "Gestionar Galería de Imágenes",
    description: "Sube y organiza álbumes de fotos para mostrar la vida en el campus.",
    href: "#", // To be implemented
    icon: GalleryIcon,
    permission: "admin:institute:manage",
  },
];

export default function GestionInstitutoPage() {
  const { user, loading, hasPermission } = useAuth();
  const router = useRouter();

  const canAccessPage = instituteModules.some(module => hasPermission(module.permission as any));

  useEffect(() => {
    if (!loading && !canAccessPage) { 
      router.push("/dashboard");
    }
  }, [user, loading, hasPermission, router, canAccessPage]);
  
  const accessibleModules = instituteModules.filter(module => hasPermission(module.permission as any));

  if (loading || !user || !canAccessPage) {
    return <p>Cargando...</p>;
  }

  return (
    <div className="space-y-6">
       <Card>
        <CardHeader>
          <CardTitle>Módulo de Gestión del Instituto</CardTitle>
          <CardDescription>
            Administra la información pública y las configuraciones generales de tu instituto.
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
