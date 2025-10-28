
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";

export default function GeneradorHorariosPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
           <div className="flex items-center gap-4">
             <CalendarDays className="h-8 w-8" />
             <div>
                <CardTitle>Generador de Horarios</CardTitle>
                <CardDescription>
                    Herramienta para la asignación visual de horarios, detección de conflictos y gestión de la carga horaria.
                </CardDescription>
             </div>
           </div>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-12">La herramienta para generar horarios se implementará próximamente en la Fase 2.</p>
        </CardContent>
      </Card>
    </div>
  );
}
