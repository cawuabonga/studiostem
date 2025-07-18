
"use client";

import { AllUsersTable } from "@/components/superadmin/AllUsersTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SuperAdminManageUsersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [dataVersion, setDataVersion] = useState(0);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'SuperAdmin')) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleDataChange = () => {
    setDataVersion(prev => prev + 1);
  };
  
  if (loading || !user || user.role !== 'SuperAdmin') {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Cargando o no autorizado...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Gestionar Todos los Usuarios</CardTitle>
          <CardDescription>
            Ver, editar y asignar roles e institutos a todos los usuarios de la plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AllUsersTable key={dataVersion} onDataChange={handleDataChange} />
        </CardContent>
      </Card>
    </div>
  );
}
