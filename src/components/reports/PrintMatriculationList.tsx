
"use client";

import React from 'react';
import type { MatriculationReportData, StudentProfile } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { Check } from 'lucide-react';

interface PrintMatriculationListProps {
    data: MatriculationReportData;
    semester: number;
    year: string;
}

export function PrintMatriculationList({ data, semester, year }: PrintMatriculationListProps) {
    const { institute } = useAuth();
    
    // Process data for matrix view
    const uniqueStudents = React.useMemo(() => {
        const studentMap = new Map<string, StudentProfile>();
        data.units.forEach(unitData => {
            unitData.students.forEach(student => {
                if (!studentMap.has(student.documentId)) {
                    studentMap.set(student.documentId, student);
                }
            });
        });
        return Array.from(studentMap.values()).sort((a,b) => a.lastName.localeCompare(b.lastName));
    }, [data]);

    const unitStudentMap = React.useMemo(() => {
        const map = new Map<string, Set<string>>();
        data.units.forEach(unitData => {
            const studentIds = new Set(unitData.students.map(s => s.documentId));
            map.set(unitData.unit.id, studentIds);
        });
        return map;
    }, [data]);

    return (
        <div className="printable-area p-8 font-sans text-black bg-white">
            <div className="page-break">
                {/* Cambiado de <header> a <div> para evitar ser ocultado por el CSS de impresión global */}
                <div className="print-header flex items-center justify-between mb-4 border-b-2 border-black pb-4">
                    <div className="flex items-center gap-4">
                        {institute?.logoUrl && (
                            <img 
                                src={institute.logoUrl} 
                                alt="Logo" 
                                className="w-[80px] h-[80px] object-contain" 
                            />
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
                </div>

                <div className="text-center my-6">
                    <h2 className="text-xl font-bold uppercase border-y-2 border-black py-2">NÓMINA DE MATRÍCULA - {year}</h2>
                </div>

                <table className="print-info-table w-full mb-6 border-collapse">
                    <tbody className="text-sm">
                        <tr>
                            <td className="font-bold w-[25%] p-1">Programa de Estudios:</td>
                            <td className="p-1 uppercase">{data.program.name}</td>
                        </tr>
                        <tr>
                            <td className="font-bold p-1">Semestre del Plan de Estudios:</td>
                            <td className="p-1">{semester}° CICLO</td>
                        </tr>
                    </tbody>
                </table>

                <table className="w-full text-[8pt] border-collapse border border-black">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="border border-black p-1 text-center w-[30px]">N°</th>
                            <th className="border border-black p-1 text-left w-auto">Apellidos y Nombres</th>
                            {data.units.map(unitData => (
                                <th key={unitData.unit.id} className="border border-black p-1 text-center font-bold text-[7pt] w-[40px]">
                                    {unitData.unit.code}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {uniqueStudents.map((student, studentIndex) => (
                            <tr key={student.documentId}>
                                <td className="border border-black p-1 text-center">{studentIndex + 1}</td>
                                <td className="border border-black p-1 uppercase font-medium">{student.fullName}</td>
                                {data.units.map(unitData => (
                                    <td key={unitData.unit.id} className="border border-black p-1 text-center">
                                        {unitStudentMap.get(unitData.unit.id)?.has(student.documentId) ? 'X' : ''}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        {uniqueStudents.length === 0 && (
                            <tr>
                                <td colSpan={2 + data.units.length} className="border border-black p-8 text-center text-gray-500 italic">No hay estudiantes matriculados.</td>
                            </tr>
                        )}
                    </tbody>
                </table>

                <footer className="text-center mt-32">
                    <div className="inline-block border-t border-black px-16 py-2">
                        <p className="font-bold uppercase text-[9pt]">Firma del Responsable</p>
                    </div>
                </footer>
            </div>
        </div>
    );
}
