
"use client";

import React from 'react';
import { AIConfigManager } from '@/components/superadmin/AIConfigManager';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Cpu } from 'lucide-react';

export default function ManageAIPage() {
    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <Card className="bg-primary text-primary-foreground border-none shadow-xl overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Cpu className="h-24 w-24" />
                </div>
                <CardHeader>
                    <CardTitle className="text-3xl font-black tracking-tight">ORQUESTACIÓN DE IA</CardTitle>
                    <CardDescription className="text-primary-foreground/80 text-lg">
                        Administre la conexión con modelos de lenguaje locales o en la nube.
                    </CardDescription>
                </CardHeader>
            </Card>

            <AIConfigManager />
        </div>
    );
}
