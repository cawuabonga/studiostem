
"use client";

import { UnitsList } from "@/components/units/UnitsList";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function ListUnitsPage() {
  const { user, instituteId, loading, hasPermission } = useAuth();
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);

  const canView = hasPermission('academic:unit:manage') || hasPermission('academic:unit:manage:own');

  useEffect(() => {
    if (!loading && !canView) {
      router.push('/dashboard');
    }
  }, [user, loading, router, canView]);

  const handleDataChange = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };
  
  if (loading || !canView) {
      return <p>Cargando o no autorizado...</p>
  }

  if (!instituteId) {
    return <p>Cargando instituto...</p>;
  }

  return (
    <div className="space-y-6">
        <Button variant="ghost" asChild>
            <Link href="/dashboard/gestion-academica/unidades">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al Menú de Unidades
            </Link>
        </Button>
      <Card>
        <CardHeader>
          <CardTitle>Unidades Didácticas Registradas</CardTitle>
          <CardDescription>
            Ver, editar y eliminar las unidades existentes en el instituto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UnitsList key={refreshKey} onDataChange={handleDataChange} />
        </CardContent>
      </Card>
    </div>
  );
}
