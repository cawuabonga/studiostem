
"use client";

import { AddStudentForm } from "@/components/users/AddStudentForm";
import { BulkUploadStudents } from "@/components/users/BulkUploadStudents";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Upload } from "lucide-react";
import { useState } from "react";


export default function RegistrarEstudiantePage() {
    const { instituteId } = useAuth();
    const [dataVersion, setDataVersion] = useState(0);

    const handleDataChange = () => {
        setDataVersion(prev => prev + 1);
    };
    
    if (!instituteId) return <p>Cargando...</p>;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Registrar Nuevo Estudiante (Individual)</CardTitle>
                    <CardDescription>
                        Complete el formulario para crear un nuevo perfil de estudiante. El estudiante deberá validar su perfil usando su DNI para acceder al sistema.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AddStudentForm 
                        instituteId={instituteId} 
                        onProfileCreated={handleDataChange} 
                    />
                </CardContent>
            </Card>

            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                    <AccordionTrigger className="text-lg font-semibold flex items-center gap-2">
                        <Upload className="h-5 w-5"/> Carga Masiva de Estudiantes
                    </AccordionTrigger>
                    <AccordionContent>
                         <Card>
                            <CardHeader>
                                <CardTitle>Registro por Lotes de Estudiantes</CardTitle>
                                <CardDescription>Descargue la plantilla, complete los datos de los estudiantes y súbala para un registro rápido.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <BulkUploadStudents onUploadSuccess={handleDataChange} />
                            </CardContent>
                        </Card>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
}
