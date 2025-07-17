
"use client";

import { AddLoginImageForm } from "@/components/admin/AddLoginImageForm";
import { LoginImagesTable } from "@/components/admin/LoginImagesTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ManageLoginImagePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'SuperAdmin')) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleDataChange = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  if (loading || !user || user.role !== 'SuperAdmin') {
    return <p>Cargando o no autorizado...</p>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Subir Nueva Imagen para el Login</CardTitle>
          <CardDescription>
            Sube imágenes que podrán ser utilizadas en la página de inicio de sesión.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AddLoginImageForm onImageUploaded={handleDataChange} />
        </CardContent>
      </Card>
      
      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Galería de Imágenes del Login</CardTitle>
          <CardDescription>
            Gestiona las imágenes disponibles. Establece una como activa o elimina las que ya no necesites.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginImagesTable key={refreshKey} onDataChange={handleDataChange} />
        </CardContent>
      </Card>
    </div>
  );
}
