
"use client";

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { bulkAddStudents, getPrograms } from '@/config/firebase';
import type { Program, StudentProfile } from '@/types';
import { FileDown, Upload, Loader2 } from 'lucide-react';

interface BulkUploadStudentsProps {
    onUploadSuccess: () => void;
}

const validGenders = ['Masculino', 'Femenino'];
const validTurnos = ['Mañana', 'Tarde', 'Noche'];

export function BulkUploadStudents({ onUploadSuccess }: BulkUploadStudentsProps) {
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
                firstName: "Juan",
                lastName: "Perez",
                gender: "Masculino",
                age: 20,
                email: "juan.perez@example.com",
                phone: "987654321",
                address: "Av. Falsa 123",
                programAbbreviation: programAbbreviations || "ABREV_PROGRAMA",
                turno: "Mañana / Tarde / Noche",
                photoURL: "https://example.com/foto.png (Opcional)"
            },
        ]);
        XLSX.utils.sheet_add_aoa(worksheet, [[`Programas válidos: ${programAbbreviations || 'Primero debe registrar programas'}`]], { origin: "L1" });

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Estudiantes");
        XLSX.writeFile(workbook, "plantilla_estudiantes.xlsx");
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

                const studentsToUpload: Omit<StudentProfile, 'id' | 'fullName'| 'linkedUserUid'>[] = json.map(row => {
                    const gender = String(row.gender);
                    if (!validGenders.includes(gender)) {
                        throw new Error(`Género inválido "${gender}" para ${row.firstName}. Válidos: Masculino, Femenino.`);
                    }

                    const turno = String(row.turno || '').trim();
                    if (!validTurnos.includes(turno)) {
                        throw new Error(`Turno inválido "${turno}" para ${row.firstName}. Válidos: Mañana, Tarde, Noche.`);
                    }

                    const programId = programMap.get(String(row.programAbbreviation));
                    if (!programId) {
                         throw new Error(`Abreviatura de programa inválida "${row.programAbbreviation}" para ${row.firstName}. Válidas: ${Array.from(programMap.keys()).join(', ')}.`);
                    }

                    return {
                        documentId: String(row.documentId),
                        firstName: String(row.firstName),
                        lastName: String(row.lastName),
                        gender: gender as any,
                        age: Number(row.age),
                        email: String(row.email),
                        phone: String(row.phone || ''),
                        address: String(row.address || ''),
                        photoURL: String(row.photoURL || ''),
                        programId: programId,
                        turno: turno as any,
                        admissionYear: new Date().getFullYear().toString(), // Default for bulk
                        admissionPeriod: 'MAR-JUL', // Default
                        role: 'Student',
                        roleId: 'student',
                    }
                });

                await bulkAddStudents(instituteId, studentsToUpload);

                toast({
                    title: '¡Éxito!',
                    description: `${studentsToUpload.length} perfiles de estudiantes han sido creados.`,
                    duration: 8000
                });
                onUploadSuccess();
            } catch (error: any) {
                console.error("Error en carga masiva de estudiantes:", error);
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
