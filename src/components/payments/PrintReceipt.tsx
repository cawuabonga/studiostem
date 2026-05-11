
"use client";

import React from 'react';
import type { Payment, Institute } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PrintReceiptProps {
    payment: Payment;
    institute: Institute | null;
}

export function PrintReceipt({ payment, institute }: PrintReceiptProps) {
    const today = new Date();

    return (
        <div className="printable-area p-8 font-sans text-black bg-white w-full max-w-[210mm] mx-auto border-2 border-black border-dashed">
            {/* Header del Recibo */}
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-black">
                <div className="flex items-center gap-4">
                    {institute?.logoUrl && (
                        <img 
                            src={institute.logoUrl} 
                            alt="Logo" 
                            className="w-[60px] h-[60px] object-contain" 
                        />
                    )}
                    <div>
                        <h1 className="text-sm font-bold uppercase leading-tight">{institute?.name || 'Nombre del Instituto'}</h1>
                        <p className="text-[8pt] text-gray-600 uppercase">Tesorería / Oficina de Administración</p>
                    </div>
                </div>
                <div className="border-2 border-black p-2 text-center rounded">
                    <h2 className="text-[10pt] font-black uppercase">RECIBO DE CAJA</h2>
                    <p className="text-[12pt] font-mono font-black">{payment.receiptNumber || 'S/N'}</p>
                </div>
            </div>

            {/* Contenido del Recibo */}
            <div className="space-y-4">
                <div className="grid grid-cols-12 gap-2 text-[9.5pt]">
                    <div className="col-span-3 font-bold uppercase text-gray-500">Recibimos de:</div>
                    <div className="col-span-9 font-black border-b border-black pb-0.5 uppercase">{payment.payerName}</div>
                    
                    <div className="col-span-3 font-bold uppercase text-gray-500">Documento:</div>
                    <div className="col-span-3 font-mono border-b border-black pb-0.5">{payment.payerId}</div>
                    <div className="col-span-2 font-bold uppercase text-gray-500 text-right pr-2">Fecha:</div>
                    <div className="col-span-4 border-b border-black pb-0.5">{format(payment.paymentDate.toDate(), 'dd/MM/yyyy HH:mm')}</div>

                    <div className="col-span-3 font-bold uppercase text-gray-500 mt-2">Por Concepto:</div>
                    <div className="col-span-9 font-bold border-b border-black pb-0.5 mt-2 uppercase">{payment.concept}</div>

                    <div className="col-span-3 font-bold uppercase text-gray-500 mt-2">Observaciones:</div>
                    <div className="col-span-9 italic border-b border-black pb-0.5 mt-2 text-[8pt]">
                        {payment.observations || 'Sin observaciones adicionales.'}
                    </div>
                </div>

                {/* Importe */}
                <div className="flex justify-end pt-4">
                    <div className="bg-gray-100 border-2 border-black p-3 rounded-lg flex items-center gap-4">
                        <span className="text-[10pt] font-black uppercase">Importe Total:</span>
                        <span className="text-[20pt] font-black">S/ {payment.amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>
            </div>

            {/* Footer con firmas */}
            <div className="mt-16 grid grid-cols-2 gap-12 text-center">
                <div className="border-t border-black pt-2">
                    <p className="text-[8pt] font-black uppercase">Recibido por (Tesorería)</p>
                    <p className="text-[7pt] text-gray-500 mt-0.5">Sello y Firma Autorizada</p>
                </div>
                <div className="border-t border-black pt-2">
                    <p className="text-[8pt] font-black uppercase">Firma del Interesado</p>
                    <p className="text-[7pt] text-gray-500 mt-0.5">DNI: __________________</p>
                </div>
            </div>

            <div className="mt-8 pt-4 border-t border-gray-200 text-center">
                <p className="text-[7pt] text-gray-400 italic">Este documento es un comprobante interno de caja y debe conservarse para cualquier trámite académico posterior.</p>
                <p className="text-[6pt] text-gray-300 mt-1 uppercase tracking-tighter">STEM V2 - Plataforma de Gestión Educativa Modular</p>
            </div>
        </div>
    );
}
