
"use client";

import { AddStudentForm } from "@/components/users/AddStudentForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";


export default function RegistrarEstudiantePage() {
    const { instituteId } = useAuth();
    const [dataVersion, setDataVersion] = useState(0);

    const handleDataChange = () => {
        setDataVersion(prev => prev + 1);
    };
    
    if (!instituteId) return <p>Cargando...</p>;

    return (
         <Card>
            <CardHeader>
                <CardTitle>Registrar Nuevo Estudiante</CardTitle>
                <CardDescription>
                    Complete el formulario para crear un nuevo perfil de estudiante. El estudiante deberá validar su perfil usando su DNI y el código de activación generado.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <AddStudentForm 
                    instituteId={instituteId} 
                    onProfileCreated={handleDataChange} 
                />
            </CardContent>
        </Card>
    );
}
