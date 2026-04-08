
"use client";

import { ScheduleViewer } from "@/components/planning/ScheduleViewer";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarClock } from "lucide-react";

export default function MiHorarioPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
             <div className="p-3 bg-primary rounded-lg text-primary-foreground">
                <CalendarClock className="h-8 w-8" />
             </div>
            <div>
              <CardTitle className="text-2xl">Mi Horario Personal</CardTitle>
              <CardDescription>
                Visualiza tu programación semanal de clases y laboratorios asignados para el periodo actual.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
      
      <ScheduleViewer />
    </div>
  );
}
