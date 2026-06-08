
"use client";

import React from 'react';
import { PlansManager } from '@/components/superadmin/PlansManager';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CreditCard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * @fileOverview Página para la gestión de planes SaaS de la plataforma.
 * Accesible únicamente por el SuperAdministrador.
 */

export default function ManagePlansPage() {
    const { user, loading, hasPermission } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !hasPermission('superadmin:plans:manage')) {
            router.push('/dashboard');
        }
    }, [user, loading, hasPermission, router]);

    if (loading || !hasPermission('superadmin:plans:manage')) {
        return <p className="p-8">Verificando nivel de acceso...</p>;
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Card className="bg-primary text-primary-foreground border-none shadow-xl overflow-hidden relative rounded-3xl">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <CreditCard className="h-32 w-32" />
                </div>
                <CardHeader className="relative z-10 p-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                            <CreditCard className="h-8 w-8 text-accent" />
                        </div>
                        <div>
                            <CardTitle className="text-3xl font-black tracking-tighter uppercase">Arquitectura Comercial (Planes)</CardTitle>
                            <CardDescription className="text-primary-foreground/80 text-lg font-medium">Configure los niveles de servicio y cuotas para las instituciones educativas.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <PlansManager />
        </div>
    );
}
