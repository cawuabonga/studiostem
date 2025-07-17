
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddStaffForm } from "@/components/users/AddStaffForm";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

export default function RegistrarPersonalPage() {
    const { user, instituteId, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && (!user || !["Admin", "Coordinator"].includes(user.role))) {
            router.push('/dashboard');
        }
        if (!loading && !instituteId) {
            router.push('/dashboard/institute');
        }
    }, [user, instituteId, loading, router]);

    const handleDataChange = useCallback(() => {
        console.log("Staff member added");
    }, []);

    if (loading || !instituteId || !user) {
        return <p>Cargando...</p>;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Registrar Nuevo Personal</CardTitle>
                    <CardDescription>
                        Crea una cuenta para un nuevo docente, coordinador o administrador.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AddStaffForm onUserAdded={handleDataChange} />
                </CardContent>
            </Card>
        </div>
    );
}
