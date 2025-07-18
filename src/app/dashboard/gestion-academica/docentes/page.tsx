
"use client";

import { AddTeacherForm } from "@/components/teachers/AddTeacherForm";
import { TeachersList } from "@/components/teachers/TeachersList";
import { BulkUploadTeachers } from "@/components/teachers/BulkUploadTeachers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Upload } from "lucide-react";
import type { Institute } from "@/types";

interface ManageTeachersPageProps {
  instituteId: string | null;
  institute: Institute | null;
}

export default function ManageTeachersPage({ instituteId }: ManageTeachersPageProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!loading && (!user || !["Admin", "Coordinator"].includes(user.role))) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleDataChange = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  if (!instituteId) {
    return <p>Cargando instituto...</p>;
  }

  return (
     <Tabs defaultValue="list" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="list">Listado de Docentes</TabsTrigger>
        <TabsTrigger value="register">Registrar Docentes</TabsTrigger>
      </TabsList>
      <TabsContent value="list" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Docentes Registrados</CardTitle>
            <CardDescription>
              Ver, editar y eliminar los docentes del instituto.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TeachersList key={refreshKey} instituteId={instituteId} onDataChange={handleDataChange} />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="register" className="mt-6">
        <div className="space-y-6">
            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                    <AccordionTrigger className="text-lg font-semibold flex items-center gap-2">
                        <Upload className="h-5 w-5"/> Carga Masiva de Docentes
                    </AccordionTrigger>
                    <AccordionContent>
                         <Card>
                            <CardHeader>
                                <CardTitle>Registro por Lotes</CardTitle>
                                <CardDescription>Descargue la plantilla, complete los datos de los docentes y súbala para un registro rápido.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <BulkUploadTeachers instituteId={instituteId} onUploadSuccess={handleDataChange} />
                            </CardContent>
                        </Card>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        
            <Card>
                <CardHeader>
                <CardTitle>Registrar Nuevo Docente</CardTitle>
                <CardDescription>
                    Añada un nuevo docente individualmente.
                </CardDescription>
                </CardHeader>
                <CardContent>
                    <AddTeacherForm instituteId={instituteId} onTeacherAdded={handleDataChange} />
                </CardContent>
            </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}
