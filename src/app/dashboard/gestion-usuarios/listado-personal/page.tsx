
"use client";

import { StaffTable } from "@/components/users/StaffTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";


export default function ListadoPersonalPage() {
    const { instituteId } = useAuth();
    const [dataVersion, setDataVersion] = useState(0);

    const handleDataChange = () => {
        setDataVersion(prev => prev + 1);
    };
    
    if (!instituteId) return <p>Cargando...</p>;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Listado de Personal</CardTitle>
                <CardDescription>
                    Perfiles de personal (docentes, administrativos, etc.) registrados en el instituto.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <StaffTable 
                    key={dataVersion}
                    instituteId={instituteId} 
                    onDataChange={handleDataChange}
                />
            </CardContent>
        </Card>
    );
}
