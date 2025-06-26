
"use client";

import { AddProgramForm } from "@/components/programs/AddProgramForm";
import { ProgramsList } from "@/components/programs/ProgramsList";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ManageProgramsPage() {
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
          <CardTitle>Registrar Nuevo Programa de Estudios</CardTitle>
          <CardDescription>
            Complete el formulario para añadir un nuevo programa de estudios al sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <AddProgramForm onProgramAdded={handleDataChange} />
        </CardContent>
      </Card>
      
      <Separator />

      <Card className="flex-grow flex flex-col overflow-hidden">
        <CardHeader>
          <CardTitle>Programas de Estudios Registrados</CardTitle>
          <CardDescription>
            Ver, editar y eliminar los programas existentes en el sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow overflow-y-auto">
          <ProgramsList key={refreshKey} onDataChange={handleDataChange} />
        </CardContent>
      </Card>
    </div>
  );
}
