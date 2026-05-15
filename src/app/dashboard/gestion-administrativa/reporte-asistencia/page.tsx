
"use client";

import { StaffTable } from "@/components/users/StaffTable";
import { StaffMonthlyAttendanceTable } from "@/components/users/StaffMonthlyAttendanceTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { Users, CalendarDays } from "lucide-react";

export default function ReporteAsistenciaPage() {
    const { instituteId, hasPermission } = useAuth();
    const [dataVersion, setDataVersion] = useState(0);

    const handleDataChange = () => {
        setDataVersion(prev => prev + 1);
    };

    if (!instituteId || !hasPermission('admin:attendance:report')) {
        return <p className="p-8">Cargando o no autorizado...</p>;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Reporte de Asistencia de Personal</CardTitle>
                    <CardDescription>
                        Consulte el historial detallado por persona o visualice el consolidado mensual de todo el personal.
                    </CardDescription>
                </CardHeader>
            </Card>

            <Tabs defaultValue="monthly" className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-12 bg-muted/50 p-1">
                    <TabsTrigger value="monthly" className="flex items-center gap-2 font-bold">
                        <CalendarDays className="h-4 w-4" />
                        Consolidado Mensual
                    </TabsTrigger>
                    <TabsTrigger value="individual" className="flex items-center gap-2 font-bold">
                        <Users className="h-4 w-4" />
                        Búsqueda Individual
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="monthly" className="pt-4 space-y-4">
                    <StaffMonthlyAttendanceTable instituteId={instituteId} />
                </TabsContent>

                <TabsContent value="individual" className="pt-4 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Filtros de Búsqueda Individual</CardTitle>
                            <CardDescription>Busca y selecciona un miembro del personal para ver su historial completo de accesos.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <StaffTable 
                                key={dataVersion}
                                instituteId={instituteId} 
                                onDataChange={handleDataChange}
                                isAttendanceReportMode={true}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
