
"use client";

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { bulkAddTeachers } from '@/config/firebase';
import type { Teacher } from '@/types';
import { FileDown, Upload, Loader2 } from 'lucide-react';

interface BulkUploadTeachersProps {
    onUploadSuccess: () => void;
}

export function BulkUploadTeachers({ onUploadSuccess }: BulkUploadTeachersProps) {
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
            { dni: "12345678", fullName: "Juan Ejemplo Pérez", email: "juan.ejemplo@email.com", phone: "987654321", specialty: "Computación", active: true },
        ]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Docentes");
        XLSX.writeFile(workbook, "plantilla_docentes.xlsx");
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

                const teachersToUpload: Omit<Teacher, 'id'>[] = json.map(row => ({
                    dni: String(row.dni),
                    fullName: String(row.fullName),
                    email: String(row.email),
                    phone: String(row.phone),
                    specialty: String(row.specialty),
                    active: String(row.active).toLowerCase() === 'true',
                }));

                await bulkAddTeachers(instituteId, teachersToUpload);

                toast({
                    title: '¡Éxito!',
                    description: `${teachersToUpload.length} docentes han sido agregados.`,
                });
                onUploadSuccess();
            } catch (error) {
                console.error("Error en carga masiva:", error);
                toast({
                    title: 'Error en la Carga',
                    description: 'Hubo un problema al procesar el archivo. Revisa el formato y los datos.',
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
                        Subir y Registrar Docentes
                    </>
                )}
            </Button>
        </div>
    );
}

