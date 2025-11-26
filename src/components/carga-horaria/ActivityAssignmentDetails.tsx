
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAssignmentsForActivity, getStaffProfiles, getPrograms } from '@/config/firebase';
import type { NonTeachingAssignment, StaffProfile, Program } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '../ui/badge';
import Link from 'next/link';

interface ActivityAssignmentDetailsProps {
    activityId: string;
}

export function ActivityAssignmentDetails({ activityId }: ActivityAssignmentDetailsProps) {
    const { instituteId } = useAuth();
    const [assignments, setAssignments] = useState<NonTeachingAssignment[]>([]);
    const [staffMap, setStaffMap] = useState<Map<string, StaffProfile>>(new Map());
    const [programMap, setProgramMap] = useState<Map<string, string>>(new Map());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!instituteId || !activityId) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const [fetchedAssignments, staff, programs] = await Promise.all([
                    getAssignmentsForActivity(instituteId, activityId),
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
    }, [instituteId, activityId]);

    if (loading) {
        return <Skeleton className="h-24 w-full" />;
    }
    
    if (assignments.length === 0) {
        return <p className="text-sm text-muted-foreground text-center py-4">Nadie tiene asignada esta actividad actualmente.</p>
    }

    return (
        <div className="rounded-md border bg-background">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Docente</TableHead>
                        <TableHead>Programa</TableHead>
                        <TableHead>Año</TableHead>
                        <TableHead>Período</TableHead>
                        <TableHead className="text-right">Horas Asignadas</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {assignments.map(assignment => {
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
                                <TableCell>{assignment.year}</TableCell>
                                <TableCell>{assignment.period}</TableCell>
                                <TableCell className="text-right font-semibold">{assignment.assignedHours}h</TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
