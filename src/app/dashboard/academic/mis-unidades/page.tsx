
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Construction } from "lucide-react";


export default function MisUnidadesPage() {
  
  return (
    <div className="space-y-6">
       <Card>
        <CardHeader>
          <CardTitle>Mis Unidades Didácticas</CardTitle>
          <CardDescription>
            Aquí encontrarás todas las unidades en las que estás matriculado. Selecciona una para ver el contenido del curso.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Alert>
                <Construction className="h-4 w-4" />
                <AlertTitle>¡En Construcción!</AlertTitle>
                <AlertDescription>
                    Próximamente podrás ver aquí todas tus unidades didácticas matriculadas.
                </AlertDescription>
            </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
