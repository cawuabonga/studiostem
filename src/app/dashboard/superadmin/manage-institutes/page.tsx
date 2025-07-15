
"use client";

import { AddInstituteForm } from "@/components/superadmin/AddInstituteForm";
import { InstitutesList } from "@/components/superadmin/InstitutesList";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ManageInstitutesPage() {
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
          <CardTitle>Registrar Nuevo Instituto</CardTitle>
          <CardDescription>
            Complete el formulario para añadir un nuevo instituto a la plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AddInstituteForm onInstituteAdded={handleDataChange} />
        </CardContent>
      </Card>
      
      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Institutos Registrados</CardTitle>
          <CardDescription>
            Ver y gestionar los institutos existentes en el sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InstitutesList key={refreshKey} onDataChange={handleDataChange} />
        </CardContent>
      </Card>
    </div>
  );
}
