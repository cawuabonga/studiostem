
"use client";

import React from 'react';
import type { MatriculationReportData } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import { format } from 'date-fns';

interface PrintMatriculationListProps {
    data: MatriculationReportData;
    semester: number;
    year: string;
}

export function PrintMatriculationList({ data, semester, year }: PrintMatriculationListProps) {
    const { institute } = useAuth();
    
    return (
        <div className="printable-area p-8 font-sans text-black">
            {data.units.map((unitData, index) => (
                <div key={unitData.unit.id} className={index < data.units.length - 1 ? 'page-break' : ''}>
                     <header className="print-header flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            {institute?.logoUrl && (
                                <Image src={institute.logoUrl} alt={`${institute.name} Logo`} width={80} height={80} className="object-contain" />
                            )}
                            <div>
                                <h1 className="text-lg font-bold">{institute?.name || 'Nombre del Instituto'}</h1>
                                <p className="text-sm">Sistema de Gestión Académica</p>
                            </div>
                        </div>
                        <div className="text-xs text-right">
                            <p>Fecha de Emisión: {format(new Date(), 'dd/MM/yyyy')}</p>
                            <p>Hora de Emisión: {format(new Date(), 'HH:mm')}</p>
                        </div>
                    </header>

                    <div className="text-center my-6">
                        <h2 className="text-xl font-bold uppercase">LISTA DE ESTUDIANTES MATRICULADOS</h2>
                    </div>

                     <table className="print-info-table w-full mb-6">
                        <tbody>
                            <tr>
                                <td className="label w-[25%]">Programa de Estudios:</td>
                                <td>{data.program.name}</td>
                            </tr>
                            <tr>
                                <td className="label">Semestre Académico:</td>
                                <td>{year} - {unitData.unit.period === 'MAR-JUL' ? 'I' : 'II'} (Semestre de Plan: {semester})</td>
                            </tr>
                             <tr>
                                <td className="label">Unidad Didáctica:</td>
                                <td>{unitData.unit.name}</td>
                            </tr>
                             <tr>
                                <td className="label">Docente:</td>
                                <td>{unitData.teacherName || 'No asignado'}</td>
                            </tr>
                        </tbody>
                    </table>

                    <table className="w-full">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="w-[10%] border p-2 text-left">N°</th>
                                <th className="w-[30%] border p-2 text-left">N° Documento</th>
                                <th className="w-[60%] border p-2 text-left">Apellidos y Nombres</th>
                            </tr>
                        </thead>
                        <tbody>
                            {unitData.students.map((student, studentIndex) => (
                                <tr key={student.documentId}>
                                    <td className="border p-2 text-center">{studentIndex + 1}</td>
                                    <td className="border p-2">{student.documentId}</td>
                                    <td className="border p-2">{student.fullName}</td>
                                </tr>
                            ))}
                             {unitData.students.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="border p-2 text-center text-gray-500">No hay estudiantes matriculados en esta unidad.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                     <footer className="text-center mt-32">
                        <div className="inline-block border-t border-black px-16 py-2">
                            <p>Firma del Docente</p>
                        </div>
                    </footer>
                </div>
            ))}
        </div>
    );
}
