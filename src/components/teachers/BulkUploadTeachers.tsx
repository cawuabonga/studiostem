
"use client";

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { addTeacher } from '@/config/firebase';
import type { Teacher, TeacherCondition } from '@/types';
import { Label } from '../ui/label';
import { FileDown, Upload } from 'lucide-react';

interface BulkUploadTeachersProps {
  onUploadComplete: () => void;
}

const REQUIRED_HEADERS = [
  'dni', 'fullName', 'email', 'phone', 'studyProgram', 'condition'
];

export function BulkUploadTeachers({ onUploadComplete }: BulkUploadTeachersProps) {
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
        event.target.value = '';
      }
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        dni: '12345678',
        fullName: 'Juan Pérez Ejemplo',
        email: 'juan.perez@ejemplo.com',
        phone: '987654321',
        studyProgram: 'Desarrollo de Sistemas de Información',
        condition: 'Contratado'
      }
    ];
    const worksheet = XLSX.utils.json_to_sheet(templateData, { header: REQUIRED_HEADERS });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'PlantillaDocentes');
    XLSX.writeFile(workbook, 'plantilla_docentes.xlsx');
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({ title: 'No hay archivo', description: 'Por favor, seleccione un archivo.', variant: 'destructive' });
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

        const teachersToUpload: Omit<Teacher, 'id'>[] = [];
        for (const row of jsonData) {
          const rowHeaders = Object.keys(row);
          const missingHeaders = REQUIRED_HEADERS.filter(h => !rowHeaders.includes(h));
          if (missingHeaders.length > 0) {
            throw new Error(`Faltan las siguientes columnas en el archivo: ${missingHeaders.join(', ')}`);
          }

          const teacher: Omit<Teacher, 'id'> = {
            dni: String(row.dni),
            fullName: String(row.fullName),
            email: String(row.email),
            phone: String(row.phone),
            studyProgram: String(row.studyProgram),
            condition: row.condition as TeacherCondition,
          };

          if (!teacher.dni || !teacher.fullName || !teacher.email || !teacher.studyProgram || !teacher.condition) {
            throw new Error(`Fila inválida encontrada: ${JSON.stringify(row)}. Asegúrate de que todos los campos requeridos estén completos.`);
          }
          if (teacher.condition !== 'Nombrado' && teacher.condition !== 'Contratado') {
             throw new Error(`Valor de condición inválido '${teacher.condition}' en fila: ${JSON.stringify(row)}. Debe ser 'Nombrado' or 'Contratado'.`);
          }

          teachersToUpload.push(teacher);
        }

        await Promise.all(teachersToUpload.map(teacher => addTeacher(teacher)));

        toast({
          title: '¡Éxito!',
          description: `${teachersToUpload.length} docentes han sido cargados correctamente.`,
        });
        onUploadComplete();
        setSelectedFile(null);
        const fileInput = document.getElementById('bulk-teacher-upload-input') as HTMLInputElement;
        if(fileInput) fileInput.value = '';

      } catch (error: any) {
        toast({
          title: 'Error en la Carga',
          description: error.message || 'No se pudo procesar el archivo.',
          variant: 'destructive',
        });
      } finally {
        setIsUploading(false);
      }
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
        <Label htmlFor="bulk-teacher-upload-input" className="text-sm font-normal">Subir Archivo Excel</Label>
        <div className="flex items-center gap-2">
            <Input
                id="bulk-teacher-upload-input"
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="flex-grow h-9"
                disabled={isUploading}
            />
            <Button size="sm" onClick={handleUpload} disabled={!selectedFile || isUploading}>
                {isUploading ? 'Cargando...' : <><Upload className="mr-2 h-4 w-4" />Cargar</>}
            </Button>
        </div>
      </div>
    </div>
  );
}
