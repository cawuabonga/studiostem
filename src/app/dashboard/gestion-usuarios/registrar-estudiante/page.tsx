
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddStudentForm } from "@/components/users/AddStudentForm";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

export default function RegistrarEstudiantePage() {
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
        // For now, this just needs to exist for the form component.
        // In the future, it could trigger a refresh or a redirect.
        console.log("Student added");
    }, []);

    if (loading || !instituteId || !user) {
        return <p>Cargando...</p>;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Registrar Nuevo Estudiante</CardTitle>
                    <CardDescription>
                        Crea una cuenta para un nuevo estudiante en el instituto.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AddStudentForm onUserAdded={handleDataChange} />
                </CardContent>
            </Card>
        </div>
    );
}
