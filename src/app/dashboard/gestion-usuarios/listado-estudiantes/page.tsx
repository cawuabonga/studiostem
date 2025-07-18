
"use client";

import { StudentsTable } from "@/components/users/StudentsTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

export default function ListadoEstudiantesPage() {
    const { instituteId } = useAuth();
    const [dataVersion, setDataVersion] = useState(0);

    const handleDataChange = () => {
        setDataVersion(prev => prev + 1);
    };

    if (!instituteId) return <p>Cargando...</p>;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Listado de Estudiantes</CardTitle>
                <CardDescription>
                    Perfiles de estudiantes registrados en el instituto.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <StudentsTable 
                    key={dataVersion}
                    instituteId={instituteId} 
                    onDataChange={handleDataChange} 
                />
            </CardContent>
        </Card>
    );
}
