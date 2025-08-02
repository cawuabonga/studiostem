
"use client";

import { StudentGradesDashboard } from "@/components/student/StudentGradesDashboard";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function StudentGradesPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Mis Calificaciones</CardTitle>
          <CardDescription>
            Consulta el resumen de tus notas por cada unidad didáctica y explora el detalle de tus calificaciones.
          </CardDescription>
        </CardHeader>
      </Card>
      <StudentGradesDashboard />
    </div>
  );
}
