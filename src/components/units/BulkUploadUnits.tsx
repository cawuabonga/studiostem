

"use client";

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { bulkAddUnits, getPrograms, updateUnitImage } from '@/config/firebase';
import type { Unit, Program, ProgramModule, UnitTurno } from '@/types';
import { FileDown, Upload, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { generateUnitImage } from '@/ai/flows/generate-unit-image-flow';

interface BulkUploadUnitsProps {
    instituteId: string;
    onUploadSuccess: () => void;
}

export function BulkUploadUnits({ instituteId, onUploadSuccess }: BulkUploadUnitsProps) {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const [programs, setPrograms] = useState<Program[]>([]);
    const [selectedProgramId, setSelectedProgramId] = useState<string>('');

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
        const selectedProgram = programs.find(p => p.id === selectedProgramId);
        const moduleCodes = selectedProgram?.modules.map(m => m.code).join(', ') || "Asegúrese de seleccionar un programa";

        const worksheet = XLSX.utils.json_to_sheet([
            { 
                moduleId: "CÓDIGO_DEL_MÓDULO", // New column
                name: "Matemática Aplicada", 
                code: "MA-101", 
                credits: 4, 
                semester: 1,
                totalWeeks: 16,
                theoreticalHours: 2,
                practicalHours: 2,
                period: "MAR-JUL",
                unitType: "Especifica",
                turno: "Mañana",
            },
        ]);
        XLSX.utils.sheet_add_aoa(worksheet, [
            [`Módulos válidos para este programa: ${moduleCodes}`],
        ], { origin: "L1" });

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Unidades");
        XLSX.writeFile(workbook, "plantilla_unidades_con_modulos.xlsx");
        toast({
            title: "Plantilla Descargada",
            description: "Complete la plantilla con los datos de las unidades, incluyendo el código del módulo para cada una.",
            duration: 7000
        })
    };

    const handleUpload = async () => {
        if (!file || !selectedProgramId) {
            toast({
                title: 'Información Faltante',
                description: 'Por favor, selecciona un programa de estudios y un archivo antes de subir.',
                variant: 'destructive',
            });
            return;
        }
        
        const selectedProgram = programs.find(p => p.id === selectedProgramId);
        if (!selectedProgram) {
             toast({ title: 'Error', description: 'Programa seleccionado no válido.', variant: 'destructive'});
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

                const validModuleIds = new Set(selectedProgram.modules.map(m => m.code));

                const unitsToUpload: Omit<Unit, 'id' | 'totalHours' | 'imageUrl'>[] = json.map((row, index) => {
                    const moduleId = String(row.moduleId).trim();
                    if (!validModuleIds.has(moduleId)) {
                        throw new Error(`Error en la fila ${index + 2}: El código de módulo "${moduleId}" no es válido para el programa "${selectedProgram.name}".`);
                    }

                    return {
                        programId: selectedProgramId,
                        moduleId: moduleId,
                        name: String(row.name),
                        code: String(row.code),
                        credits: Number(row.credits),
                        semester: Number(row.semester),
                        totalWeeks: Number(row.totalWeeks),
                        theoreticalHours: Number(row.theoreticalHours),
                        practicalHours: Number(row.practicalHours),
                        period: String(row.period) as any,
                        unitType: String(row.unitType) as any,
                        turno: String(row.turno) as UnitTurno,
                    };
                });

                await bulkAddUnits(instituteId, unitsToUpload);

                toast({
                    title: '¡Éxito!',
                    description: `${unitsToUpload.length} unidades han sido agregadas al programa.`,
                });
                onUploadSuccess();
                setFile(null);
                 const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement | null;
                if (fileInput) {
                    fileInput.value = '';
                }

            } catch (error: any) {
                 console.error("Error en carga masiva:", error);
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
        <div className="space-y-6">
            <Card className="bg-muted/50 border-dashed">
                <CardHeader>
                    <CardTitle>Paso 1: Seleccionar Programa de Estudios</CardTitle>
                    <CardDescription>Elija el programa de estudios al que pertenecen las unidades que va a cargar.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="max-w-md">
                         <label className="text-sm font-medium">Programa de Estudio</label>
                        <Select onValueChange={setSelectedProgramId} value={selectedProgramId} disabled={loading}>
                            <SelectTrigger>
                            <SelectValue placeholder="Seleccione un programa" />
                            </SelectTrigger>
                            <SelectContent>
                                {programs.map((program) => (
                                <SelectItem key={program.id} value={program.id}>
                                    {program.name}
                                </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

             <Card className="bg-muted/50 border-dashed">
                <CardHeader>
                    <CardTitle>Paso 2: Preparar y Subir Archivo</CardTitle>
                    <CardDescription>Descargue la plantilla, llénela con todas las unidades del programa seleccionado y luego suba el archivo.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button onClick={handleDownloadTemplate} variant="secondary" className="w-full sm:w-auto" disabled={!selectedProgramId}>
                                <FileDown className="mr-2 h-4 w-4" />
                                Descargar Plantilla
                            </Button>
                            <div className="flex-grow">
                                <Input type="file" onChange={handleFileChange} accept=".xlsx, .xls" disabled={loading} />
                            </div>
                        </div>
                        <Button onClick={handleUpload} disabled={!file || !selectedProgramId || loading} className="w-full">
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
                </CardContent>
             </Card>
        </div>
    );
}
