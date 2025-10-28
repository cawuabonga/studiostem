"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ScheduleTemplateManager } from "@/components/planning/ScheduleTemplateManager";

export default function ConfiguracionHorarioPage() {
  const { user, instituteId, loading, hasPermission } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!loading && !hasPermission('planning:schedule:manage')) {
      router.push('/dashboard/planificacion');
    }
  }, [user, loading, router, hasPermission]);
  
  if (loading || !hasPermission('planning:schedule:manage')) {
      return <p>Cargando o no autorizado...</p>
  }
  
  if (!instituteId) {
    return <p>Cargando instituto...</p>;
  }

  return (
    <Card>
        <CardHeader>
        <CardTitle>Configuración de Plantillas de Horario</CardTitle>
        <CardDescription>
            Crea y administra las plantillas de bloques horarios que se usarán en el generador de horarios de tu instituto.
        </CardDescription>
        </CardHeader>
        <CardContent>
            <ScheduleTemplateManager instituteId={instituteId} />
        </CardContent>
    </Card>
  );
}
