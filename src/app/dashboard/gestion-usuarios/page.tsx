
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InstituteUsersTable } from "@/components/users/InstituteUsersTable";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

export default function GestionUsuariosPage() {
  const { user, instituteId, loading } = useAuth();
  const router = useRouter();
  const [dataVersion, setDataVersion] = useState(0);

  useEffect(() => {
    if (!loading && (!user || !["Admin", "Coordinator"].includes(user.role))) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  const handleDataChange = useCallback(() => {
    setDataVersion(prev => prev + 1);
  }, []);

  if (loading || !user || !instituteId || !["Admin", "Coordinator"].includes(user.role)) {
    return <p>Cargando...</p>;
  }

  return (
    <div className="space-y-6">
       <Card>
        <CardHeader>
          <CardTitle>Usuarios del Instituto</CardTitle>
          <CardDescription>
            Listado de todos los usuarios (estudiantes, docentes, etc.) asignados a este instituto. La edición de roles se realiza a través del SuperAdmin.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <InstituteUsersTable key={dataVersion} instituteId={instituteId} onDataChange={handleDataChange} />
        </CardContent>
      </Card>
    </div>
  );
}
