
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
            <header className="print-header flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {institute?.logoUrl && (
                        <Image src={institute.logoUrl} alt={`${institute.name} Logo`} width={60} height={60} className="object-contain" />
                    )}
                    <div>
                         <h1 className="text-base font-bold leading-tight">{institute?.name || 'Nombre del Instituto'}</h1>
                         <p className="text-[8pt] text-gray-600">Sistema de Gestión Académica</p>
                    </div>
                </div>
                 <div className="flex items-center gap-4">
                     <p className="text-[7pt] text-right leading-tight">
                        Fecha y Hora de Emisión:<br/>
                        {format(today, 'dd/MM/yyyy HH:mm')}
                    </p>
                    <Image src="https://istjaq.edu.pe/wp-content/uploads/2024/05/logo-minedu-2024.png" alt="Ministerio de Educación" width={100} height={35} className="object-contain" data-ai-hint="education ministry" />
                </div>
            </header>

            <div className="text-center my-2">
                <h2 className="text-sm font-bold uppercase">{title}</h2>
            </div>
            
            <table className="print-info-table w-full mb-4">
                <tbody className="text-[8pt]">
                    <tr>
                        <td className="label font-bold bg-gray-50 border p-1 w-[15%]">Institución:</td>
                        <td className="border p-1 w-[35%]">{institute?.name}</td>
                        <td className="label font-bold bg-gray-50 border p-1 w-[15%]">Programa:</td>
                        <td className="border p-1 w-[35%]">{program?.name}</td>
                    </tr>
                    <tr>
                        <td className="label font-bold bg-gray-50 border p-1">Unidad:</td>
                        <td className="border p-1">{unit.name}</td>
                         <td className="label font-bold bg-gray-50 border p-1">Docente:</td>
                        <td className="border p-1">{teacher?.fullName || 'No asignado'}</td>
                    </tr>
                     <tr>
                        <td className="label font-bold bg-gray-50 border p-1">Periodo:</td>
                        <td className="border p-1">{unit.period}</td>
                        <td className="label font-bold bg-gray-50 border p-1">Turno:</td>
                        <td className="border p-1">{unit.turno}</td>
                    </tr>
                </tbody>
            </table>

            <main className="w-full overflow-visible">
                {children}
            </main>
        </div>
    );
}
