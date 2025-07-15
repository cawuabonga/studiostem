
"use client";

import { AddLoginImageForm } from "@/components/admin/AddLoginImageForm";
import { LoginImagesTable } from "@/components/admin/LoginImagesTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ManageLoginImagePage() {
  const { user, loading, instituteId } = useAuth();
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'Admin')) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);
  
  const handleDataChange = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (loading || !user || !instituteId || user.role !== 'Admin') {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Cargando o no autorizado...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Añadir Nueva Imagen de Inicio</CardTitle>
          <CardDescription>
            Sube una imagen desde tu dispositivo. Podrás activarla desde la tabla.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AddLoginImageForm onImageAdded={handleDataChange} instituteId={instituteId} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>Imágenes de Inicio Guardadas</CardTitle>
            <CardDescription>
                Activa o elimina las imágenes disponibles para la página de inicio de sesión.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <LoginImagesTable key={refreshKey} onDataChange={handleDataChange} />
        </CardContent>
      </Card>
    </div>
  );
}
