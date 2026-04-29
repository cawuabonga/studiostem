
"use client";

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { bulkRegisterPayments, getStudentProfiles, getStaffProfiles, getPaymentConcepts } from '@/config/firebase';
import type { Payment, StudentProfile, StaffProfile, PaymentConcept, PayerType } from '@/types';
import { FileDown, Upload, Loader2, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Card, CardContent } from '../ui/card';
import { Timestamp } from 'firebase/firestore';

interface BulkUploadPaymentsProps {
    onUploadSuccess: () => void;
}

interface ParsedPaymentRow {
    documentId: string;
    conceptName: string;
    amount: number;
    date: Date;
    receiptNumber: string;
    observations?: string;
    // Resolved data
    payerName?: string;
    payerType?: PayerType;
    payerAuthUid?: string;
    isValid: boolean;
    error?: string;
}

export function BulkUploadPayments({ onUploadSuccess }: BulkUploadPaymentsProps) {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [previewData, setPreviewData] = useState<ParsedPaymentRow[]>([]);
    const { toast } = useToast();
    const { instituteId, user } = useAuth();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setFile(event.target.files[0]);
            setPreviewData([]);
        }
    };

    const handleDownloadTemplate = () => {
        const worksheet = XLSX.utils.json_to_sheet([
            { 
                documentId: "12345678",
                concept: "Matrícula",
                amount: 150.00,
                date: "2024-03-15",
                receiptNumber: "B001-00123",
                observations: "Matrícula extemporánea"
            },
        ]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Pagos");
        XLSX.writeFile(workbook, "plantilla_carga_pagos.xlsx");
    };

    const handlePreview = async () => {
        if (!file || !instituteId) return;
        setLoading(true);

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet) as any[];

                const [students, staff, concepts] = await Promise.all([
                    getStudentProfiles(instituteId),
                    getStaffProfiles(instituteId),
                    getPaymentConcepts(instituteId)
                ]);

                const studentMap = new Map(students.map(s => [s.documentId, s]));
                const staffMap = new Map(staff.map(s => [s.documentId, s]));
                const conceptNames = new Set(concepts.map(c => c.name.toLowerCase()));

                const rows: ParsedPaymentRow[] = json.map((row, index) => {
                    const docId = String(row.documentId || '').trim();
                    const conceptName = String(row.concept || '').trim();
                    const amount = Number(row.amount);
                    const receiptNumber = String(row.receiptNumber || '').trim();
                    const date = row.date instanceof Date ? row.date : new Date(row.date);
                    
                    let payerName = '';
                    let payerType: PayerType = 'external';
                    let payerAuthUid = '';
                    let isValid = true;
                    let error = '';

                    const student = studentMap.get(docId);
                    const staffMember = staffMap.get(docId);

                    if (student) {
                        payerName = student.fullName;
                        payerType = 'student';
                        payerAuthUid = student.linkedUserUid || '';
                    } else if (staffMember) {
                        payerName = staffMember.displayName;
                        payerType = 'staff';
                        payerAuthUid = staffMember.linkedUserUid || '';
                    } else {
                        payerName = 'PAGADOR EXTERNO';
                        payerType = 'external';
                    }

                    if (!docId) { isValid = false; error = "DNI faltante"; }
                    else if (!conceptName) { isValid = false; error = "Concepto faltante"; }
                    else if (!conceptNames.has(conceptName.toLowerCase())) { isValid = false; error = "Concepto no existe en catálogo"; }
                    else if (isNaN(amount) || amount <= 0) { isValid = false; error = "Monto inválido"; }
                    else if (!receiptNumber) { isValid = false; error = "N° Recibo faltante"; }
                    else if (isNaN(date.getTime())) { isValid = false; error = "Fecha inválida"; }

                    return {
                        documentId: docId,
                        conceptName,
                        amount,
                        date,
                        receiptNumber,
                        observations: row.observations || '',
                        payerName,
                        payerType,
                        payerAuthUid,
                        isValid,
                        error
                    };
                });

                setPreviewData(rows);
            } catch (error) {
                toast({ title: "Error", description: "No se pudo procesar el archivo Excel.", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleConfirmBulkUpload = async () => {
        if (!instituteId || previewData.length === 0 || !user) return;
        
        const validRows = previewData.filter(r => r.isValid);
        if (validRows.length === 0) {
            toast({ title: "Sin datos válidos", description: "No hay registros correctos para subir.", variant: "destructive" });
            return;
        }

        setIsProcessing(true);
        try {
            const paymentsToRegister: Omit<Payment, 'id' | 'voucherUrl' | 'status' | 'createdAt' | 'processedAt'>[] = validRows.map(row => ({
                payerId: row.documentId,
                payerName: row.payerName || 'Externo',
                payerType: row.payerType || 'external',
                payerAuthUid: row.payerAuthUid || user.uid,
                concept: row.conceptName,
                amount: row.amount,
                paymentDate: Timestamp.fromDate(row.date),
                operationNumber: row.receiptNumber,
                receiptNumber: row.receiptNumber,
                observations: row.observations,
            }));

            await bulkRegisterPayments(instituteId, paymentsToRegister);
            toast({ title: "Carga Exitosa", description: `Se han registrado ${paymentsToRegister.length} pagos correctamente.` });
            setPreviewData([]);
            setFile(null);
            onUploadSuccess();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsProcessing(false);
        }
    };

    const stats = {
        total: previewData.length,
        valid: previewData.filter(r => r.isValid).length,
        invalid: previewData.filter(r => !r.isValid).length
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={handleDownloadTemplate} variant="outline" className="w-full sm:w-auto">
                    <FileDown className="mr-2 h-4 w-4" /> Descargar Plantilla
                </Button>
                <div className="flex-grow flex gap-2">
                    <Input type="file" onChange={handleFileChange} accept=".xlsx, .xls" className="flex-1" />
                    <Button onClick={handlePreview} disabled={!file || loading}>
                        {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Previsualizar"}
                    </Button>
                </div>
            </div>

            {previewData.length > 0 && (
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                    <div className="grid grid-cols-3 gap-4">
                        <Card className="bg-blue-50 border-blue-200"><CardContent className="p-4 text-center"><p className="text-xs uppercase font-bold text-blue-600">Total</p><p className="text-2xl font-black">{stats.total}</p></CardContent></Card>
                        <Card className="bg-green-50 border-green-200"><CardContent className="p-4 text-center"><p className="text-xs uppercase font-bold text-green-600">Válidos</p><p className="text-2xl font-black">{stats.valid}</p></CardContent></Card>
                        <Card className="bg-red-50 border-red-200"><CardContent className="p-4 text-center"><p className="text-xs uppercase font-bold text-red-600">Errores</p><p className="text-2xl font-black">{stats.invalid}</p></CardContent></Card>
                    </div>

                    <div className="rounded-md border max-h-[400px] overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>DNI</TableHead>
                                    <TableHead>Pagador Identificado</TableHead>
                                    <TableHead>Concepto</TableHead>
                                    <TableHead>Monto (S/)</TableHead>
                                    <TableHead>Recibo</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {previewData.map((row, idx) => (
                                    <TableRow key={idx} className={!row.isValid ? "bg-red-50/50" : ""}>
                                        <TableCell>
                                            {row.isValid ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <TooltipProvider><Tooltip><TooltipTrigger><AlertTriangle className="h-4 w-4 text-red-500" /></TooltipTrigger><TooltipContent>{row.error}</TooltipContent></Tooltip></TooltipProvider>}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">{row.documentId}</TableCell>
                                        <TableCell>
                                            <p className="text-xs font-bold">{row.payerName}</p>
                                            <p className="text-[10px] text-muted-foreground">{row.payerType}</p>
                                        </TableCell>
                                        <TableCell className="text-xs">{row.conceptName}</TableCell>
                                        <TableCell className="font-bold">S/ {row.amount.toFixed(2)}</TableCell>
                                        <TableCell className="font-mono text-xs">{row.receiptNumber}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex justify-end gap-4 items-center bg-muted p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">Solo se procesarán los registros marcados como válidos.</p>
                        <Button onClick={handleConfirmBulkUpload} disabled={isProcessing || stats.valid === 0} size="lg">
                            {isProcessing ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Upload className="mr-2 h-4 w-4" />}
                            Registrar {stats.valid} Pagos
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
