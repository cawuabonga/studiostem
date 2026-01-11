
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, History, CheckSquare, Banknote, Fingerprint, Users, PencilRuler, BarChart2, Building, Archive, Library } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { Permission } from "@/types";

interface AdminModule {
    title: string;
    description: string;
    href: string;
    icon: React.ElementType;
    permission: Permission;
}

const adminModules: AdminModule[] = [
   {
    title: "Gestionar Tasas Educativas",
    description: "Crear y administrar los conceptos de pago y sus costos (ej. matrícula, constancias).",
    href: "/dashboard/gestion-administrativa/tasas",
    icon: Banknote,
    permission: "admin:fees:manage",
  },
  {
    title: "Registrar Pago de Tesorería",
    description: "Busca un estudiante por DNI y registra un pago a su nombre.",
    href: "/dashboard/gestion-administrativa/registrar-pago-tesoreria",
    icon: PencilRuler,
    permission: "admin:payments:validate",
  },
  {
    title: "Validación de Pagos",
    description: "Revisar, aprobar o rechazar los vouchers de pago registrados por los estudiantes.",
    href: "/dashboard/gestion-administrativa/validar-pagos",
    icon: CheckSquare,
    permission: "admin:payments:validate",
  },
   {
    title: "Reporte de Ingresos",
    description: "Visualizar estadísticas, gráficos y reportes sobre los ingresos por pagos.",
    href: "/dashboard/gestion-administrativa/reporte-pagos",
    icon: BarChart2,
    permission: "admin:payments:validate",
  },
  {
    title: "Catálogo de Activos",
    description: "Administra los tipos de bienes (mobiliario, equipos) que posee el instituto.",
    href: "/dashboard/gestion-administrativa/catalogo-activos",
    icon: Library,
    permission: "admin:infra:manage",
  },
  {
    title: "Gestionar Infraestructura",
    description: "Administra edificios, ambientes y el inventario de activos físicos del instituto.",
    href: "/dashboard/gestion-administrativa/infraestructura",
    icon: Building,
    permission: "admin:infra:manage",
  },
   {
    title: "Reporte de Inventario",
    description: "Visualiza y filtra todo el inventario de activos físicos del instituto.",
    href: "/dashboard/gestion-administrativa/reporte-inventario",
    icon: Archive,
    permission: "admin:infra:manage",
  },
  {
    title: "Control de Acceso (RFID)",
    description: "Monitorear y ver los registros de entrada y salida del personal y estudiantes.",
    href: "/dashboard/control-de-acceso",
    icon: Fingerprint,
    permission: "admin:access-control:manage",
  },
  {
    title: "Reporte de Asistencia",
    description: "Consultar el historial de asistencia y las horas trabajadas del personal.",
    href: "/dashboard/gestion-administrativa/reporte-asistencia",
    icon: Users,
    permission: "admin:attendance:report",
  }
];

const studentModules = [
  {
    title: "Registrar un Pago",
    description: "Sube tu voucher del banco para registrar un nuevo pago en el sistema.",
    href: "/dashboard/gestion-administrativa/registrar-pago",
    icon: CreditCard,
    permission: "student:payments:manage",
  },
  {
    title: "Historial de Pagos",
    description: "Consulta el estado de todos los pagos que has registrado.",
    href: "/dashboard/gestion-administrativa/mis-pagos",
    icon: History,
    permission: "student:payments:manage",
  },
];


export default function GestionAdministrativaPage() {
    const { user, loading, hasPermission } = useAuth();
    const router = useRouter();

    const canViewPage = adminModules.some(m => hasPermission(m.permission as Permission)) || studentModules.some(m => hasPermission(m.permission as Permission));

    useEffect(() => {
        if (!loading && !canViewPage) {
            router.push("/dashboard");
        }
    }, [user, loading, canViewPage, router]);
    
    if (loading || !user) {
        return <p>Cargando...</p>;
    }
  
    const accessibleModules = user.role === 'Student' 
        ? studentModules.filter(m => hasPermission(m.permission as Permission))
        : adminModules.filter(m => hasPermission(m.permission as Permission));

    if (accessibleModules.length === 0 && !loading) {
        return <p>No tienes permisos para ver este módulo.</p>;
    }

    return (
        <div className="space-y-6">
        <Card>
            <CardHeader>
            <CardTitle>Módulo de Gestión Administrativa y Pagos</CardTitle>
            <CardDescription>
                Administra los procesos de pagos y otros trámites administrativos del instituto.
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
