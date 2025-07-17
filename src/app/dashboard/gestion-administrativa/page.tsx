
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function GestionAdministrativaPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && (!user || !["Admin", "Coordinator"].includes(user.role))) {
            router.push("/dashboard");
        }
    }, [user, loading, router]);
    
    if (loading || !user || !["Admin", "Coordinator"].includes(user.role)) {
        return <p>Cargando...</p>;
    }


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestión Administrativa</CardTitle>
          <CardDescription>
            Gestiona los recursos, personal y otros aspectos administrativos del instituto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>El contenido de este módulo se implementará próximamente.</p>
        </CardContent>
      </Card>
    </div>
  );
}
