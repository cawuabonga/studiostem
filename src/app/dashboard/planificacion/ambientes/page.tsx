
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { EnvironmentManager } from "@/components/planning/EnvironmentManager";

export default function AmbientesPage() {
  const { user, instituteId, loading, hasPermission } = useAuth();
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Only users with this permission can manage environments
    if (!loading && !hasPermission('planning:environment:manage')) {
      router.push('/dashboard');
    }
  }, [user, loading, router, hasPermission]);

  const handleDataChange = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };
  
  if (loading || !hasPermission('planning:environment:manage')) {
      return <p>Cargando o no autorizado...</p>
  }
  
  if (!instituteId) {
    return <p>Cargando instituto...</p>;
  }

  return (
    <Card>
        <CardHeader>
        <CardTitle>Gestionar Ambientes</CardTitle>
        <CardDescription>
            Administra las aulas, laboratorios y otros espacios físicos del instituto.
        </CardDescription>
        </CardHeader>
        <CardContent>
            <EnvironmentManager key={refreshKey} instituteId={instituteId} onDataChange={handleDataChange} />
        </CardContent>
    </Card>
  );
}
