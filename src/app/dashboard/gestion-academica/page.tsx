
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Library, Users, ListPlus, Hourglass, ClipboardList } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const academicModules = [
  {
    title: "Gestionar Programas de Estudio",
    description: "Crear, editar y organizar los programas académicos del instituto.",
    href: "/dashboard/gestion-academica/programas",
    icon: BookOpen,
    permission: "academic:program:manage",
  },
  {
    title: "Gestionar Unidades Didácticas",
    description: "Administrar los cursos o materias de cada programa de estudio.",
    href: "/dashboard/gestion-academica/unidades",
    icon: Library,
    permission: "academic:program:manage",
  },
  {
    title: "Lista de Docentes",
    description: "Aquí solamente se muestra la lista de los docentes.",
    href: "/dashboard/gestion-academica/docentes",
    icon: Users,
    permission: "academic:teacher:view",
  },
  {
    title: "Asignar Unidades Didácticas",
    description: "Asignar docentes a las unidades didácticas por período académico.",
    href: "/dashboard/gestion-academica/asignaciones",
    icon: ListPlus,
    permission: "academic:assignment:manage",
  },
  {
    title: "Carga Horaria Docente",
    description: "Visualizar la carga horaria de docentes y coordinadores por programa.",
    href: "/dashboard/gestion-academica/carga-horaria",
    icon: Hourglass,
    permission: "academic:workload:view",
  },
  {
    title: "Matricular Estudiantes",
    description: "Inscribir estudiantes en las unidades didácticas por período académico.",
    href: "/dashboard/gestion-academica/matricula",
    icon: ClipboardList,
    permission: "academic:enrollment:manage",
  },
];

export default function GestionAcademicaPage() {
  const { user, loading, hasPermission } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !hasPermission('academic:program:manage')) { // Example broad permission check
      router.push("/dashboard");
    }
  }, [user, loading, hasPermission, router]);
  
  const accessibleModules = academicModules.filter(module => hasPermission(module.permission as any));

  if (loading || !user || !hasPermission('academic:program:manage')) {
    return <p>Cargando...</p>;
  }

  return (
    <div className="space-y-6">
       <Card>
        <CardHeader>
          <CardTitle>Módulo de Gestión Académica</CardTitle>
          <CardDescription>
            Administra los programas, unidades, docentes y asignaciones del instituto. Selecciona una opción para comenzar.
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
