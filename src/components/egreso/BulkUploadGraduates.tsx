
"use client";

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { bulkAddGraduates, getPrograms } from '@/config/firebase';
import type { Program, StudentProfile, UnitPeriod } from '@/types';
import { FileDown, Upload, Loader2, Info } from 'lucide-react';
import { calculateAge } from '@/lib/utils';
import { Timestamp } from 'firebase/firestore';

interface BulkUploadGraduatesProps {
    onUploadSuccess: () => void;
}

const validGenders = ['Masculino', 'Femenino'];
const validTurnos = ['Mañana', 'Tarde', 'Noche'];
const validPeriods = ['MAR-JUL', 'AGO-DIC'];

export function BulkUploadGraduates({ onUploadSuccess }: BulkUploadGraduatesProps) {
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
                documentId: "12345678",
                firstName: "Nombre Egresado",
                lastName: "Apellidos Egresado",
                gender: "Masculino",
                fechaNacimiento: "1990-05-20",
                email: "egresado@example.com",
                phone: "987654321",
                address: "Av. Falsa 123",
                programAbbreviation: programAbbreviations || "ABREV_PROGRAMA",
                turno: "Mañana",
                añoAdmision: "2018",
                periodoAdmision: "MAR-JUL",
                añoEgreso: "2021",
                photoURL: ""
            },
        ]);
        XLSX.utils.sheet_add_aoa(worksheet, [[`Programas válidos: ${programAbbreviations || 'Registre programas primero'}`]], { origin: "O1" });

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Egresados");
        XLSX.writeFile(workbook, "plantilla_carga_egresados.xlsx");
    };

    const handleUpload = async () => {
        if (!file || !instituteId) {
            toast({ title: 'Error', description: 'Por favor, selecciona un archivo.', variant: 'destructive' });
            return;
        }

        setLoading(true);
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet) as any[];

                const programMap = new Map(programs.map(p => [p.abbreviation, p.id]));

                const graduatesToUpload: Omit<StudentProfile, 'id' | 'fullName'| 'linkedUserUid'>[] = json.map(row => {
                    const gender = String(row.gender).trim();
                    if (!validGenders.includes(gender)) {
                        throw new Error(`Género inválido "${gender}" para ${row.firstName}.`);
                    }

                    const programId = programMap.get(String(row.programAbbreviation).trim());
                    if (!programId) {
                         throw new Error(`Programa inválido "${row.programAbbreviation}" para ${row.firstName}.`);
                    }
                    
                    const bDate = row.fechaNacimiento instanceof Date ? row.fechaNacimiento : new Date(row.fechaNacimiento);

                    return {
                        documentId: String(row.documentId),
                        firstName: String(row.firstName),
                        lastName: String(row.lastName),
                        gender: gender as any,
                        birthDate: Timestamp.fromDate(bDate),
                        age: calculateAge(bDate),
                        email: String(row.email),
                        phone: String(row.phone || ''),
                        address: String(row.address || ''),
                        photoURL: String(row.photoURL || ''),
                        programId: programId,
                        turno: String(row.turno || 'Mañana') as any,
                        admissionYear: String(row.añoAdmision || ''),
                        admissionPeriod: String(row.periodoAdmision || 'MAR-JUL') as UnitPeriod,
                        graduationYear: String(row.añoEgreso || ''),
                        role: 'Graduate',
                        roleId: 'graduate',
                    }
                });

                await bulkAddGraduates(instituteId, graduatesToUpload);

                toast({
                    title: '¡Carga Exitosa!',
                    description: `${graduatesToUpload.length} perfiles de egresados han sido creados.`,
                });
                onUploadSuccess();
                setFile(null);
            } catch (error: any) {
                console.error("Error en carga masiva de egresados:", error);
                toast({
                    title: 'Error en la Carga',
                    description: error.message || 'Hubo un problema al procesar el archivo.',
                    variant: 'destructive',
                });
            } finally {
                setLoading(false);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    return (
        <div className="space-y-4 pt-4 border-t border-dashed mt-2">
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex gap-3 items-center mb-4">
                <Info className="h-5 w-5 text-blue-600 shrink-0" />
                <p className="text-xs text-blue-800 leading-tight">
                    Utilice esta herramienta para migrar egresados de años anteriores. El sistema les asignará automáticamente el <strong>Rol de Egresado</strong> y el estado <strong>Egresado</strong>.
                </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={handleDownloadTemplate} variant="outline" className="w-full sm:w-auto h-11">
                    <FileDown className="mr-2 h-4 w-4" />
                    Descargar Plantilla Excel
                </Button>
                <div className="flex-grow">
                    <Input type="file" onChange={handleFileChange} accept=".xlsx, .xls" className="h-11" />
                </div>
                <Button onClick={handleUpload} disabled={!file || loading} className="w-full sm:w-auto h-11 px-8">
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Cargando...
                        </>
                    ) : (
                        <>
                            <Upload className="mr-2 h-4 w-4" />
                            Subir Egresados
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
