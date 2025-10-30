
"use client";

import { StaffTable } from "@/components/users/StaffTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

export default function ReporteAsistenciaPage() {
    const { instituteId, hasPermission } = useAuth();
    const [dataVersion, setDataVersion] = useState(0);

    const handleDataChange = () => {
        setDataVersion(prev => prev + 1);
    };

    if (!instituteId || !hasPermission('admin:attendance:report')) {
        return <p>Cargando o no autorizado...</p>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Reporte de Asistencia de Personal</CardTitle>
                <CardDescription>
                    Busca y selecciona un miembro del personal para ver su historial de asistencia y horas trabajadas.
                </CardDescription>
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
    );
}
