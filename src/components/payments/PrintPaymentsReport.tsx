"use client";

import React from 'react';
import type { Payment, Institute, PaymentConcept } from '@/types';
import type { DateRange } from 'react-day-picker';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { DollarSign, Receipt, BarChart, TrendingUp } from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';

interface PrintPaymentsReportProps {
    payments: Payment[];
    stats: any;
    filters: {
        dateRange?: DateRange;
        dniSearch: string;
        conceptSearch: string;
    };
    institute: Institute | null;
    concepts: PaymentConcept[];
}

const StatCardPrint = ({ title, value, icon: Icon }: { title: string, value: string | number, icon: React.ElementType }) => (
    <div className="border p-3 rounded-md bg-gray-50/30">
        <div className="flex flex-row items-center justify-between space-y-0 pb-1.5">
            <h3 className="text-[8pt] uppercase font-bold text-gray-600 leading-tight">{title}</h3>
            <Icon className="h-3 w-3 text-gray-400" />
        </div>
        <div>
            <div className="text-[12pt] font-black tracking-tight truncate">{value}</div>
        </div>
    </div>
);


export function PrintPaymentsReport({ payments, stats, filters, institute, concepts }: PrintPaymentsReportProps) {
    const today = new Date();

    const getFilterDescription = () => {
        const descriptions = [];
        if (filters.dateRange?.from && filters.dateRange?.to) {
            descriptions.push(`Fechas: ${format(filters.dateRange.from, 'dd/MM/yy')} - ${format(filters.dateRange.to, 'dd/MM/yy')}`);
        }
        if (filters.dniSearch) {
            descriptions.push(`DNI: ${filters.dniSearch}`);
        }
        if (filters.conceptSearch !== 'all') {
            descriptions.push(`Concepto: ${filters.conceptSearch}`);
        }
        return descriptions.length > 0 ? descriptions.join(' | ') : 'Sin filtros adicionales';
    }

    return (
        <div className="printable-area p-8 font-sans text-black">
            <div className="page-break">
                <header className="flex items-center justify-between mb-4 border-b pb-4">
                    <div className="flex items-center gap-4">
                        {institute?.logoUrl && (
                            <img src={institute.logoUrl} alt={`${institute.name} Logo`} className="w-[60px] h-[60px] object-contain" />
                        )}
                        <div>
                            <h1 className="text-lg font-bold leading-tight">{institute?.name || 'Nombre del Instituto'}</h1>
                            <p className="text-[9pt] uppercase tracking-wider font-semibold text-gray-600">Sistema de Gestión Administrativa</p>
                        </div>
                    </div>
                    <div className="text-[8pt] text-right leading-tight">
                        <p className="font-bold">FECHA DE EMISIÓN:</p>
                        <p>{format(today, 'dd/MM/yyyy')}</p>
                        <p>{format(today, 'HH:mm')}</p>
                    </div>
                </header>

                <div className="text-center my-6">
                    <h2 className="text-xl font-black uppercase tracking-widest border-y-2 border-black py-2">Reporte de Ingresos</h2>
                    <p className="text-[9pt] text-gray-600 mt-2">Filtros aplicados: {getFilterDescription()}</p>
                </div>

                <div className="grid grid-cols-4 gap-3 mb-8">
                    <StatCardPrint 
                        title="Ingresos Totales" 
                        value={`S/ ${stats.totalRevenue.toFixed(2)}`} 
                        icon={DollarSign} 
                    />
                    <StatCardPrint 
                        title="Total de Pagos" 
                        value={stats.totalPayments} 
                        icon={Receipt} 
                    />
                    <StatCardPrint 
                        title="Pago Promedio" 
                        value={`S/ ${stats.avgPayment.toFixed(2)}`} 
                        icon={BarChart} 
                    />
                    <StatCardPrint 
                        title="Concepto Principal" 
                        value={stats.topConcept.name} 
                        icon={TrendingUp} 
                    />
                </div>

                <h3 className="font-bold text-[10pt] mb-3 uppercase tracking-tight border-b border-black pb-1">Detalle de Pagos Aprobados</h3>
                <table className="w-full text-[8pt] border-collapse border border-black">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="border border-black p-1.5 text-center w-[30px]">N°</th>
                            <th className="border border-black p-1.5 text-left">FECHA PAGO</th>
                            <th className="border border-black p-1.5 text-left">COMPROBANTE</th>
                            <th className="border border-black p-1.5 text-left">PAGADOR / DNI</th>
                            <th className="border border-black p-1.5 text-left">CONCEPTO</th>
                            <th className="border border-black p-1.5 text-right w-[100px]">MONTO (S/)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payments.map((payment, index) => (
                            <tr key={payment.id} className="h-auto">
                                <td className="border border-black p-1 text-center font-mono">{index + 1}</td>
                                <td className="border border-black p-1">{format(payment.paymentDate.toDate(), 'dd/MM/yyyy')}</td>
                                <td className="border border-black p-1 font-mono">{payment.receiptNumber || 'S/N'}</td>
                                <td className="border border-black p-1 leading-tight">
                                    <span className="font-bold block">{payment.payerName}</span>
                                    <span className="text-[7pt] font-mono text-gray-600">{payment.payerId}</span>
                                </td>
                                <td className="border border-black p-1">{payment.concept}</td>
                                <td className="border border-black p-1 text-right font-bold">
                                    {payment.amount.toFixed(2)}
                                </td>
                            </tr>
                        ))}
                        {payments.length === 0 && (
                            <tr>
                                <td colSpan={6} className="border border-black p-8 text-center text-gray-500 italic">No se encontraron pagos con los filtros seleccionados.</td>
                            </tr>
                        )}
                    </tbody>
                    <tfoot className="bg-gray-50">
                        <tr>
                            <td colSpan={5} className="border border-black p-2 text-right font-black uppercase text-[10pt]">TOTAL RECAUDADO</td>
                            <td className="border border-black p-2 text-right font-black text-[11pt] bg-gray-100">
                                S/ {stats.totalRevenue.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                            </td>
                        </tr>
                    </tfoot>
                </table>

                <div className="mt-16 flex justify-around no-print-break">
                    <div className="border-t border-black px-12 pt-1 text-center">
                        <p className="font-bold uppercase text-[9pt]">Firma de Tesorería</p>
                    </div>
                    <div className="border-t border-black px-12 pt-1 text-center">
                        <p className="font-bold uppercase text-[9pt]">V° B° Administración</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
