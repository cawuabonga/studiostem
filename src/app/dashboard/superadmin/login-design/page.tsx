
"use client";

import { LoginDesignForm } from "@/components/superadmin/LoginDesignForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginDesignPage() {
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
          <CardTitle>Personalizar Diseño de la Página de Inicio de Sesión</CardTitle>
          <CardDescription>
            Ajusta la apariencia de la página de login para todos los usuarios. Los cambios se aplicarán globalmente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginDesignForm key={refreshKey} onSettingsSaved={handleDataChange} />
        </CardContent>
      </Card>
    </div>
  );
}
