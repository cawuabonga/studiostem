
"use client";

import { AddUnitForm } from "@/components/units/AddUnitForm";
import { UnitsList } from "@/components/units/UnitsList";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BulkUploadUnits } from "@/components/units/BulkUploadUnits";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Upload } from "lucide-react";

export default function ManageUnitsPage() {
  const { user, instituteId, loading, hasPermission } = useAuth();
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);

  const canView = hasPermission('academic:unit:manage') || hasPermission('academic:unit:manage:own');

  useEffect(() => {
    if (!loading && !canView) {
      router.push('/dashboard');
    }
  }, [user, loading, router, canView]);

  const handleDataChange = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };
  
  if (loading || !canView) {
      return <p>Cargando o no autorizado...</p>
  }

  if (!instituteId) {
    return <p>Cargando instituto...</p>;
  }

  return (
    <div className="space-y-6">
        <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
                <AccordionTrigger className="text-lg font-semibold flex items-center gap-2">
                    <Upload className="h-5 w-5"/> Carga Masiva de Unidades Didácticas
                </AccordionTrigger>
                <AccordionContent>
                    <Card>
                        <CardHeader>
                            <CardTitle>Registro por Lotes de Unidades Didácticas</CardTitle>
                            <CardDescription>Este proceso le permite agregar múltiples unidades didácticas a un programa y módulo específicos de una sola vez.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <BulkUploadUnits instituteId={instituteId} onUploadSuccess={handleDataChange} />
                        </CardContent>
                    </Card>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
        
      <Card>
        <CardHeader>
          <CardTitle>Registrar Nueva Unidad Didáctica (Individual)</CardTitle>
          <CardDescription>
            Añada una nueva unidad didáctica de forma individual.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AddUnitForm instituteId={instituteId} onUnitAdded={handleDataChange} />
        </CardContent>
      </Card>
      
      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Unidades Didácticas Registradas</CardTitle>
          <CardDescription>
            Ver, editar y eliminar las unidades existentes en el instituto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UnitsList key={refreshKey} onDataChange={handleDataChange} />
        </CardContent>
      </Card>
    </div>
  );
}
