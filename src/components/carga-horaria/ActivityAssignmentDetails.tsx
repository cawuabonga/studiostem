
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAssignmentsForActivity, getStaffProfiles, getPrograms } from '@/config/firebase';
import type { NonTeachingAssignment, StaffProfile, Program } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '../ui/badge';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';

interface ActivityAssignmentDetailsProps {
    activityId: string;
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString());


export function ActivityAssignmentDetails({ activityId }: ActivityAssignmentDetailsProps) {
    const { instituteId } = useAuth();
    const [assignments, setAssignments] = useState<NonTeachingAssignment[]>([]);
    const [staffMap, setStaffMap] = useState<Map<string, StaffProfile>>(new Map());
    const [programMap, setProgramMap] = useState<Map<string, string>>(new Map());
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState(currentYear.toString());

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
                setProgramMap(new Map(programs.map(p => [p.id, p.name])));

            } catch (error) {
                console.error("Error fetching assignment details:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [instituteId, activityId, selectedYear]);
    
    const filteredAssignments = useMemo(() => {
        return assignments.filter(a => a.year === selectedYear);
    }, [assignments, selectedYear]);

    return (
        <div className="space-y-4">
            <div className="w-full sm:w-48">
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

            {loading ? <Skeleton className="h-24 w-full" /> : (
                <div className="rounded-md border bg-background">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Docente</TableHead>
                                <TableHead>Programa</TableHead>
                                <TableHead>Período</TableHead>
                                <TableHead className="text-right">Horas Asignadas</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAssignments.length > 0 ? (
                                filteredAssignments.map(assignment => {
                                    const teacher = staffMap.get(assignment.teacherId);
                                    const programName = teacher ? programMap.get(teacher.programId) : 'N/A';
                                    return (
                                        <TableRow key={assignment.id}>
                                            <TableCell className="font-medium">
                                                <Link href={`/profile/${assignment.teacherId}`} target="_blank" className="hover:underline">
                                                    {teacher?.displayName || assignment.teacherId}
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{programName}</Badge>
                                            </TableCell>
                                            <TableCell>{assignment.period}</TableCell>
                                            <TableCell className="text-right font-semibold">{assignment.assignedHours}h</TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        Nadie tiene asignada esta actividad para el año {selectedYear}.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}
