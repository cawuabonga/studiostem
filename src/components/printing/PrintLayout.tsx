
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
        <div className="printable-area bg-white text-black p-0 font-sans">
            {/* Header: Logo, Nombre (18pt) y Fecha en una sola fila equilibrada al mismo nivel */}
            <div className="mb-6 border-b-2 border-black pb-4 flex items-center justify-between">
                {/* Logo a la izquierda */}
                <div className="w-[100px] shrink-0">
                    {institute?.logoUrl ? (
                        <img 
                            src={institute.logoUrl} 
                            alt="Logo" 
                            className="w-[70px] h-[70px] object-contain" 
                        />
                    ) : (
                        <div className="w-[70px] h-[70px] border border-dashed border-gray-300 flex items-center justify-center text-[6pt] text-gray-400">
                            LOGO
                        </div>
                    )}
                </div>

                {/* Nombre del Instituto al Centro - 18pt como solicitado */}
                <div className="flex-1 text-center px-4">
                    <h1 className="text-[18pt] font-black uppercase tracking-tight leading-tight text-black">
                        {institute?.name || 'INSTITUTO SUPERIOR'}
                    </h1>
                </div>

                {/* Fecha y Hora a la derecha - Alineación compacta */}
                <div className="w-[100px] shrink-0 text-right">
                     <div className="inline-block text-left">
                        <p className="text-[6.5pt] font-black text-gray-400 uppercase leading-none">Fecha de Emisión</p>
                        <p className="text-[8.5pt] font-bold text-black">{format(today, 'dd/MM/yyyy')}</p>
                        <p className="text-[7.5pt] font-medium text-gray-600">{format(today, 'HH:mm:ss')}</p>
                     </div>
                </div>
            </div>

            {/* Título del Documento */}
            <div className="text-center mb-8">
                <h2 className="text-[16pt] font-black uppercase border-y-2 border-black py-4 tracking-tighter bg-gray-50/50">
                    {title}
                </h2>
            </div>
            
            {/* Ficha Técnica del Curso */}
            <div className="mb-8 overflow-hidden rounded-lg border-2 border-black">
                <table className="w-full border-collapse m-0">
                    <tbody className="text-[8.5pt]">
                        <tr>
                            <td className="bg-gray-100 border-r border-black p-2 w-[18%] font-black uppercase text-gray-600">Programa:</td>
                            <td className="p-2 w-[42%] font-bold uppercase border-r border-black">{program?.name || 'N/A'}</td>
                            <td className="bg-gray-100 border-r border-black p-2 w-[15%] font-black uppercase text-gray-600">Ciclo / Turno:</td>
                            <td className="p-2 w-[25%] font-bold uppercase">{unit.semester}° - {unit.turno}</td>
                        </tr>
                        <tr className="border-t border-black">
                            <td className="bg-gray-100 border-r border-black p-2 font-black uppercase text-gray-600">Unidad Didáctica:</td>
                            <td className="p-2 font-black uppercase text-primary border-r border-black">{unit.name}</td>
                            <td className="bg-gray-100 border-r border-black p-2 font-black uppercase text-gray-600">Docente:</td>
                            <td className="p-2 font-bold uppercase truncate">{teacher?.fullName || '---'}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Contenido Principal */}
            <main className="w-full">
                {children}
            </main>
        </div>
    );
}
