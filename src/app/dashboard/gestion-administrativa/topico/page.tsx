
"use client";

import React from 'react';
import { HealthDashboard } from '@/components/health/HealthDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * @fileOverview Página administrativa para el área de Tópico y Salud.
 */

export default function TopicoPage() {
    const { user, loading, hasPermission } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !hasPermission('admin:health:manage')) {
            router.push('/dashboard');
        }
    }, [user, loading, hasPermission, router]);

    if (loading || !hasPermission('admin:health:manage')) return (
        <div className="space-y-6">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-[600px] w-full rounded-2xl" />
        </div>
    );

    return (
        <div className="animate-in fade-in duration-500">
            <HealthDashboard />
        </div>
    );
}
