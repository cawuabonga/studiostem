
"use client";

import { AddUnitForm } from "@/components/units/AddUnitForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ManageUnitsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'Admin')) {
      router.push('/dashboard'); // Redirect if not admin or not logged in
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== 'Admin') {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Cargando o no autorizado...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Registrar Unidad Didáctica</CardTitle>
          <CardDescription>
            Complete el formulario para añadir una nueva unidad didáctica al sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AddUnitForm />
        </CardContent>
      </Card>
    </div>
  );
}
