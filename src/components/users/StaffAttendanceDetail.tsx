
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getStaffProfileByDocumentId, listenToAccessLogsForUser } from "@/config/firebase";
import type { StaffProfile, AccessLog } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import type { DateRange } from "react-day-picker";
import { Label } from "@/components/ui/label";
import { AccessLogTable } from "@/components/access-control/AccessLogTable";
import { StaffAttendanceSummary } from "./StaffAttendanceSummary";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Badge } from "../ui/badge";

interface StaffAttendanceDetailProps {
    staffId: string;
}

export function StaffAttendanceDetail({ staffId }: StaffAttendanceDetailProps) {
    const { instituteId } = useAuth();
    const [profile, setProfile] = useState<StaffProfile | null>(null);
    const [logs, setLogs] = useState<AccessLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [logsLoading, setLogsLoading] = useState(true);
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

    useEffect(() => {
        if (instituteId && staffId) {
            getStaffProfileByDocumentId(instituteId, staffId)
                .then(p => {
                    setProfile(p);
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Error fetching staff profile", err);
                    setLoading(false);
                });
        }
    }, [instituteId, staffId]);

    useEffect(() => {
        if (!instituteId || !staffId) {
            setLogsLoading(false);
            return;
        }

        setLogsLoading(true);
        const unsubscribe = listenToAccessLogsForUser(instituteId, staffId, (newLogs) => {
            setLogs(newLogs);
            setLogsLoading(false);
        });

        return () => unsubscribe();
    }, [instituteId, staffId]);

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
          const isDateMatch = dateRange?.from && dateRange?.to
            ? log.timestamp.toDate() >= dateRange.from && log.timestamp.toDate() <= new Date(dateRange.to.getTime() + 86400000) // Include the whole end day
            : true;
          return isDateMatch;
        });
    }, [logs, dateRange]);
    
     const groupedLogs = useMemo(() => {
        const groups: Record<string, AccessLog[]> = {};
        filteredLogs.forEach(log => {
            const pointName = log.accessPointName || 'Punto Desconocido';
            if (!groups[pointName]) {
                groups[pointName] = [];
            }
            groups[pointName].push(log);
        });
        return Object.entries(groups).sort(([nameA], [nameB]) => nameA.localeCompare(nameB));
    }, [filteredLogs]);


    if (loading) {
        return <Skeleton className="h-64 w-full" />;
    }

    if (!profile) {
        return <p>No se pudo encontrar el perfil del personal.</p>;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Detalle de Asistencia: {profile.displayName}</CardTitle>
                    <CardDescription>
                        Historial de registros de entrada y salida para {profile.email}.
                    </CardDescription>
                </CardHeader>
                 <CardContent>
                     <div className="w-full md:w-auto md:max-w-xs space-y-2">
                        <Label>Filtrar por Fecha</Label>
                        <DateRangePicker 
                            date={dateRange}
                            onDateChange={setDateRange}
                            className="w-full"
                        />
                    </div>
                 </CardContent>
            </Card>

            <StaffAttendanceSummary logs={filteredLogs} />

            <Card>
                <CardHeader>
                    <CardTitle>Registros de Acceso por Punto</CardTitle>
                    <CardDescription>
                        A continuación se muestran los registros de acceso agrupados por cada punto de acceso.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                   {logsLoading ? (
                        <Skeleton className="h-48 w-full" />
                   ) : groupedLogs.length > 0 ? (
                     <Accordion type="multiple" className="w-full space-y-4">
                        {groupedLogs.map(([pointName, logsForPoint]) => (
                            <AccordionItem key={pointName} value={pointName} className="border rounded-lg shadow-sm">
                                <AccordionTrigger className="text-lg font-medium px-6 py-4 hover:no-underline">
                                    <div className="flex items-center gap-4">
                                        <span>{pointName}</span>
                                        <Badge variant="secondary">{logsForPoint.length} Registros</Badge>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-1 pb-1">
                                    <AccessLogTable logs={logsForPoint} loading={false} />
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                   ) : (
                        <p className="text-center text-muted-foreground py-8">
                            No se encontraron registros de acceso para el rango de fechas seleccionado.
                        </p>
                   )}
                </CardContent>
            </Card>
        </div>
    );
}
