"use client";

import React from 'react';
import type { Payment, Institute, PaymentConcept } from '@/types';
import type { DateRange } from 'react-day-picker';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { DollarSign, Receipt, BarChart, TrendingUp } from 'lucide-react';
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
    <div className="border border-black p-3 rounded-md bg-gray-50/50 flex flex-col justify-between h-full">
        <div className="flex flex-row items-center justify-between space-y-0 pb-1.5">
            <h3 className="text-[7.5pt] uppercase font-black text-gray-600 leading-tight">{title}</h3>
            <Icon className="h-3.5 w-3.5 text-gray-400" />
        </div>
        <div>
            <div className="text-[13pt] font-black tracking-tighter truncate">{value}</div>
        </div>
    </div>
);


export function PrintPaymentsReport({ payments, stats, filters, institute, concepts }: PrintPaymentsReportProps) {
    const today = new Date();

    const getFilterDescription = () => {
        const descriptions = [];
        if (filters.dateRange?.from && filters.dateRange?.to) {
            descriptions.push(`Rango: ${format(filters.dateRange.from, 'dd/MM/yyyy')} al ${format(filters.dateRange.to, 'dd/MM/yyyy')}`);
        }
        if (filters.dniSearch) {
            descriptions.push(`DNI: ${filters.dniSearch}`);
        }
        if (filters.conceptSearch !== 'all') {
            descriptions.push(`Concepto: ${filters.conceptSearch}`);
        }
        return descriptions.length > 0 ? descriptions.join(' | ') : 'Reporte General';
    }

    return (
        <div className="printable-area p-4 font-sans text-black bg-white">
            {/* Header Institucional con Logo */}
            <div className="flex items-center justify-between mb-2 border-b-2 border-black pb-4">
                <div className="flex items-center gap-4">
                    {institute?.logoUrl && (
                        <img 
                            src={institute.logoUrl} 
                            alt={`${institute.name} Logo`} 
                            className="w-[85px] h-[85px] object-contain" 
                        />
                    )}
                    <div>
                        <h1 className="text-xl font-black uppercase leading-tight text-black">{institute?.name || 'Nombre del Instituto'}</h1>
                        <p className="text-[9pt] uppercase tracking-[0.2em] font-bold text-gray-600">Sistema de Gestión de Tesorería</p>
                    </div>
                </div>
                <div className="text-[8.5pt] text-right leading-snug font-bold">
                    <p className="uppercase text-gray-500 text-[7pt]">Fecha de Emisión</p>
                    <p>{format(today, 'dd/MM/yyyy')}</p>
                    <p>{format(today, 'HH:mm')}</p>
                </div>
            </div>

            {/* Título Principal */}
            <div className="text-center my-8">
                <h2 className="text-2xl font-black uppercase tracking-tighter border-y-2 border-black py-4 bg-gray-50/30">
                    Reporte Consolidado de Ingresos
                </h2>
                <div className="mt-3 inline-block px-4 py-1 bg-black text-white text-[8pt] font-black uppercase tracking-widest rounded-full">
                    {getFilterDescription()}
                </div>
            </div>

            {/* Grid de Estadísticas en el Reporte */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                <StatCardPrint 
                    title="Ingresos Totales" 
                    value={`S/ ${stats.totalRevenue.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`} 
                    icon={DollarSign} 
                />
                <StatCardPrint 
                    title="Operaciones" 
                    value={stats.totalPayments} 
                    icon={Receipt} 
                />
                <StatCardPrint 
                    title="Ticket Promedio" 
                    value={`S/ ${stats.avgPayment.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`} 
                    icon={BarChart} 
                />
                <StatCardPrint 
                    title="Top Concepto" 
                    value={stats.topConcept.name} 
                    icon={TrendingUp} 
                />
            </div>

            <h3 className="font-black text-[10pt] mb-3 uppercase tracking-widest text-primary border-b border-black pb-1">
                Detalle de Operaciones Validadas
            </h3>
            
            {/* Tabla con tipografía compacta para evitar saltos de página */}
            <table className="w-full text-[7.5pt] border-collapse border-2 border-black">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border border-black p-1.5 text-center w-[30px] font-black">N°</th>
                        <th className="border border-black p-1.5 text-left font-black">FECHA</th>
                        <th className="border border-black p-1.5 text-left font-black">COMPROBANTE</th>
                        <th className="border border-black p-1.5 text-left font-black">PAGADOR / DNI</th>
                        <th className="border border-black p-1.5 text-left font-black">CONCEPTO</th>
                        <th className="border border-black p-1.5 text-right w-[100px] font-black">MONTO (S/)</th>
                    </tr>
                </thead>
                <tbody>
                    {payments.map((payment, index) => (
                        <tr key={payment.id} className="h-auto">
                            <td className="border border-black p-1.5 text-center font-mono font-bold text-gray-500">{index + 1}</td>
                            <td className="border border-black p-1.5">{format(payment.paymentDate.toDate(), 'dd/MM/yy')}</td>
                            <td className="border border-black p-1.5 font-mono font-bold">{payment.receiptNumber || 'S/N'}</td>
                            <td className="border border-black p-1.5 leading-tight">
                                <span className="font-black block uppercase">{payment.payerName}</span>
                                <span className="text-[6.5pt] font-mono font-bold text-gray-500">DNI: {payment.payerId}</span>
                            </td>
                            <td className="border border-black p-1.5 uppercase font-medium">{payment.concept}</td>
                            <td className="border border-black p-1.5 text-right font-black">
                                {payment.amount.toFixed(2)}
                            </td>
                        </tr>
                    ))}
                    {payments.length === 0 && (
                        <tr>
                            <td colSpan={6} className="border border-black p-12 text-center text-gray-400 italic text-[10pt]">No se encontraron registros para los filtros seleccionados.</td>
                        </tr>
                    )}
                </tbody>
                {payments.length > 0 && (
                    <tfoot className="bg-gray-50">
                        <tr>
                            <td colSpan={5} className="border-2 border-black p-2 text-right font-black uppercase text-[10pt]">TOTAL RECAUDADO</td>
                            <td className="border-2 border-black p-2 text-right font-black text-[12pt] bg-gray-200">
                                S/ {stats.totalRevenue.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                            </td>
                        </tr>
                    </tfoot>
                )}
            </table>

            {/* Área de Firmas - Optimizada para no romper página si hay poco espacio */}
            <div className="mt-20 grid grid-cols-2 gap-24 px-12 no-print-break">
                <div className="border-t-2 border-black pt-2 text-center">
                    <p className="font-black uppercase text-[9pt] leading-none mb-1">Firma de Tesorería</p>
                    <p className="text-[7pt] text-gray-500 font-bold uppercase tracking-widest">Responsable de Caja</p>
                </div>
                <div className="border-t-2 border-black pt-2 text-center">
                    <p className="font-black uppercase text-[9pt] leading-none mb-1">V° B° Administración</p>
                    <p className="text-[7pt] text-gray-500 font-bold uppercase tracking-widest">Sello Institucional</p>
                </div>
            </div>

            {/* Nota de pie de página */}
            <div className="mt-12 pt-4 border-t border-gray-100 text-center">
                <p className="text-[6.5pt] text-gray-300 uppercase font-black tracking-[0.4em]">STEM V2 • Plataforma de Gestión Educativa Modular</p>
            </div>
        </div>
    );
}
