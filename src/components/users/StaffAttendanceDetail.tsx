
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

interface StaffAttendanceDetailProps {
    staffId: string;
}

export function StaffAttendanceDetail({ staffId }: StaffAttendanceDetailProps) {
    const { instituteId, hasPermission } = useAuth();
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
            ? log.timestamp.toDate() >= dateRange.from && log.timestamp.toDate() <= dateRange.to
            : true;
          return isDateMatch;
        });
    }, [logs, dateRange]);


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
                    <CardTitle>Registros de Acceso Detallados</CardTitle>
                </CardHeader>
                <CardContent>
                    <AccessLogTable logs={filteredLogs} loading={logsLoading} />
                </CardContent>
            </Card>
        </div>
    );
}
