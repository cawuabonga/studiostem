
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StudentsTable } from "@/components/users/StudentsTable";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

export default function ListadoEstudiantesPage() {
    const { user, instituteId, loading } = useAuth();
    const router = useRouter();
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        if (!loading && (!user || !["Admin", "Coordinator"].includes(user.role))) {
            router.push('/dashboard');
        }
        if (!loading && !instituteId) {
            router.push('/dashboard/institute');
        }
    }, [user, instituteId, loading, router]);

    const handleDataChange = useCallback(() => {
        setRefreshKey(prevKey => prevKey + 1);
    }, []);

    if (loading || !instituteId || !user) {
        return <p>Cargando...</p>;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Listado de Estudiantes</CardTitle>
                    <CardDescription>
                        Visualiza, busca y gestiona los perfiles de los estudiantes de tu instituto.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <StudentsTable key={refreshKey} onDataChange={handleDataChange} />
                </CardContent>
            </Card>
        </div>
    );
}
