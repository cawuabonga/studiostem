

"use client";

import { AddUnitForm } from "@/components/units/AddUnitForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BulkUploadUnits } from "@/components/units/BulkUploadUnits";

export default function RegisterUnitPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // This state is used by child components to signal data changes.
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'Admin' && user.role !== 'Coordinator'))) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleDataChange = () => {
    // A successful data change can trigger actions, e.g., showing a notification.
    // For now, it just refreshes child component keys if needed.
    setRefreshKey(prevKey => prevKey + 1);
  };
  
  if (loading || !user || (user.role !== 'Admin' && user.role !== 'Coordinator')) {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Cargando o no autorizado...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
        <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-base font-semibold py-3 px-4 rounded-md border bg-card text-card-foreground shadow-sm data-[state=closed]:rounded-md data-[state=open]:rounded-b-none">
                  Carga Masiva desde Excel
              </AccordionTrigger>
              <AccordionContent>
                  <Card className="rounded-t-none border-t-0">
                      <CardHeader className="pb-4">
                          <CardTitle className="text-lg">Subir Múltiples Unidades</CardTitle>
                          <CardDescription>
                              Sube la plantilla de Excel para registrar varias unidades a la vez.
                          </CardDescription>
                      </Header>
                      <CardContent>
                          <BulkUploadUnits onUploadComplete={handleDataChange} />
                      </CardContent>
                  </Card>
              </AccordionContent>
            </AccordionItem>
        </Accordion>

        <Card className="flex-shrink-0">
            <CardHeader>
            <CardTitle>Registrar Nueva Unidad Didáctica</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
            <AddUnitForm onUnitAdded={handleDataChange} />
            </CardContent>
        </Card>
    </div>
  );
}
