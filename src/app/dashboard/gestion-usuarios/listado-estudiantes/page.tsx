"use client";

import { StudentsTable } from "@/components/users/StudentsTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ListadoEstudiantesPage() {
    const { instituteId, user, loading, hasPermission } = useAuth();
    const router = useRouter();
    const [dataVersion, setDataVersion] = useState(0);

    useEffect(() => {
        if (!loading && !hasPermission('users:student:manage')) {
            router.push('/dashboard');
        }
    }, [user, loading, hasPermission, router]);

    const handleDataChange = () => {
        setDataVersion(prev => prev + 1);
    };
    
    if (loading || !hasPermission('users:student:manage')) {
        return <p>Cargando o no autorizado...</p>;
    }

    if (!instituteId) {
        return <p>Cargando...</p>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Listado de Estudiantes</CardTitle>
                <CardDescription>
                    Busca, filtra y gestiona los perfiles de estudiantes registrados en el instituto.
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
