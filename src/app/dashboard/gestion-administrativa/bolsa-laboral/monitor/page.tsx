
"use client";

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { JobMonitorDashboard } from '@/components/jobs/JobMonitorDashboard';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Monitor } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * @fileOverview Página administrativa para el monitoreo global de ofertas laborales.
 */

export default function JobMonitorPage() {
    const { user, loading, hasPermission } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !hasPermission('admin:jobs:monitor')) {
            router.push('/dashboard');
        }
    }, [user, loading, hasPermission, router]);

    if (loading || !hasPermission('admin:jobs:monitor')) return (
        <div className="space-y-6">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-[600px] w-full rounded-2xl" />
        </div>
    );

    return (
        <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Card className="bg-primary text-primary-foreground border-none shadow-xl overflow-hidden relative rounded-3xl">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Monitor className="h-32 w-32" />
                </div>
                <CardHeader className="relative z-10 p-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                            <Monitor className="h-8 w-8 text-accent" />
                        </div>
                        <div>
                            <CardTitle className="text-3xl font-black tracking-tighter uppercase">
                                Centro de Gestión de Empleabilidad
                            </CardTitle>
                            <CardDescription className="text-primary-foreground/80 text-lg font-medium">
                                Supervise todas las vacantes publicadas y conecte a sus alumnos con oportunidades de fuentes externas.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <JobMonitorDashboard />
        </div>
    );
}
