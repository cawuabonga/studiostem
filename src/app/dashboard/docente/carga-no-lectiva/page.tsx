"use client";

import React from 'react';
import { NonTeachingWorkloadManager } from '@/components/teacher/NonTeachingWorkloadManager';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ClipboardList } from 'lucide-react';

export default function MyWorkloadPage() {
    return (
        <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Card className="bg-primary text-primary-foreground border-none shadow-xl overflow-hidden relative rounded-3xl">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <ClipboardList className="h-32 w-32" />
                </div>
                <CardHeader className="relative z-10 p-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                            <ClipboardList className="h-8 w-8 text-accent" />
                        </div>
                        <div>
                            <CardTitle className="text-3xl font-black tracking-tighter uppercase">Gestión de Carga No Lectiva</CardTitle>
                            <CardDescription className="text-primary-foreground/80 text-lg font-medium">
                                Reporte de evidencias para actividades de investigación, tutoría y gestión administrativa.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <NonTeachingWorkloadManager />
        </div>
    );
}
