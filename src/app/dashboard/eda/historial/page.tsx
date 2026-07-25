
'use client';

import React from 'react';
import { EDALogTable } from '@/components/eda/EDALogTable';
import { Button } from '@/components/ui/button';
import { ArrowLeft, History } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function EDAHistoryPage() {
    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <button 
                    onClick={() => window.history.back()}
                    className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" /> Volver al Sistema EDA
                </button>
            </div>

            <Card className="bg-primary text-primary-foreground border-none shadow-xl overflow-hidden relative rounded-3xl">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <History className="h-32 w-32" />
                </div>
                <CardHeader className="relative z-10 p-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                            <History className="h-8 w-8 text-accent" />
                        </div>
                        <div>
                            <CardTitle className="text-3xl font-black uppercase tracking-tight">Historial de Emisiones</CardTitle>
                            <CardDescription className="text-primary-foreground/80 text-lg font-medium">
                                Auditoría de documentos generados en los terminales Point Print.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <EDALogTable />
        </div>
    );
}
