
"use client";

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { addDidacticUnit } from '@/config/firebase';
import type { DidacticUnit, UnitPeriod, UnitType } from '@/types';
import { Label } from '../ui/label';
import { FileDown, Upload } from 'lucide-react';

interface BulkUploadUnitsProps {
  onUploadComplete: () => void;
  instituteId: string;
}

const REQUIRED_HEADERS = [
  'name', 'studyProgram', 'period', 'module', 'unitType', 
  'credits', 'theoreticalHours', 'practicalHours'
];

export function BulkUploadUnits({ onUploadComplete, instituteId }: BulkUploadUnitsProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.type === 'application/vnd.ms-excel') {
        setSelectedFile(file);
      } else {
        toast({
          title: 'Archivo no válido',
          description: 'Por favor, seleccione un archivo de Excel (.xlsx).',
          variant: 'destructive',
        });
        setSelectedFile(null);
        event.target.value = ''; // Reset file input
      }
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        name: 'Ejemplo: Interacción Humano-Computador',
        studyProgram: 'Desarrollo de Sistemas de Información',
        period: 'MAR-JUL',
        module: 'Módulo 03',
        unitType: 'Específica',
        credits: 4,
        theoreticalHours: 2,
        practicalHours: 4,
      }
    ];
    const worksheet = XLSX.utils.json_to_sheet(templateData, { header: REQUIRED_HEADERS });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'PlantillaUnidades');
    XLSX.writeFile(workbook, 'plantilla_unidades_didacticas.xlsx');
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: 'No hay archivo',
        description: 'Por favor, seleccione un archivo para subir.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
            throw new Error("El archivo de Excel está vacío o no tiene el formato correcto.");
        }

        const unitsToUpload: Omit<DidacticUnit, 'id'>[] = [];
        for (const row of jsonData) {
          // Validate headers
          const rowHeaders = Object.keys(row);
          const missingHeaders = REQUIRED_HEADERS.filter(h => !rowHeaders.includes(h));
          if (missingHeaders.length > 0) {
            throw new Error(`Faltan las siguientes columnas en el archivo: ${missingHeaders.join(', ')}`);
          }

          const th = Number(row.theoreticalHours) || 0;
          const ph = Number(row.practicalHours) || 0;
          const totalHours = th + ph;

          const unit: Omit<DidacticUnit, 'id'> = {
            name: String(row.name),
            studyProgram: String(row.studyProgram),
            period: row.period as UnitPeriod,
            module: String(row.module),
            unitType: row.unitType as UnitType,
            credits: Number(row.credits),
            theoreticalHours: th,
            practicalHours: ph,
            totalHours: totalHours,
          };
          // Basic validation
          if (!unit.name || !unit.studyProgram || !unit.period || !unit.module || !unit.unitType) {
            throw new Error(`Fila inválida encontrada: ${JSON.stringify(row)}. Asegúrate de que todos los campos de texto estén completos.`);
          }
          unitsToUpload.push(unit);
        }

        await Promise.all(unitsToUpload.map(unit => addDidacticUnit(instituteId, unit)));

        toast({
          title: '¡Éxito!',
          description: `${unitsToUpload.length} unidades didácticas han sido cargadas correctamente.`,
        });
        onUploadComplete();
        setSelectedFile(null);
        // This is a bit of a hack to reset the file input visually
        const fileInput = document.getElementById('bulk-upload-input') as HTMLInputElement;
        if(fileInput) fileInput.value = '';

      } catch (error: any) {
        console.error("Error processing Excel file:", error);
        toast({
          title: 'Error en la Carga',
          description: error.message || 'No se pudo procesar el archivo. Revisa el formato y los datos.',
          variant: 'destructive',
        });
      } finally {
        setIsUploading(false);
      }
    };

    reader.onerror = (error) => {
      console.error("FileReader error:", error);
      toast({
        title: 'Error de Lectura',
        description: 'No se pudo leer el archivo seleccionado.',
        variant: 'destructive',
      });
      setIsUploading(false);
    };

    reader.readAsArrayBuffer(selectedFile);
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
            <FileDown className="mr-2 h-4 w-4" />
            Descargar Plantilla
        </Button>
      </div>

      <div className="space-y-1">
        <Label htmlFor="bulk-upload-input" className="text-sm font-normal">Subir Archivo Excel</Label>
        <div className="flex items-center gap-2">
            <Input
                id="bulk-upload-input"
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="flex-grow h-9"
                disabled={isUploading}
            />
            <Button size="sm" onClick={handleUpload} disabled={!selectedFile || isUploading}>
                {isUploading ? (
                    'Cargando...'
                ) : (
                    <>
                        <Upload className="mr-2 h-4 w-4" />
                        Cargar
                    </>
                )}
            </Button>
        </div>
      </div>
    </div>
  );
}
