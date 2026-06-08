
"use client";

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { JobBoard } from '@/components/jobs/JobBoard';
import { CompanyDashboard } from '@/components/jobs/CompanyDashboard';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BriefcaseBusiness, Building2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * @fileOverview Punto de entrada para la Bolsa Laboral.
 * Diferencia automáticamente entre la vista de Estudiante y la vista de Empresa.
 */

export default function JobBoardPage() {
    const { user, loading } = useAuth();

    if (loading) return (
        <div className="space-y-6">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-64 w-full rounded-2xl" />
                <Skeleton className="h-64 w-full rounded-2xl" />
                <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
        </div>
    );

    if (!user) return null;

    // Determinamos si el usuario es una Empresa basado en su rol
    const isCompany = user.role === 'Company';

    return (
        <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Cabecera Adaptativa */}
            <Card className="bg-primary text-primary-foreground border-none shadow-xl overflow-hidden relative rounded-3xl">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    {isCompany ? <Building2 className="h-32 w-32" /> : <BriefcaseBusiness className="h-32 w-32" />}
                </div>
                <CardHeader className="relative z-10 p-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                            {isCompany ? <Building2 className="h-8 w-8 text-accent" /> : <BriefcaseBusiness className="h-8 w-8 text-accent" />}
                        </div>
                        <div>
                            <CardTitle className="text-3xl font-black tracking-tighter uppercase">
                                {isCompany ? "Portal de Reclutamiento" : "Oportunidades Laborales"}
                            </CardTitle>
                            <CardDescription className="text-primary-foreground/80 text-lg font-medium">
                                {isCompany 
                                    ? `Gestione las vacantes y analice el talento verificado de ${user.displayName}.` 
                                    : "Encuentre su próxima oportunidad profesional con el aval de su formación académica."}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Renderizado basado en el Rol */}
            <main>
                {isCompany ? (
                    <CompanyDashboard />
                ) : (
                    <JobBoard />
                )}
            </main>
        </div>
    );
}
