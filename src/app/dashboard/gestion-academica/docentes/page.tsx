
"use client";

import { AddTeacherForm } from "@/components/teachers/AddTeacherForm";
import { TeachersList } from "@/components/teachers/TeachersList";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
     <Tabs defaultValue="list" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="list">Listado de Docentes</TabsTrigger>
        <TabsTrigger value="register">Registrar Docente</TabsTrigger>
      </TabsList>
      <TabsContent value="list" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Docentes Registrados</CardTitle>
            <CardDescription>
              Lista de todo el personal con el rol de 'Docente'. La carga masiva se realiza desde el módulo de Gestión de Usuarios.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TeachersList key={refreshKey} instituteId={instituteId} onDataChange={handleDataChange} />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="register" className="mt-6">
        <Card>
            <CardHeader>
            <CardTitle>Registrar Nuevo Docente (Individual)</CardTitle>
            <CardDescription>
                Añada un nuevo perfil de personal con el rol de 'Docente'. El perfil podrá ser reclamado por el usuario correspondiente.
            </CardDescription>
            </CardHeader>
            <CardContent>
                <AddTeacherForm instituteId={instituteId} onTeacherAdded={handleDataChange} />
            </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
