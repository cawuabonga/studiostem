
"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Construction } from 'lucide-react';

export default function MatriculaPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Módulo de Matrícula de Estudiantes</CardTitle>
          <CardDescription>
            Selecciona un programa y período para gestionar la matrícula de los estudiantes en sus unidades didácticas correspondientes.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Alert>
                <Construction className="h-4 w-4" />
                <AlertTitle>¡Módulo en Construcción!</AlertTitle>
                <AlertDescription>
                    La funcionalidad para matricular estudiantes en sus unidades didácticas estará disponible próximamente.
                </AlertDescription>
            </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
