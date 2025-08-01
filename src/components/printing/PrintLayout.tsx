
"use client";

import React from 'react';
import Image from 'next/image';
import type { Institute, Program, Unit, Teacher, StudentProfile, AchievementIndicator, AcademicRecord } from '@/types';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';


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
        <div className="printable-area space-y-4">
            <header className="print-header flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {institute?.logoUrl && (
                        <Image src={institute.logoUrl} alt={`${institute.name} Logo`} width={80} height={80} className="object-contain" />
                    )}
                    <div>
                         <h1 className="text-lg font-bold">{institute?.name || 'Nombre del Instituto'}</h1>
                         <p className="text-sm">Sistema de Gestión Académica</p>
                    </div>
                </div>
                 <div className="flex items-center gap-4">
                     <p className="text-xs text-right">
                        Fecha y Hora de Emisión:<br/>
                        {format(today, 'dd/MM/yyyy HH:mm')}
                    </p>
                    <Image src="https://istjaq.edu.pe/wp-content/uploads/2024/05/logo-minedu-2024.png" alt="Ministerio de Educación" width={140} height={50} className="object-contain" data-ai-hint="education ministry" />
                </div>
            </header>

            <div className="text-center my-4">
                <h2 className="text-xl font-bold uppercase">{title}</h2>
            </div>
            
            <table className="print-info-table">
                <tbody>
                    <tr>
                        <td className="label">Institución:</td>
                        <td>{institute?.name}</td>
                        <td className="label">Programa de Estudios:</td>
                        <td>{program?.name}</td>
                    </tr>
                    <tr>
                        <td className="label">Unidad Didáctica:</td>
                        <td>{unit.name}</td>
                         <td className="label">Docente:</td>
                        <td>{teacher?.fullName || 'No asignado'}</td>
                    </tr>
                     <tr>
                        <td className="label">Periodo:</td>
                        <td>{unit.period}</td>
                        <td className="label">Créditos:</td>
                        <td>{unit.credits}</td>
                    </tr>
                    <tr>
                        <td className="label">Turno:</td>
                        <td>{unit.turno}</td>
                         <td className="label">Horas Totales:</td>
                        <td>{unit.totalHours}</td>
                    </tr>
                </tbody>
            </table>

            <main>
                {children}
            </main>
        </div>
    );
}

