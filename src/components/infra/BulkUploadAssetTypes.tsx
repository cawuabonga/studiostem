
"use client";

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { bulkAddAssetTypes } from '@/config/firebase';
import type { AssetType } from '@/types';
import { FileDown, Upload, Loader2 } from 'lucide-react';

interface BulkUploadAssetTypesProps {
    instituteId: string;
    onUploadSuccess: () => void;
}

export function BulkUploadAssetTypes({ instituteId, onUploadSuccess }: BulkUploadAssetTypesProps) {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setFile(event.target.files[0]);
        }
    };

    const handleDownloadTemplate = () => {
        const worksheet = XLSX.utils.json_to_sheet([
            { 
                patrimonialCode: "04220001",
                name: "SILLA DE ESTRUCTURA DE MADERA",
                group: "MAQUINARIAS, EQUIPOS Y MOBILIARIO",
                class: "MOBILIARIO",
                description: "Silla de madera para aula."
            },
        ]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "CatalogoBienes");
        XLSX.writeFile(workbook, "plantilla_catalogo_bienes.xlsx");
    };

    const handleUpload = async () => {
        if (!file) {
            toast({
                title: 'Archivo no seleccionado',
                description: 'Por favor, selecciona un archivo de Excel para subir.',
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet) as any[];

                const assetTypesToUpload: Omit<AssetType, 'id' | 'lastAssignedNumber'>[] = json.map((row, index) => {
                    if (!row.patrimonialCode || !row.name || !row.group || !row.class) {
                        throw new Error(`Faltan datos requeridos en la fila ${index + 2}. Asegúrate de que las columnas patrimonialCode, name, group, y class no estén vacías.`);
                    }
                    return {
                        patrimonialCode: String(row.patrimonialCode),
                        name: String(row.name),
                        group: String(row.group) as any,
                        class: String(row.class) as any,
                        description: String(row.description || ''),
                    };
                });

                await bulkAddAssetTypes(instituteId, assetTypesToUpload);

                toast({
                    title: '¡Éxito!',
                    description: `${assetTypesToUpload.length} tipos de bienes han sido cargados al catálogo.`,
                });
                onUploadSuccess();
                setFile(null);
                 const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement | null;
                if (fileInput) {
                    fileInput.value = '';
                }

            } catch (error: any) {
                console.error("Error en carga masiva de catálogo:", error);
                toast({
                    title: 'Error en la Carga',
                    description: error.message || 'Hubo un problema al procesar el archivo. Revisa el formato y los datos.',
                    variant: 'destructive',
                    duration: 8000
                });
            } finally {
                setLoading(false);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={handleDownloadTemplate} variant="secondary" className="w-full sm:w-auto">
                    <FileDown className="mr-2 h-4 w-4" />
                    Descargar Plantilla
                </Button>
                <div className="flex-grow">
                    <Input type="file" onChange={handleFileChange} accept=".xlsx, .xls" disabled={loading} />
                </div>
            </div>
            <Button onClick={handleUpload} disabled={!file || loading} className="w-full">
                {loading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Procesando Catálogo...
                    </>
                ) : (
                    <>
                        <Upload className="mr-2 h-4 w-4" />
                        Subir y Actualizar Catálogo
                    </>
                )}
            </Button>
        </div>
    );
}
