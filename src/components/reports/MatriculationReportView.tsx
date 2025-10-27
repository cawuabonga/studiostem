
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getMatriculationReportData } from '@/config/firebase';
import type { MatriculationReportData } from '@/types';
import { Printer, User, BookOpen } from 'lucide-react';
import { PrintMatriculationList } from './PrintMatriculationList';

interface MatriculationReportViewProps {
    programId: string;
    year: string;
    semester: number;
}

export function MatriculationReportView({ programId, year, semester }: MatriculationReportViewProps) {
    const { toast } = useToast();
    const { instituteId } = useAuth();
    const [reportData, setReportData] = useState<MatriculationReportData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!instituteId) return;
        setLoading(true);
        try {
            const data = await getMatriculationReportData(instituteId, programId, year, semester);
            setReportData(data);
        } catch (error) {
            console.error("Error fetching matriculation report data:", error);
            toast({
                title: "Error",
                description: "No se pudo generar el reporte de matrícula.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [instituteId, programId, year, semester, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        const printContent = document.getElementById('print-area')?.innerHTML;
        const stylesheet = Array.from(document.styleSheets)
          .map(s => s.href ? `<link rel="stylesheet" href="${s.href}">` : '')
          .join('');

        if (printWindow && printContent) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Reporte de Matrícula</title>
                        ${stylesheet}
                        <style>
                            @media print {
                                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                                .no-print { display: none !important; }
                                .page-break { page-break-after: always; }
                            }
                        </style>
                    </head>
                    <body>
                        ${printContent}
                    </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => { // Allow content to load before printing
                printWindow.print();
                printWindow.close();
            }, 500);
        }
    };
    
    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-3/4" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                </CardContent>
            </Card>
        );
    }
    
    if (!reportData || reportData.units.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Sin Resultados</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-muted-foreground py-8">
                        No se encontraron unidades didácticas o estudiantes matriculados para los filtros seleccionados.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Reporte de Matrícula Generado</CardTitle>
                        <CardDescription>
                            Mostrando {reportData.units.length} unidades para el programa "{reportData.program.name}" - Semestre {semester} - Año {year}.
                        </CardDescription>
                    </div>
                    <Button onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimir Reporte
                    </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                    {reportData.units.map(unitData => (
                        <Card key={unitData.unit.id} className="bg-muted/30">
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <BookOpen className="h-5 w-5" /> {unitData.unit.name}
                                </CardTitle>
                                <CardDescription>
                                    Docente: {unitData.teacherName || 'No asignado'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {unitData.students.length > 0 ? (
                                    <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                                        {unitData.students.map(student => (
                                            <li key={student.documentId} className="flex items-center gap-2 p-2 border rounded-md bg-background">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                                <span>{student.fullName}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-center text-sm text-muted-foreground py-4">No hay estudiantes matriculados en esta unidad.</p>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </CardContent>
            </Card>
            <div id="print-area" className="hidden no-print">
                <PrintMatriculationList data={reportData} semester={semester} year={year} />
            </div>
        </>
    );
}
