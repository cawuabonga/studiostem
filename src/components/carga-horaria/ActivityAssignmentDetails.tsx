
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAssignmentsForActivity, getStaffProfiles, getPrograms } from '@/config/firebase';
import type { NonTeachingAssignment, StaffProfile, Program, UnitPeriod } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '../ui/badge';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface ActivityAssignmentDetailsProps {
    activityId: string;
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString());
const periods: (UnitPeriod | 'all')[] = ['all', 'MAR-JUL', 'AGO-DIC'];


export function ActivityAssignmentDetails({ activityId }: ActivityAssignmentDetailsProps) {
    const { instituteId } = useAuth();
    const [assignments, setAssignments] = useState<NonTeachingAssignment[]>([]);
    const [staffMap, setStaffMap] = useState<Map<string, StaffProfile>>(new Map());
    const [programMap, setProgramMap] = useState<Map<string, Program>>(new Map());
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState(currentYear.toString());
    const [selectedPeriod, setSelectedPeriod] = useState<UnitPeriod | 'all'>('all');

    useEffect(() => {
        if (!instituteId || !activityId) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const [fetchedAssignments, staff, programs] = await Promise.all([
                    getAssignmentsForActivity(instituteId, activityId, selectedYear),
                    getStaffProfiles(instituteId),
                    getPrograms(instituteId),
                ]);

                setAssignments(fetchedAssignments);
                setStaffMap(new Map(staff.map(s => [s.documentId, s])));
                setProgramMap(new Map(programs.map(p => [p.id, p])));

            } catch (error) {
                console.error("Error fetching assignment details:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [instituteId, activityId, selectedYear]);
    
    const filteredAndGroupedAssignments = useMemo(() => {
        const periodFiltered = selectedPeriod === 'all'
            ? assignments
            : assignments.filter(a => a.period === selectedPeriod);
            
        const groupedByProgram: Record<string, NonTeachingAssignment[]> = {};

        periodFiltered.forEach(assignment => {
            const teacher = staffMap.get(assignment.teacherId);
            if (teacher) {
                const programId = teacher.programId;
                if (!groupedByProgram[programId]) {
                    groupedByProgram[programId] = [];
                }
                groupedByProgram[programId].push(assignment);
            }
        });

        return Object.entries(groupedByProgram).sort(([programIdA], [programIdB]) => {
            const programNameA = programMap.get(programIdA)?.name || '';
            const programNameB = programMap.get(programIdB)?.name || '';
            return programNameA.localeCompare(programNameB);
        });

    }, [assignments, staffMap, programMap, selectedPeriod]);

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-48 space-y-2">
                    <Label>Filtrar por Año</Label>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccione un año" />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="w-full sm:w-48 space-y-2">
                    <Label>Filtrar por Período</Label>
                    <Select value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as any)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccione período" />
                        </SelectTrigger>
                        <SelectContent>
                           {periods.map(p => <SelectItem key={p} value={p}>{p === 'all' ? 'Todos' : p}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {loading ? <Skeleton className="h-40 w-full" /> : (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {filteredAndGroupedAssignments.length > 0 ? (
                        filteredAndGroupedAssignments.map(([programId, programAssignments]) => {
                             const program = programMap.get(programId);
                             return (
                                 <Card key={programId}>
                                     <CardHeader>
                                        <CardTitle className="text-lg">{program?.name || 'Programa Desconocido'}</CardTitle>
                                     </CardHeader>
                                     <CardContent>
                                        <div className="rounded-md border overflow-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Docente</TableHead>
                                                        <TableHead>Período</TableHead>
                                                        <TableHead className="text-right">Horas</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                     {programAssignments.map(assignment => {
                                                        const teacher = staffMap.get(assignment.teacherId);
                                                        return (
                                                            <TableRow key={assignment.id}>
                                                                <TableCell className="font-medium">
                                                                    <Link href={`/profile/${assignment.teacherId}`} target="_blank" className="hover:underline">
                                                                        {teacher?.displayName || assignment.teacherId}
                                                                    </Link>
                                                                </TableCell>
                                                                <TableCell>{assignment.period}</TableCell>
                                                                <TableCell className="text-right font-semibold">{assignment.assignedHours}h</TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </div>
                                     </CardContent>
                                 </Card>
                             )
                        })
                    ) : (
                        <div className="h-24 text-center flex items-center justify-center text-muted-foreground">
                            Nadie tiene asignada esta actividad para los filtros seleccionados.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
