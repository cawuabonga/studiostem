
"use client";

import { AssetCatalogManager } from "@/components/infra/AssetCatalogManager";
import { BulkUploadAssetTypes } from "@/components/infra/BulkUploadAssetTypes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function CatalogoActivosPage() {
    const { user, instituteId, loading, hasPermission } = useAuth();
    const router = useRouter();
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        if (!loading && !hasPermission('admin:infra:manage')) {
            router.push('/dashboard');
        }
    }, [user, loading, router, hasPermission]);
    
    const handleDataChange = () => {
      setRefreshKey(prevKey => prevKey + 1);
    };

    if (loading || !hasPermission('admin:infra:manage') || !instituteId) {
        return <p>Cargando o no autorizado...</p>
    }

    return (
        <div className="space-y-6">
            <AssetCatalogManager key={refreshKey} instituteId={instituteId} onDataChange={handleDataChange} />

            <Separator />

             <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Upload className="h-5 w-5"/>
                        <CardTitle>Carga Masiva del Catálogo desde Excel</CardTitle>
                    </div>
                    <CardDescription>Este proceso permite agregar o actualizar el catálogo completo de bienes patrimoniales desde un archivo Excel.</CardDescription>
                </CardHeader>
                <CardContent>
                    <BulkUploadAssetTypes instituteId={instituteId} onUploadSuccess={handleDataChange} />
                </CardContent>
            </Card>
        </div>
    );
}
