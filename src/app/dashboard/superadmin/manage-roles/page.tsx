
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ManageRolesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'SuperAdmin')) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);
  
  if (loading || !user || user.role !== 'SuperAdmin') {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Cargando o no autorizado...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestionar Roles y Permisos</CardTitle>
          <CardDescription>
            Crea, edita y asigna permisos a los diferentes roles de la plataforma para cada instituto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>La implementación del gestor de roles se realizará en el siguiente paso.</p>
        </CardContent>
      </Card>
    </div>
  );
}
