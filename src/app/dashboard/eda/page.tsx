
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileOutput, Printer, FileStack, History, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const edaModules = [
    {
        title: "Kioscos de Impresión",
        description: "Gestione los puntos físicos (terminales) y su estado de conexión.",
        href: "/dashboard/eda/kioscos",
        icon: Printer,
        color: "text-blue-500",
        bg: "bg-blue-50"
    },
    {
        title: "Diseño de Plantillas",
        description: "Configure la estructura y variables de los documentos autogenerados.",
        href: "/dashboard/eda/plantillas",
        icon: FileStack,
        color: "text-purple-500",
        bg: "bg-purple-50"
    },
    {
        title: "Historial de Emisiones",
        description: "Audite quién, cuándo y dónde se generó cada documento oficial.",
        href: "/dashboard/eda/historial",
        icon: History,
        color: "text-amber-500",
        bg: "bg-amber-50"
    }
];

export default function EDAMainPage() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Cabecera del Módulo */}
            <Card className="bg-primary text-primary-foreground border-none shadow-xl overflow-hidden relative rounded-3xl">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <FileOutput className="h-32 w-32" />
                </div>
                <CardHeader className="relative z-10 p-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                            <FileOutput className="h-8 w-8 text-accent" />
                        </div>
                        <div>
                            <CardTitle className="text-3xl font-black tracking-tighter uppercase">Sistema EDA</CardTitle>
                            <CardDescription className="text-primary-foreground/80 text-lg font-medium">
                                Elaboración de Documentos Automáticos via Kioscos IoT.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Panel de Módulos */}
            <div className="grid gap-6 md:grid-cols-3">
                {edaModules.map((module) => (
                    <Link href={module.href} key={module.title} className="group">
                        <Card className="h-full flex flex-col hover:border-primary hover:shadow-2xl transition-all duration-500 rounded-3xl overflow-hidden border-primary/5 bg-white">
                            <CardHeader>
                                <div className={cn("p-4 w-fit rounded-2xl mb-4 transition-transform group-hover:scale-110", module.bg, module.color)}>
                                    <module.icon className="h-8 w-8" />
                                </div>
                                <CardTitle className="text-xl font-black uppercase tracking-tight group-hover:text-primary transition-colors">
                                    {module.title}
                                </CardTitle>
                                <CardDescription className="text-sm font-medium leading-relaxed">
                                    {module.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="mt-auto pt-4 flex items-center gap-2 text-xs font-black uppercase text-primary tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                GESTIONAR MÓDULO <ArrowRight className="h-3 w-3" />
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Nota Informativa */}
            <div className="p-6 bg-blue-50 border-2 border-dashed border-blue-200 rounded-[2.5rem] flex gap-4 items-center">
                <div className="bg-white p-3 rounded-2xl shadow-sm">
                    <FileOutput className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                    <h4 className="font-black text-blue-800 uppercase text-sm">¿Cómo funciona EDA?</h4>
                    <p className="text-xs text-blue-700 font-medium leading-relaxed mt-1">
                        El sistema EDA permite que los alumnos identifiquen su identidad en terminales físicos usando su carnet RFID. 
                        Una vez identificados, pueden seleccionar documentos oficiales que el sistema rellena automáticamente con datos de 
                        programas, ciclos y notas, permitiendo una impresión instantánea sin intervención humana.
                    </p>
                </div>
            </div>
        </div>
    );
}

// Helper para concatenar clases (evita error si no está importado)
function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
