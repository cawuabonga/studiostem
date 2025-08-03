
"use client";

import { StudentsTable } from "@/components/users/StudentsTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

export default function MatriculaPage() {
    const { instituteId } = useAuth();
    const [dataVersion, setDataVersion] = useState(0);

    const handleDataChange = () => {
        setDataVersion(prev => prev + 1);
    };

    if (!instituteId) {
        return <p>Cargando...</p>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Módulo de Matrícula</CardTitle>
                <CardDescription>
                    Busca y selecciona un estudiante para gestionar su matrícula académica. Desde aquí podrás inscribirlo en las unidades didácticas que le correspondan.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <StudentsTable 
                    key={dataVersion}
                    instituteId={instituteId} 
                    onDataChange={handleDataChange}
                    isMatriculaMode={true}
                />
            </CardContent>
        </Card>
    );
}
