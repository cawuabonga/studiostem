"use client";

import React from 'react';
import Image from 'next/image';
import type { Institute, Program, Unit, Teacher } from '@/types';
import { format } from 'date-fns';

interface PrintLayoutProps {
    institute: Institute | null;
    program: Program | null;
    unit: Unit;
    teacher: Teacher | null;
    title: string;
    children: React.ReactNode;
}

export function PrintLayout({ institute, program, unit, teacher, title, children }: PrintLayoutProps) {
    const today = new Date();

    return (
        <div className="printable-area">
            <header className="print-header flex items-center justify-between border-b-2 border-black pb-2 mb-4">
                <div className="flex items-center gap-4">
                    {institute?.logoUrl && (
                        <Image src={institute.logoUrl} alt={`${institute.name} Logo`} width={60} height={60} className="object-contain" />
                    )}
                    <div>
                         <h1 className="text-base font-bold leading-tight">{institute?.name || 'Nombre del Instituto'}</h1>
                         <p className="text-[8pt] text-gray-600 uppercase tracking-tight">Sistema de Gestión Académica</p>
                    </div>
                </div>
                 <div className="flex flex-col items-end justify-center">
                     <p className="text-[7pt] text-right leading-tight font-medium">
                        Fecha de Emisión: {format(today, 'dd/MM/yyyy')}<br/>
                        Hora de Emisión: {format(today, 'HH:mm')}
                    </p>
                </div>
            </header>

            <div className="text-center my-4">
                <h2 className="text-sm font-bold uppercase border-y border-black py-1">{title}</h2>
            </div>
            
            <table className="print-info-table w-full mb-6">
                <tbody className="text-[8pt]">
                    <tr>
                        <td className="label font-bold bg-gray-100 border border-black p-1 w-[15%]">Institución:</td>
                        <td className="border border-black p-1 w-[35%] font-medium">{institute?.name}</td>
                        <td className="label font-bold bg-gray-100 border border-black p-1 w-[15%]">Programa:</td>
                        <td className="border border-black p-1 w-[35%] font-medium">{program?.name}</td>
                    </tr>
                    <tr>
                        <td className="label font-bold bg-gray-100 border border-black p-1">Unidad:</td>
                        <td className="border border-black p-1 font-medium">{unit.name}</td>
                         <td className="label font-bold bg-gray-100 border border-black p-1">Docente:</td>
                        <td className="border border-black p-1 font-medium">{teacher?.fullName || 'No asignado'}</td>
                    </tr>
                     <tr>
                        <td className="label font-bold bg-gray-100 border border-black p-1">Periodo:</td>
                        <td className="border border-black p-1 font-medium">{unit.period}</td>
                        <td className="label font-bold bg-gray-100 border border-black p-1">Turno:</td>
                        <td className="border border-black p-1 font-medium">{unit.turno}</td>
                    </tr>
                </tbody>
            </table>

            <main className="w-full overflow-visible">
                {children}
            </main>
        </div>
    );
}
