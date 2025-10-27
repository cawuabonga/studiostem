
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getMatriculationReportData } from '@/config/firebase';
import type { MatriculationReportData, StudentProfile } from '@/types';
import { Printer, Check, X } from 'lucide-react';
import { PrintMatriculationList } from './PrintMatriculationList';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

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
        
        // This is a workaround to get tailwind styles into the print window
        const styles = Array.from(document.styleSheets)
            .map(s => s.href ? `<link rel="stylesheet" href="${s.href}">` : '')
            .join('');

        if (printWindow && printContent) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Reporte de Matrícula</title>
                        ${styles}
                         <style>
                            @media print {
                                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                                .no-print { display: none !important; }
                                .page-break { page-break-after: always; }
                            }
                        </style>
                    </head>
                    <body>${printContent}</body>
                </html>
            `);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 500);
        }
    };
    
    const uniqueStudents = useMemo(() => {
        if (!reportData) return [];
        const studentMap = new Map<string, StudentProfile>();
        reportData.units.forEach(unitData => {
            unitData.students.forEach(student => {
                if (!studentMap.has(student.documentId)) {
                    studentMap.set(student.documentId, student);
                }
            });
        });
        return Array.from(studentMap.values()).sort((a,b) => a.lastName.localeCompare(b.lastName));
    }, [reportData]);

    const unitStudentMap = useMemo(() => {
        if (!reportData) return new Map();
        const map = new Map<string, Set<string>>();
        reportData.units.forEach(unitData => {
            const studentIds = new Set(unitData.students.map(s => s.documentId));
            map.set(unitData.unit.id, studentIds);
        });
        return map;
    }, [reportData]);


    if (loading) {
        return (
            <Card>
                <CardHeader><Skeleton className="h-8 w-3/4" /></CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-48 w-full" />
                </CardContent>
            </Card>
        );
    }
    
    if (!reportData || reportData.units.length === 0) {
        return (
            <Card>
                <CardHeader><CardTitle>Sin Resultados</CardTitle></CardHeader>
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
                            Mostrando {reportData.units.length} unidades y {uniqueStudents.length} estudiantes para el programa "{reportData.program.name}" - Semestre {semester} - Año {year}.
                        </CardDescription>
                    </div>
                    <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Imprimir Reporte</Button>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Units Summary Card */}
                    <Card className="bg-muted/40">
                        <CardHeader><CardTitle className="text-lg">Unidades Didácticas del Semestre</CardTitle></CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                                {reportData.units.map(unitData => (
                                    <div key={unitData.unit.id} className="flex gap-2">
                                        <span className="font-mono text-muted-foreground">{unitData.unit.code}</span>
                                        <span className="font-medium flex-1">{unitData.unit.name}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Matriculation Matrix */}
                    <div className="rounded-md border overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="sticky left-0 bg-background z-10 w-[50px]">N°</TableHead>
                                    <TableHead className="sticky left-[50px] bg-background z-10 min-w-[250px]">Apellidos y Nombres</TableHead>
                                    {reportData.units.map(unitData => (
                                        <TableHead key={unitData.unit.id} className="text-center min-w-[80px]">{unitData.unit.code}</TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {uniqueStudents.map((student, index) => (
                                    <TableRow key={student.documentId}>
                                        <TableCell className="sticky left-0 bg-background z-10 text-center">{index + 1}</TableCell>
                                        <TableCell className="sticky left-[50px] bg-background z-10 font-medium">{student.fullName}</TableCell>
                                        {reportData.units.map(unitData => (
                                            <TableCell key={unitData.unit.id} className="text-center">
                                                {unitStudentMap.get(unitData.unit.id)?.has(student.documentId) ? (
                                                    <Check className="h-5 w-5 text-green-500 mx-auto" />
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <div id="print-area" className="hidden no-print">
                <PrintMatriculationList data={reportData} semester={semester} year={year} />
            </div>
        </>
    );
}
