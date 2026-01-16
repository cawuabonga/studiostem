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
    <div className="border p-4 rounded-lg">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">{title}</h3>
            <Icon className="h-4 w-4 text-gray-500" />
        </div>
        <div>
            <div className="text-2xl font-bold">{value}</div>
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
        <div className="p-8 font-sans text-black">
            <header className="flex items-center justify-between mb-4 border-b pb-4">
                <div className="flex items-center gap-4">
                    {institute?.logoUrl && (
                        <Image src={institute.logoUrl} alt={`${institute.name} Logo`} width={60} height={60} className="object-contain" />
                    )}
                    <div>
                        <h1 className="text-lg font-bold">{institute?.name || 'Nombre del Instituto'}</h1>
                        <p className="text-sm">Sistema de Gestión Administrativa</p>
                    </div>
                </div>
                <div className="text-xs text-right">
                    <p>Fecha de Emisión: {format(today, 'dd/MM/yyyy')}</p>
                    <p>Hora de Emisión: {format(today, 'HH:mm')}</p>
                </div>
            </header>

            <div className="text-center my-6">
                <h2 className="text-xl font-bold uppercase">Reporte de Ingresos</h2>
                <p className="text-sm text-gray-600">Filtros aplicados: {getFilterDescription()}</p>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
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

            <h3 className="font-bold text-base mb-2">Detalle de Pagos Aprobados</h3>
            <table className="w-full text-xs border-collapse border border-gray-400">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="border p-2 text-left">Fecha Pago</th>
                        <th className="border p-2 text-left">N° Comprobante</th>
                        <th className="border p-2 text-left">Pagador</th>
                        <th className="border p-2 text-left">DNI</th>
                        <th className="border p-2 text-left">Concepto</th>
                        <th className="border p-2 text-right">Monto (S/)</th>
                    </tr>
                </thead>
                <tbody>
                     {payments.map((payment) => (
                        <tr key={payment.id} className="[&>td]:p-2">
                            <td className="border">{format(payment.paymentDate.toDate(), 'dd/MM/yyyy')}</td>
                            <td className="border">{payment.receiptNumber}</td>
                            <td className="border">{payment.payerName}</td>
                            <td className="border">{payment.payerId}</td>
                            <td className="border">{payment.concept}</td>
                            <td className="border text-right">{payment.amount.toFixed(2)}</td>
                        </tr>
                    ))}
                    {payments.length === 0 && (
                        <tr>
                            <td colSpan={6} className="border p-4 text-center text-gray-500">No se encontraron pagos con los filtros seleccionados.</td>
                        </tr>
                    )}
                </tbody>
                 <tfoot>
                    <tr>
                        <td colSpan={5} className="border p-2 text-right font-bold">TOTAL INGRESOS</td>
                        <td className="border p-2 text-right font-bold">{stats.totalRevenue.toFixed(2)}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}
