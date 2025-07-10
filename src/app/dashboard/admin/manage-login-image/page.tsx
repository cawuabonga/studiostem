
"use client";

import { UpdateLoginImageForm } from "@/components/admin/UpdateLoginImageForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ManageLoginImagePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'Admin')) {
      router.push('/dashboard'); // Redirect if not admin or not logged in
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== 'Admin') {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Cargando o no autorizado...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Gestionar Imagen de Inicio de Sesión</CardTitle>
          <CardDescription>
            Actualiza la imagen que se muestra en las páginas de inicio de sesión y registro.
            Ingresa una URL de imagen válida.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UpdateLoginImageForm />
        </CardContent>
      </Card>
    </div>
  );
}
