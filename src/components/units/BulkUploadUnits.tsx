
"use client";

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { bulkAddUnits, getPrograms } from '@/config/firebase';
import type { Unit, Program, ProgramModule } from '@/types';
import { FileDown, Upload, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface BulkUploadUnitsProps {
    instituteId: string;
    onUploadSuccess: () => void;
}

export function BulkUploadUnits({ instituteId, onUploadSuccess }: BulkUploadUnitsProps) {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const [programs, setPrograms] = useState<Program[]>([]);
    const [modules, setModules] = useState<ProgramModule[]>([]);
    const [selectedProgramId, setSelectedProgramId] = useState<string>('');
    const [selectedModuleId, setSelectedModuleId] = useState<string>('');

    useEffect(() => {
        if (instituteId) {
            getPrograms(instituteId).then(setPrograms).catch(console.error);
        }
    }, [instituteId]);

    useEffect(() => {
        if (selectedProgramId) {
            const selectedProgram = programs.find(p => p.id === selectedProgramId);
            setModules(selectedProgram?.modules || []);
            setSelectedModuleId(''); // Reset module when program changes
        } else {
            setModules([]);
        }
    }, [selectedProgramId, programs]);


    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setFile(event.target.files[0]);
        }
    };

    const handleDownloadTemplate = () => {
        const worksheet = XLSX.utils.json_to_sheet([
            { 
                name: "Matemática Aplicada", 
                code: "MA-101", 
                credits: 4, 
                theoreticalHours: 2,
                practicalHours: 2,
                period: "MAR-JUL",
                unitType: "Especifica",
            },
        ]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Unidades");
        XLSX.writeFile(workbook, "plantilla_unidades_simplificada.xlsx");
        toast({
            title: "Plantilla Descargada",
            description: "Complete la plantilla con los datos de las unidades para el módulo seleccionado.",
            duration: 5000
        })
    };

    const handleUpload = async () => {
        if (!file || !selectedProgramId || !selectedModuleId) {
            toast({
                title: 'Información Faltante',
                description: 'Por favor, selecciona un programa, un módulo y un archivo antes de subir.',
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

                const unitsToUpload: Omit<Unit, 'id' | 'totalHours'>[] = json.map(row => ({
                    programId: selectedProgramId,
                    moduleId: selectedModuleId,
                    name: String(row.name),
                    code: String(row.code),
                    credits: Number(row.credits),
                    theoreticalHours: Number(row.theoreticalHours),
                    practicalHours: Number(row.practicalHours),
                    period: String(row.period) as any,
                    unitType: String(row.unitType) as any,
                }));

                await bulkAddUnits(instituteId, unitsToUpload);

                toast({
                    title: '¡Éxito!',
                    description: `${unitsToUpload.length} unidades han sido agregadas al módulo seleccionado.`,
                });
                onUploadSuccess();
                setFile(null);
                 const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement | null;
                if (fileInput) {
                    fileInput.value = '';
                }

            } catch (error) {
                 console.error("Error en carga masiva:", error);
                toast({
                    title: 'Error en la Carga',
                    description: 'Hubo un problema al procesar el archivo. Revisa el formato y los datos.',
                    variant: 'destructive',
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
                    <CardTitle>Paso 1: Seleccionar Programa y Módulo</CardTitle>
                    <CardDescription>Elija el programa de estudios y el módulo específico al que desea agregar las unidades didácticas.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
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
                         <div className="space-y-2">
                             <label className="text-sm font-medium">Módulo</label>
                            <Select onValueChange={setSelectedModuleId} value={selectedModuleId} disabled={!selectedProgramId || loading}>
                                <SelectTrigger>
                                <SelectValue placeholder="Seleccione un módulo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {modules.map((module) => (
                                    <SelectItem key={module.code} value={module.code}>
                                        {module.name} ({module.code})
                                    </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

             <Card className="bg-muted/50 border-dashed">
                <CardHeader>
                    <CardTitle>Paso 2: Preparar y Subir Archivo</CardTitle>
                    <CardDescription>Descargue la plantilla simplificada, llénela con las unidades correspondientes al módulo seleccionado y luego suba el archivo.</CardDescription>
                </CardHeader>
                <CardContent>
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
                        <Button onClick={handleUpload} disabled={!file || !selectedProgramId || !selectedModuleId || loading} className="w-full">
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
