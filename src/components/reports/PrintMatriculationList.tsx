
"use client";

import React from 'react';
import type { MatriculationReportData, StudentProfile } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
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
        <div className="printable-area p-8 font-sans text-black">
            <div className="page-break">
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
                    <h2 className="text-xl font-bold uppercase">NÓMINA DE MATRÍCULA - {year}</h2>
                </div>

                <table className="print-info-table w-full mb-6">
                    <tbody>
                        <tr>
                            <td className="label w-[25%]">Programa de Estudios:</td>
                            <td>{data.program.name}</td>
                        </tr>
                        <tr>
                            <td className="label">Semestre del Plan de Estudios:</td>
                            <td>{semester}</td>
                        </tr>
                    </tbody>
                </table>

                <table className="w-full text-xs">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="w-[5%] border p-1 text-left">N°</th>
                            <th className="w-[25%] border p-1 text-left">Apellidos y Nombres</th>
                            {data.units.map(unitData => (
                                <th key={unitData.unit.id} className="border p-1 transform -rotate-45" style={{ height: '100px', whiteSpace: 'nowrap', width: 'auto' }}>
                                    <div style={{ transform: 'translate(10px, -25px)', width: '20px' }}>
                                        {unitData.unit.code}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {uniqueStudents.map((student, studentIndex) => (
                            <tr key={student.documentId}>
                                <td className="border p-1 text-center">{studentIndex + 1}</td>
                                <td className="border p-1">{student.fullName}</td>
                                {data.units.map(unitData => (
                                    <td key={unitData.unit.id} className="border p-1 text-center">
                                        {unitStudentMap.get(unitData.unit.id)?.has(student.documentId) ? 'X' : ''}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        {uniqueStudents.length === 0 && (
                            <tr>
                                <td colSpan={2 + data.units.length} className="border p-2 text-center text-gray-500">No hay estudiantes matriculados.</td>
                            </tr>
                        )}
                    </tbody>
                </table>

                <footer className="text-center mt-32">
                    <div className="inline-block border-t border-black px-16 py-2">
                        <p>Firma del Responsable</p>
                    </div>
                </footer>
            </div>
        </div>
    );
}
