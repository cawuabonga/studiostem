
'use client';

import React from 'react';
import { PrintPointManager } from '@/components/eda/PrintPointManager';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer } from 'lucide-react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function PrintPointsPage() {
    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <Button variant="ghost" asChild>
                    <Link href="/dashboard/eda">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Sistema EDA
                    </Link>
                </Button>
            </div>

            <Card className="bg-primary text-primary-foreground border-none shadow-xl overflow-hidden relative rounded-3xl">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Printer className="h-32 w-32" />
                </div>
                <CardHeader className="relative z-10 p-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                            <Printer className="h-8 w-8 text-accent" />
                        </div>
                        <div>
                            <CardTitle className="text-3xl font-black tracking-tighter uppercase">Puntos de Impresión (Point Print)</CardTitle>
                            <CardDescription className="text-primary-foreground/80 text-lg font-medium">
                                Configure y monitoree las terminales táctiles distribuidas en el campus.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <PrintPointManager />
        </div>
    );
}
