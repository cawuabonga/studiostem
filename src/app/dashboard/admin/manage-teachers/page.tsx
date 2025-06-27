
"use client";

import { AddTeacherForm } from "@/components/teachers/AddTeacherForm";
import { BulkUploadTeachers } from "@/components/teachers/BulkUploadTeachers";
import { TeachersList } from "@/components/teachers/TeachersList";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ManageTeachersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'Admin')) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleDataChange = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  if (loading || !user || user.role !== 'Admin') {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Cargando o no autorizado...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
       <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-base font-semibold py-3 px-4 rounded-md border bg-card text-card-foreground shadow-sm data-[state=closed]:rounded-md data-[state=open]:rounded-b-none">
                  Carga Masiva de Docentes desde Excel
              </AccordionTrigger>
              <AccordionContent>
                  <Card className="rounded-t-none border-t-0">
                      <CardHeader className="pb-4">
                          <CardTitle className="text-lg">Subir Múltiples Docentes</CardTitle>
                          <CardDescription>
                              Sube la plantilla de Excel para registrar varios docentes a la vez.
                          </CardDescription>
                      </CardHeader>
                      <CardContent>
                          <BulkUploadTeachers onUploadComplete={handleDataChange} />
                      </CardContent>
                  </Card>
              </AccordionContent>
            </AccordionItem>
        </Accordion>
      
      <Card>
        <CardHeader>
          <CardTitle>Registrar Nuevo Docente</CardTitle>
          <CardDescription>
            Complete el formulario para añadir un nuevo docente al sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AddTeacherForm onTeacherAdded={handleDataChange} />
        </CardContent>
      </Card>
      
      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Docentes Registrados</CardTitle>
          <CardDescription>
            Ver, editar y eliminar los docentes existentes en el sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TeachersList key={refreshKey} onDataChange={handleDataChange} />
        </CardContent>
      </Card>
    </div>
  );
}
