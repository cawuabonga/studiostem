
"use client";

import React from 'react';
import { ActivityMonitor } from '@/components/carga-horaria/ActivityMonitor';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Files } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function MonitorActividadesPage() {
    const { hasPermission, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !hasPermission('academic:workload:monitor')) {
            router.push('/dashboard');
        }
    }, [loading, hasPermission, router]);

    if (loading || !hasPermission('academic:workload:monitor')) return <p className="p-8">Cargando...</p>;

    return (
        <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Card className="bg-primary text-primary-foreground border-none shadow-xl overflow-hidden relative rounded-3xl">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Files className="h-32 w-32" />
                </div>
                <CardHeader className="relative z-10 p-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                            <Files className="h-8 w-8 text-accent" />
                        </div>
                        <div>
                            <CardTitle className="text-3xl font-black tracking-tighter uppercase">Monitor de Carga No Lectiva</CardTitle>
                            <CardDescription className="text-primary-foreground/80 text-lg font-medium">
                                Supervisión de informes y evidencias para actividades de investigación, tutoría y gestión.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <ActivityMonitor />
        </div>
    );
}
