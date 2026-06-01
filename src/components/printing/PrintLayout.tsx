
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
        <div className="printable-area bg-white text-black p-4 font-sans">
            {/* Header Institucional: Logo a la izquierda, Nombre al centro, Fecha a la derecha */}
            <header className="grid grid-cols-12 items-center border-b-2 border-black pb-4 mb-6">
                <div className="col-span-3 flex justify-start">
                    {institute?.logoUrl && (
                        /* Se usa etiqueta img estándar para máxima compatibilidad con motores de impresión */
                        <img 
                            src={institute.logoUrl} 
                            alt="Logo Institucional" 
                            className="w-[85px] h-[85px] object-contain" 
                        />
                    )}
                </div>
                <div className="col-span-6 text-center space-y-1">
                    <h1 className="text-xl font-black uppercase tracking-tight leading-none text-black">
                        {institute?.name || 'Nombre del Instituto'}
                    </h1>
                    <p className="text-[10pt] font-bold text-gray-600 uppercase tracking-widest">
                        Sistema de Gestión Académica
                    </p>
                </div>
                <div className="col-span-3 text-right">
                     <p className="text-[8.5pt] leading-tight font-bold text-black">
                        FECHA: {format(today, 'dd/MM/yyyy')}<br/>
                        HORA: {format(today, 'HH:mm')}
                    </p>
                </div>
            </header>

            {/* Título del Reporte: Centrado con líneas superior e inferior de estilo formal */}
            <div className="text-center my-6">
                <h2 className="text-xl font-black uppercase border-y-2 border-black py-4 tracking-tighter leading-tight text-black">
                    {title}
                </h2>
            </div>
            
            {/* Tabla de Información General del Curso/Docente */}
            <table className="w-full border-collapse mb-8 border-2 border-black">
                <tbody className="text-[9pt]">
                    <tr>
                        <td className="bg-gray-100 border border-black p-2 w-[12%] font-bold uppercase text-black">Programa:</td>
                        <td className="border border-black p-2 w-[38%] font-semibold uppercase text-black">{program?.name}</td>
                        <td className="bg-gray-100 border border-black p-2 w-[12%] font-bold uppercase text-black">Docente:</td>
                        <td className="border border-black p-2 w-[38%] font-semibold uppercase text-black">{teacher?.fullName || 'No asignado'}</td>
                    </tr>
                    <tr>
                        <td className="bg-gray-100 border border-black p-2 font-bold uppercase text-black">Unidad:</td>
                        <td className="border border-black p-2 font-semibold uppercase text-black">{unit.name}</td>
                        <td className="bg-gray-100 border border-black p-2 font-bold uppercase text-black">Ciclo/Turno:</td>
                        <td className="border border-black p-2 font-semibold uppercase text-black">{unit.semester}° Ciclo - {unit.turno}</td>
                    </tr>
                </tbody>
            </table>

            {/* Contenido Principal (Matriz de asistencia o acta de promedios) */}
            <main className="w-full overflow-visible">
                {children}
            </main>
        </div>
    );
}
