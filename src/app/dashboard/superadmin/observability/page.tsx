
"use client";

import React from 'react';
import { ObservabilityDashboard } from '@/components/superadmin/ObservabilityDashboard';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export default function SuperAdminObservabilityPage() {
    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <Card className="bg-primary text-primary-foreground border-none shadow-xl overflow-hidden relative rounded-3xl">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <BarChart3 className="h-32 w-32" />
                </div>
                <CardHeader className="relative z-10 p-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                            <BarChart3 className="h-8 w-8 text-accent" />
                        </div>
                        <div>
                            <CardTitle className="text-3xl font-black tracking-tighter uppercase">Salud del Ecosistema</CardTitle>
                            <CardDescription className="text-primary-foreground/80 text-lg font-medium">Observabilidad global de consumo, actividad y recaudación por instituto.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <ObservabilityDashboard />
        </div>
    );
}
