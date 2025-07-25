
"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from "@/contexts/AuthContext";
import type { Unit } from '@/types';
import { getUnit } from '@/config/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IndicatorsManager } from '@/components/indicators/IndicatorsManager';

export default function UnitManagementPage() {
    const { instituteId } = useAuth();
    const params = useParams();
    const unitId = params.unitId as string;
    
    const [unit, setUnit] = useState<Unit | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUnitDetails = async () => {
            if (!instituteId || !unitId) {
                setLoading(false);
                setError("Faltan datos para cargar la unidad.");
                return;
            }

            try {
                setLoading(true);
                const unitData = await getUnit(instituteId, unitId);
                if (unitData) {
                    setUnit(unitData);
                } else {
                    setError("No se encontró la unidad didáctica.");
                }
            } catch (err) {
                console.error("Error fetching unit details:", err);
                setError("Ocurrió un error al cargar los detalles de la unidad.");
            } finally {
                setLoading(false);
            }
        };

        fetchUnitDetails();
    }, [instituteId, unitId]);

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
        );
    }

    if (error) {
        return <p className="text-destructive text-center">{error}</p>;
    }

    if (!unit) {
        return <p className="text-center">Unidad no encontrada.</p>;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">{unit.name}</CardTitle>
                    <CardDescription>
                        Código: {unit.code} | {unit.credits} Créditos | {unit.totalHours} Horas
                    </CardDescription>
                </CardHeader>
            </Card>

            <IndicatorsManager unitId={unit.id} />

        </div>
    );
}
