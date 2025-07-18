
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddStaffForm } from "@/components/users/AddStaffForm";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Upload } from "lucide-react";
import { BulkUploadStaff } from "@/components/users/BulkUploadStaff";

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
        console.log("Staff member added/updated");
    }, []);

    if (loading || !instituteId || !user) {
        return <p>Cargando...</p>;
    }

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
                                <CardDescription>Descargue la plantilla, complete los datos del personal y súbala para un registro rápido de perfiles.</CardDescription>
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
                    <CardTitle>Registrar Perfil de Personal (Individual)</CardTitle>
                    <CardDescription>
                        Crea un perfil para un nuevo docente, coordinador o administrador. El usuario podrá reclamar este perfil usando su DNI.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AddStaffForm onUserAdded={handleDataChange} />
                </CardContent>
            </Card>
        </div>
    );
}
