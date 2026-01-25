"use client";

import React from 'react';
import type { SupplyRequest, Institute } from '@/types';
import Image from 'next/image';
import { format } from 'date-fns';

interface PrintPecosaProps {
    request: SupplyRequest;
    institute: Institute | null;
}

export function PrintPecosa({ request, institute }: PrintPecosaProps) {
    const today = new Date();

    return (
        <div className="print-page-preview p-8 font-sans text-black bg-white">
             <header className="print-header flex items-center justify-between mb-4 pb-4 border-b-2 border-black">
                <div className="flex items-center gap-4">
                    {institute?.logoUrl && (
                        <Image src={institute.logoUrl} alt={`${institute?.name} Logo`} width={80} height={80} className="object-contain" />
                    )}
                    <div className="text-center">
                        <h1 className="text-xl font-bold">{institute?.name || 'Nombre del Instituto'}</h1>
                        <p className="text-sm">ÁREA DE ABASTECIMIENTO</p>
                    </div>
                </div>
                <div className="border-2 border-black p-2 text-center">
                    <h2 className="font-bold text-lg">PECOSA N°</h2>
                    <p className="font-mono text-base">{request.pecosaCode || 'S/C'}</p>
                </div>
            </header>

            <div className="text-center my-6">
                <h2 className="text-2xl font-bold uppercase">PEDIDO COMPROBANTE DE SALIDA</h2>
            </div>
            
            <table className="print-info-table w-full mb-6 text-sm">
                 <tbody>
                    <tr>
                        <td className="label w-[20%]">Solicitante:</td>
                        <td>{request.requesterName}</td>
                        <td className="label w-[20%]">Fecha de Solicitud:</td>
                        <td>{format(request.createdAt.toDate(), 'dd/MM/yyyy')}</td>
                    </tr>
                    <tr>
                        <td className="label">Área/Oficina:</td>
                        <td>{/* Placeholder */}</td>
                        <td className="label">Fecha de Entrega:</td>
                        <td>{request.processedAt ? format(request.processedAt.toDate(), 'dd/MM/yyyy') : format(today, 'dd/MM/yyyy')}</td>
                    </tr>
                </tbody>
            </table>
            
            <table className="w-full text-xs border-collapse border border-black">
                 <thead className="bg-gray-100">
                    <tr>
                        <th className="border p-2 text-center">ITEM</th>
                        <th className="border p-2 text-left">DESCRIPCIÓN DEL INSUMO</th>
                        <th className="border p-2 text-center">U.M.</th>
                        <th className="border p-2 text-center">CANTIDAD</th>
                    </tr>
                </thead>
                 <tbody>
                    {request.items.map((item, index) => (
                        <tr key={item.itemId}>
                            <td className="border p-1 text-center">{index + 1}</td>
                            <td className="border p-1">{item.name}</td>
                            <td className="border p-1 text-center">{item.unitOfMeasure}</td>
                            <td className="border p-1 text-center">{item.approvedQuantity ?? item.requestedQuantity}</td>
                        </tr>
                    ))}
                     {/* Add empty rows for spacing */}
                    {Array.from({ length: Math.max(0, 10 - request.items.length) }).map((_, i) => (
                        <tr key={`empty-${i}`} style={{ height: '24px' }}>
                            <td className="border"></td>
                            <td className="border"></td>
                            <td className="border"></td>
                            <td className="border"></td>
                        </tr>
                    ))}
                </tbody>
            </table>
            
             <footer className="text-center mt-32 grid grid-cols-2 gap-8">
                <div className="inline-block border-t border-black px-8 py-2 mx-auto">
                    <p>Entregado por</p>
                    <p className="text-xs mt-1">Nombre y Firma</p>
                </div>
                 <div className="inline-block border-t border-black px-8 py-2 mx-auto">
                    <p>Recibido por</p>
                     <p className="text-xs mt-1">Nombre y Firma</p>
                </div>
            </footer>
        </div>
    );
}
