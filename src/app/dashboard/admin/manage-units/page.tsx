
"use client";

import { AddUnitForm } from "@/components/units/AddUnitForm";
import { UnitsList } from "@/components/units/UnitsList";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ManageUnitsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'Admin')) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleDataChange = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  if (loading || !user || user.role !== 'Admin') {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Cargando o no autorizado...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-6">
      <Card className="flex-shrink-0">
        <CardHeader>
          <CardTitle>Registrar Nueva Unidad Didáctica</CardTitle>
          <CardDescription>
            Complete el formulario para añadir una nueva unidad al sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <AddUnitForm onUnitAdded={handleDataChange} />
        </CardContent>
      </Card>
      
      <Separator />

      <Card className="flex-grow flex flex-col overflow-hidden">
        <CardHeader>
          <CardTitle>Unidades Didácticas Registradas</CardTitle>
          <CardDescription>
            Ver y editar las unidades existentes en el sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow overflow-y-auto">
          <UnitsList key={refreshKey} onUnitUpdated={handleDataChange} />
        </CardContent>
      </Card>
    </div>
  );
}
