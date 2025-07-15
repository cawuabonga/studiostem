

"use client";

import { UserManagementTable } from "@/components/admin/UserManagementTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ManageUsersPage() {
  const { user, loading, instituteId } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'Admin')) {
      router.push('/dashboard'); 
    }
  }, [user, loading, router]);

  if (loading || !user || !instituteId || user.role !== 'Admin') {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Cargando o no autorizado...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Gestionar Usuarios del Instituto</CardTitle>
          <CardDescription>
            Ver y editar la información de los usuarios registrados en tu instituto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserManagementTable instituteId={instituteId} />
        </CardContent>
      </Card>
    </div>
  );
}
