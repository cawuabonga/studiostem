
"use client";

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { bulkAddUnits } from '@/config/firebase';
import type { Unit } from '@/types';
import { FileDown, Upload, Loader2 } from 'lucide-react';

interface BulkUploadUnitsProps {
    onUploadSuccess: () => void;
}

export function BulkUploadUnits({ onUploadSuccess }: BulkUploadUnitsProps) {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const { instituteId } = useAuth();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setFile(event.target.files[0]);
        }
    };

    const handleDownloadTemplate = () => {
        const worksheet = XLSX.utils.json_to_sheet([
            { name: "Matemática Aplicada", code: "MA-101", credits: 4, semester: 1, programId: "id-del-programa-de-estudio" },
        ]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Unidades");
        XLSX.utils.book_set_sheet_visibility(workbook, "Unidades", 1); // Hide the sheet with instructions/examples if any
        XLSX.writeFile(workbook, "plantilla_unidades.xlsx");
        toast({
            title: "Nota Importante",
            description: "Asegúrese de reemplazar 'id-del-programa-de-estudio' con el ID real del programa de estudios correspondiente.",
            duration: 8000
        })
    };

    const handleUpload = async () => {
        if (!file || !instituteId) {
            toast({
                title: 'Error',
                description: 'Por favor, selecciona un archivo y asegúrate de haber seleccionado un instituto.',
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

                const unitsToUpload: Omit<Unit, 'id'>[] = json.map(row => ({
                    name: String(row.name),
                    code: String(row.code),
                    credits: Number(row.credits),
                    semester: Number(row.semester),
                    programId: String(row.programId),
                }));

                await bulkAddUnits(instituteId, unitsToUpload);

                toast({
                    title: '¡Éxito!',
                    description: `${unitsToUpload.length} unidades han sido agregadas.`,
                });
                onUploadSuccess();
            } catch (error) {
                 console.error("Error en carga masiva:", error);
                toast({
                    title: 'Error en la Carga',
                    description: 'Hubo un problema al procesar el archivo. Revisa el formato y los datos, especialmente los IDs de programa.',
                    variant: 'destructive',
                });
            } finally {
                setLoading(false);
                setFile(null);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={handleDownloadTemplate} variant="outline" className="w-full sm:w-auto">
                    <FileDown className="mr-2 h-4 w-4" />
                    Descargar Plantilla
                </Button>
                <div className="flex-grow">
                    <Input type="file" onChange={handleFileChange} accept=".xlsx, .xls" />
                </div>
            </div>
            <Button onClick={handleUpload} disabled={!file || loading} className="w-full">
                {loading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Procesando...
                    </>
                ) : (
                     <>
                        <Upload className="mr-2 h-4 w-4" />
                        Subir y Registrar Unidades
                    </>
                )}
            </Button>
        </div>
    );
}
