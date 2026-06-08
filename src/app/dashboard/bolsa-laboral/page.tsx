
"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { JobBoard } from '@/components/jobs/JobBoard';
import { CompanyDashboard } from '@/components/jobs/CompanyDashboard';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BriefcaseBusiness, Building2, UserCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function JobBoardPage() {
    const { user, loading } = useAuth();

    if (loading) return <div className="space-y-6"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>;

    if (!user) return null;

    const isCompany = user.role === 'Company';

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Cabecera Adaptativa */}
            <Card className="bg-primary text-primary-foreground border-none shadow-xl overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    {isCompany ? <Building2 className="h-24 w-24" /> : <BriefcaseBusiness className="h-24 w-24" />}
                </div>
                <CardHeader className="relative z-10">
                    <div className="flex items-center gap-3">
                        <BriefcaseBusiness className="h-8 w-8 text-accent" />
                        <div>
                            <CardTitle className="text-3xl font-black tracking-tighter uppercase">
                                {isCompany ? "Portal de Reclutamiento" : "Bolsa Laboral STEM"}
                            </CardTitle>
                            <CardDescription className="text-primary-foreground/80 text-lg">
                                {isCompany 
                                    ? `Gestione las vacantes y postulantes para ${user.displayName}.` 
                                    : "Encuentre su próxima oportunidad profesional basada en su formación verificada."}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Renderizado basado en el Rol */}
            {isCompany ? (
                <CompanyDashboard />
            ) : (
                <JobBoard />
            )}
        </div>
    );
}
