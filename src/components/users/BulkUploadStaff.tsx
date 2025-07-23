
"use client";

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { bulkAddStaff, getPrograms } from '@/config/firebase';
import type { AppUser, Program, UserRole } from '@/types';
import { FileDown, Upload, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BulkUploadStaffProps {
    onUploadSuccess: () => void;
}

const validRoles: UserRole[] = ['Teacher', 'Coordinator', 'Admin'];
const validConditions = ['NOMBRADO', 'CONTRATADO'];

const roleDisplayMap: Record<string, UserRole> = {
    'docente': 'Teacher',
    'coordinador': 'Coordinator',
    'administrador': 'Admin',
};

export function BulkUploadStaff({ onUploadSuccess }: BulkUploadStaffProps) {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const { instituteId } = useAuth();
    const [programs, setPrograms] = useState<Program[]>([]);
    
    useEffect(() => {
        if (instituteId) {
            getPrograms(instituteId).then(setPrograms).catch(console.error);
        }
    }, [instituteId]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setFile(event.target.files[0]);
        }
    };

    const handleDownloadTemplate = () => {
        const programAbbreviations = programs.map(p => p.abbreviation).join(' / ');
        const worksheet = XLSX.utils.json_to_sheet([
            { 
                documentId: "87654321",
                displayName: "Ana Torres",
                email: "ana.torres@example.com",
                phone: "912345678",
                condition: "CONTRATADO",
                programAbbreviation: programAbbreviations || "ABREV_PROGRAMA",
                role: "Docente / Coordinador / Administrador"
            },
        ]);
        XLSX.utils.sheet_add_aoa(worksheet, [[`Programas válidos: ${programAbbreviations || 'Primero debe registrar programas'}`]], { origin: "H1" });

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Personal");
        XLSX.writeFile(workbook, "plantilla_personal.xlsx");
    };

    const handleUpload = async () => {
        if (!file || !instituteId) {
            toast({
                title: 'Error',
                description: 'Por favor, selecciona un archivo.',
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

                const programMap = new Map(programs.map(p => [p.abbreviation, p.id]));

                const staffToUpload: Omit<AppUser, 'uid' | 'photoURL'>[] = json.map(row => {
                    const roleStr = String(row.role || '').toLowerCase().trim();
                    const role = roleDisplayMap[roleStr] as UserRole;
                    
                    if (!role || !validRoles.includes(role)) {
                        throw new Error(`Rol inválido "${row.role}" en la fila para ${row.displayName}. Roles válidos: Docente, Coordinador, Administrador.`);
                    }
                    if (!validConditions.includes(String(row.condition))) {
                         throw new Error(`Condición inválida "${row.condition}" en la fila para ${row.displayName}. Condiciones válidas: NOMBRADO, CONTRATADO.`);
                    }
                    const programId = programMap.get(String(row.programAbbreviation));
                    if (!programId) {
                         throw new Error(`Abreviatura de programa inválida "${row.programAbbreviation}" para ${row.displayName}. Abreviaturas válidas: ${Array.from(programMap.keys()).join(', ')}.`);
                    }

                    return {
                        documentId: String(row.documentId),
                        displayName: String(row.displayName),
                        email: String(row.email),
                        phone: String(row.phone),
                        condition: String(row.condition) as any,
                        programId: programId,
                        role,
                        instituteId,
                    }
                });

                await bulkAddStaff(instituteId, staffToUpload);

                toast({
                    title: '¡Éxito!',
                    description: `${staffToUpload.length} perfiles de personal han sido creados. Los usuarios podrán reclamarlos desde su dashboard.`,
                    duration: 8000
                });
                onUploadSuccess();
            } catch (error: any) {
                console.error("Error en carga masiva de personal:", error);
                toast({
                    title: 'Error en la Carga',
                    description: error.message || 'Hubo un problema al procesar el archivo. Revisa el formato y los datos.',
                    variant: 'destructive',
                    duration: 7000
                });
            } finally {
                setLoading(false);
                setFile(null);
                const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement | null;
                if (fileInput) {
                    fileInput.value = '';
                }
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
                        Subir y Registrar Perfiles
                    </>
                )}
            </Button>
        </div>
    );
}
