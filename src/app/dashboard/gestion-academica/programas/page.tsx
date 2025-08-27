
"use client";

import { AddProgramForm } from "@/components/programs/AddProgramForm";
import { ProgramsList } from "@/components/programs/ProgramsList";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ManageProgramsPage() {
  const { user, instituteId, loading, hasPermission } = useAuth();
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Check for specific permission instead of role
    if (!loading && !hasPermission('academic:program:manage')) {
      router.push('/dashboard');
    }
  }, [user, loading, router, hasPermission]);

  const handleDataChange = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };
  
  if (loading || !hasPermission('academic:program:manage')) {
      return <p>Cargando o no autorizado...</p>
  }

  // The layout handles the main loading state for the institute
  if (!instituteId) {
    return <p>Cargando instituto...</p>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Registrar Nuevo Programa de Estudio</CardTitle>
          <CardDescription>
            Añada un nuevo programa de estudio para este instituto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AddProgramForm instituteId={instituteId} onProgramAdded={handleDataChange} />
        </CardContent>
      </Card>
      
      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Programas de Estudio Existentes</CardTitle>
          <CardDescription>
            Ver, editar y eliminar los programas de estudio registrados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProgramsList key={refreshKey} instituteId={instituteId} onDataChange={handleDataChange} />
        </CardContent>
      </Card>
    </div>
  );
}
