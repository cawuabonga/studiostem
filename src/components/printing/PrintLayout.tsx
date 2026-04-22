
"use client";

import React from 'react';
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
        <div className="printable-area bg-white text-black p-2">
            <header className="print-header flex items-center justify-between border-b-2 border-black pb-2 mb-4">
                <div className="flex items-center gap-6">
                    {institute?.logoUrl && (
                        /* Use standard img for better print support and cross-origin compatibility */
                        <img 
                            src={institute.logoUrl} 
                            alt={`${institute.name} Logo`} 
                            className="w-[70px] h-[70px] object-contain" 
                        />
                    )}
                    <div>
                         <h1 className="text-lg font-bold leading-tight">{institute?.name || 'Nombre del Instituto'}</h1>
                         <p className="text-[9pt] text-gray-700 uppercase tracking-wider font-black">Sistema de Gestión Académica</p>
                    </div>
                </div>
                 <div className="flex flex-col items-end justify-center">
                     <p className="text-[8pt] text-right leading-tight font-bold">
                        FECHA: {format(today, 'dd/MM/yyyy')}<br/>
                        HORA: {format(today, 'HH:mm')}
                    </p>
                </div>
            </header>

            <div className="text-center my-4">
                <h2 className="text-base font-black uppercase border-y-2 border-black py-2 tracking-widest bg-gray-50">{title}</h2>
            </div>
            
            <table className="print-info-table w-full mb-6">
                <tbody className="text-[9pt]">
                    <tr>
                        <td className="label font-bold bg-gray-100 border border-black p-1.5 w-[12%]">Programa:</td>
                        <td className="border border-black p-1.5 w-[38%] font-semibold uppercase">{program?.name}</td>
                        <td className="label font-bold bg-gray-100 border border-black p-1.5 w-[12%]">Docente:</td>
                        <td className="border border-black p-1.5 w-[38%] font-semibold uppercase">{teacher?.fullName || 'No asignado'}</td>
                    </tr>
                    <tr>
                        <td className="label font-bold bg-gray-100 border border-black p-1.5">Unidad:</td>
                        <td className="border border-black p-1.5 font-semibold uppercase">{unit.name}</td>
                        <td className="label font-bold bg-gray-100 border border-black p-1.5">Ciclo/Turno:</td>
                        <td className="border border-black p-1.5 font-semibold uppercase">{unit.semester}° Ciclo - {unit.turno}</td>
                    </tr>
                </tbody>
            </table>

            <main className="w-full overflow-visible">
                {children}
            </main>
        </div>
    );
}
