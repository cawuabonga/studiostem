"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Library, Users, ListPlus, Hourglass, ClipboardList, ClipboardEdit, CalendarPlus, FileText, CalendarDays } from "lucide-react";
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
    permission: ["academic:program:manage", "academic:unit:manage:own"],
  },
  {
    title: "Gestionar Períodos Lectivos",
    description: "Define las fechas de inicio y fin de los semestres académicos.",
    href: "/dashboard/gestion-academica/periodos-lectivos",
    icon: CalendarDays,
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
    title: "Gestionar Actividades No Lectivas",
    description: "Crear y administrar el catálogo de actividades (investigación, tutoría, etc.).",
    href: "/dashboard/gestion-academica/actividades-no-lectivas",
    icon: ClipboardEdit,
    permission: "academic:program:manage", 
  },
  {
    title: "Asignar Horas No Lectivas",
    description: "Asignar actividades no lectivas y sus horas al personal docente por período.",
    href: "/dashboard/gestion-academica/asignar-horas-no-lectivas",
    icon: CalendarPlus,
    permission: "academic:assignment:manage",
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
  {
    title: "Reportes de Matrícula",
    description: "Generar e imprimir listas de estudiantes matriculados por unidad y semestre.",
    href: "/dashboard/gestion-academica/reportes/matriculas",
    icon: FileText,
    permission: "academic:enrollment:manage", // Re-using permission, might need a specific one later
  },
];

export default function GestionAcademicaPage() {
  const { user, loading, hasPermission } = useAuth();
  const router = useRouter();

  // A user can access this page if they can perform any academic management task.
  const canAccessPage = academicModules.some(module => {
    const permissions = Array.isArray(module.permission) ? module.permission : [module.permission];
    return permissions.some(p => hasPermission(p as any));
  });

  useEffect(() => {
    if (!loading && !canAccessPage) { 
      router.push("/dashboard");
    }
  }, [user, loading, hasPermission, router, canAccessPage]);
  
  const accessibleModules = academicModules.filter(module => {
      const permissions = Array.isArray(module.permission) ? module.permission : [module.permission];
      return permissions.some(p => hasPermission(p as any));
  });

  if (loading || !user || !canAccessPage) {
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
