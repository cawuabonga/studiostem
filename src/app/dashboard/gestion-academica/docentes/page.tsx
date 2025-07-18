
"use client";

import { TeachersList } from "@/components/teachers/TeachersList";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ManageTeachersPage() {
  const { user, instituteId, loading } = useAuth();
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!loading && (!user || !["Admin", "Coordinator"].includes(user.role))) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleDataChange = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  if (!instituteId) {
    return <p>Cargando instituto...</p>;
  }

  return (
    <Card>
        <CardHeader>
        <CardTitle>Docentes Registrados</CardTitle>
        <CardDescription>
            Lista de todo el personal con el rol de 'Docente'. La gestión y registro de perfiles se realiza desde el módulo de 'Gestión de Usuarios'.
        </CardDescription>
        </CardHeader>
        <CardContent>
        <TeachersList key={refreshKey} instituteId={instituteId} onDataChange={handleDataChange} />
        </CardContent>
    </Card>
  );
}
