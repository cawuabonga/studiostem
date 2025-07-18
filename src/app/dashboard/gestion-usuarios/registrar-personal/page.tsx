
"use client";

import { AddStaffForm } from "@/components/users/AddStaffForm";
import { BulkUploadStaff } from "@/components/users/BulkUploadStaff";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Upload } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";


export default function RegistrarPersonalPage() {
    const { instituteId } = useAuth();
    const [dataVersion, setDataVersion] = useState(0);

    const handleDataChange = () => {
        setDataVersion(prev => prev + 1);
    };

    if (!instituteId) return <p>Cargando...</p>;

    return (
         <div className="space-y-6">
            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                    <AccordionTrigger className="text-lg font-semibold flex items-center gap-2">
                        <Upload className="h-5 w-5"/> Carga Masiva de Personal
                    </AccordionTrigger>
                    <AccordionContent>
                         <Card>
                            <CardHeader>
                                <CardTitle>Registro por Lotes</CardTitle>
                                <CardDescription>Descargue la plantilla, complete los datos del personal y súbala para un registro rápido.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <BulkUploadStaff onUploadSuccess={handleDataChange} />
                            </CardContent>
                        </Card>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        
            <Card>
                <CardHeader>
                <CardTitle>Registrar Nuevo Perfil de Personal (Individual)</CardTitle>
                <CardDescription>
                    Cree un nuevo perfil para un docente o administrativo individualmente.
                </CardDescription>
                </CardHeader>
                <CardContent>
                    <AddStaffForm instituteId={instituteId} onProfileCreated={handleDataChange} />
                </CardContent>
            </Card>
        </div>
    );
}
