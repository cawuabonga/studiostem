
'use client';

import React, { use } from 'react';
import { KioskView } from '@/components/eda/KioskView';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * @fileOverview Página de entrada para el Kiosko EDA (Point Print).
 * Esta página está diseñada para ser visualizada en pantallas táctiles.
 */

export default function KioskPage({ params }: { params: Promise<{ pointId: string }> }) {
    const { pointId } = use(params);
    const { instituteId, loading } = useAuth();

    // El kiosko siempre debe tener un instituteId.
    // En producción, cada tablet tendrá su propio pointId configurado.
    const effectiveInstituteId = instituteId || 'istp-principal';

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-100">
                <div className="space-y-4 w-full max-w-md p-8 bg-white rounded-[3rem] shadow-2xl">
                    <Skeleton className="h-20 w-20 rounded-full mx-auto" />
                    <Skeleton className="h-12 w-3/4 mx-auto" />
                    <Skeleton className="h-32 w-full" />
                </div>
            </div>
        );
    }

    return (
        <KioskView 
            pointId={pointId} 
            instituteId={effectiveInstituteId} 
        />
    );
}
