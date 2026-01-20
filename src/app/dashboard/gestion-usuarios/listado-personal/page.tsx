"use client";

import { StaffTable } from "@/components/users/StaffTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";


export default function ListadoPersonalPage() {
    const { instituteId, user, loading, hasPermission } = useAuth();
    const router = useRouter();
    const [dataVersion, setDataVersion] = useState(0);

    useEffect(() => {
        if (!loading && !hasPermission('users:staff:manage')) {
            router.push('/dashboard');
        }
    }, [user, loading, hasPermission, router]);

    const handleDataChange = () => {
        setDataVersion(prev => prev + 1);
    };
    
    if (loading || !hasPermission('users:staff:manage')) {
        return <p>Cargando o no autorizado...</p>;
    }
    
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
