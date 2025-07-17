
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { StudentsTable } from "@/components/users/StudentsTable";
import { StaffTable } from "@/components/users/StaffTable";
import { AddStudentForm } from "@/components/users/AddStudentForm";
import { Separator } from "@/components/ui/separator";
import { AddStaffForm } from "@/components/users/AddStaffForm";

export default function ManageUsersPage() {
  const { user, instituteId, loading } = useAuth();
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!loading && (!user || !["Admin", "Coordinator"].includes(user.role))) {
      router.push('/dashboard');
    }
    if (!loading && !instituteId) {
        router.push('/dashboard/institute');
    }
  }, [user, instituteId, loading, router]);

  const handleDataChange = useCallback(() => {
    setRefreshKey(prevKey => prevKey + 1);
  }, []);

  if (loading || !instituteId || !user) {
    return <p>Cargando...</p>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Usuarios del Instituto</CardTitle>
          <CardDescription>
            Administra los perfiles y roles de los estudiantes y el personal de tu instituto.
          </CardDescription>
        </CardHeader>
      </Card>
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">Listado de Usuarios</TabsTrigger>
          <TabsTrigger value="register">Registrar Nuevos Usuarios</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="mt-6">
            <Tabs defaultValue="students" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="students">Estudiantes</TabsTrigger>
                <TabsTrigger value="staff">Personal del Instituto</TabsTrigger>
                </TabsList>
                <TabsContent value="students" className="mt-6">
                <Card>
                    <CardHeader>
                    <CardTitle>Lista de Estudiantes</CardTitle>
                    <CardDescription>
                        Ver y gestionar los usuarios con el rol de estudiante.
                    </CardDescription>
                    </CardHeader>
                    <CardContent>
                    <StudentsTable key={refreshKey} onDataChange={handleDataChange} />
                    </CardContent>
                </Card>
                </TabsContent>
                <TabsContent value="staff" className="mt-6">
                <Card>
                    <CardHeader>
                    <CardTitle>Lista de Personal</CardTitle>
                    <CardDescription>
                        Ver y gestionar los usuarios con roles de Docente, Coordinador y Administrador.
                    </CardDescription>
                    </CardHeader>
                    <CardContent>
                    <StaffTable key={refreshKey} onDataChange={handleDataChange} />
                    </CardContent>
                </Card>
                </TabsContent>
            </Tabs>
        </TabsContent>
        <TabsContent value="register" className="mt-6 space-y-6">
             <Card>
                <CardHeader>
                    <CardTitle>Registrar Nuevo Estudiante</CardTitle>
                    <CardDescription>
                        Crea una cuenta para un nuevo estudiante.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AddStudentForm onUserAdded={handleDataChange} />
                </CardContent>
            </Card>
            <Separator />
            <Card>
                <CardHeader>
                    <CardTitle>Registrar Nuevo Personal</CardTitle>
                    <CardDescription>
                        Crea una cuenta para un nuevo docente o administrativo y asígnale un rol.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AddStaffForm onUserAdded={handleDataChange} />
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
