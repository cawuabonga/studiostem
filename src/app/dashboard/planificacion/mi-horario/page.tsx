
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserClock } from "lucide-react";

export default function MiHorarioPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
             <UserClock className="h-8 w-8" />
            <div>
              <CardTitle>Mi Horario Semanal</CardTitle>
              <CardDescription>
                Aquí podrás visualizar tu horario de clases o de trabajo asignado para la semana actual.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-12">El módulo para visualizar horarios se implementará próximamente en la Fase 2.</p>
        </CardContent>
      </Card>
    </div>
  );
}
