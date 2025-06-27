
"use client";

import { AddUnitForm } from "@/components/units/AddUnitForm";
import { UnitsList } from "@/components/units/UnitsList";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BulkUploadUnits } from "@/components/units/BulkUploadUnits";

export default function ManageUnitsPage() {
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
    <div className="flex flex-col h-full gap-4">
       <Accordion type="single" collapsible className="w-full border-b">
        <AccordionItem value="item-1" className="border-b-0">
          <AccordionTrigger className="text-base font-semibold py-3">
            Carga Masiva desde Excel
          </AccordionTrigger>
          <AccordionContent>
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="text-xl">Subir Múltiples Unidades</CardTitle>
                    <CardDescription>
                        Sube la plantilla de Excel para registrar varias unidades a la vez.
                    </CardDescription>
                </CardHeader>
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
      
      <Card className="flex-grow flex flex-col overflow-hidden">
        <CardHeader>
          <CardTitle>Unidades Didácticas Registradas</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow overflow-y-auto">
          <UnitsList key={refreshKey} onUnitUpdated={handleDataChange} />
        </CardContent>
      </Card>
    </div>
  );
}
