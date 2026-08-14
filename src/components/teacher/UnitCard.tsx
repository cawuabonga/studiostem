
"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Unit } from "@/types";
import { ArrowRight, BookOpen, Clock, Upload, Loader2, CalendarRange, GraduationCap, Lock, Activity } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface AssignedUnit extends Unit {
    programName: string;
}

interface UnitCardProps {
    unit: AssignedUnit;
    year: string;
    onUploadImageClick: (unit: Unit) => void;
}

export function UnitCard({ unit, year, onUploadImageClick }: UnitCardProps) {
    const isClosed = unit.isClosed || false;

    return (
        <Card className={cn(
            "flex flex-col h-full hover:shadow-xl transition-all duration-300 group border-primary/5",
            isClosed ? "bg-slate-50 border-slate-200 opacity-90" : "bg-white"
        )}>
             <div className="relative w-full h-40">
                {unit.imageUrl ? (
                    <Image
                        src={unit.imageUrl}
                        alt={`Imagen para ${unit.name}`}
                        fill
                        className={cn("object-cover rounded-t-lg transition-transform duration-500 group-hover:scale-105", isClosed && "grayscale")}
                        data-ai-hint="course image"
                    />
                ) : (
                    <div className="w-full h-40 bg-muted rounded-t-lg flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-muted-foreground opacity-20" />
                    </div>
                )}
                
                {/* Badge de Estado */}
                <div className="absolute top-2 left-2 flex gap-1">
                    {isClosed ? (
                        <Badge className="bg-slate-900/80 backdrop-blur-md text-white border-none font-black text-[9px] uppercase tracking-widest px-3">
                            <Lock className="h-2.5 w-2.5 mr-1.5" /> Acta Cerrada
                        </Badge>
                    ) : (
                        <Badge className="bg-blue-600/80 backdrop-blur-md text-white border-none font-black text-[9px] uppercase tracking-widest px-3">
                            <Activity className="h-2.5 w-2.5 mr-1.5 animate-pulse" /> En Curso
                        </Badge>
                    )}
                </div>

                {!isClosed && (
                    <Button 
                        size="sm"
                        variant="secondary"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-full h-8 w-8 p-0 bg-white/90 backdrop-blur shadow-md"
                        onClick={() => onUploadImageClick(unit)}
                    >
                        <Upload className="h-4 w-4" />
                    </Button>
                )}
            </div>

            <CardHeader className="pb-2">
                <Badge variant="secondary" className="w-fit mb-2 text-[10px] font-bold uppercase tracking-tight truncate max-w-full">
                    {unit.programName}
                </Badge>
                <CardTitle className="text-xl font-black uppercase tracking-tighter leading-tight line-clamp-2 min-h-[3rem]">
                    {unit.name}
                </CardTitle>
                <CardDescription className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                    <CalendarRange className="h-3 w-3" /> Módulo: {unit.moduleId}
                </CardDescription>
            </CardHeader>

            <CardContent className="flex-grow space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-xl bg-muted/30 border border-dashed flex items-center gap-2">
                        <BookOpen className="h-3.5 w-3.5 text-primary" />
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black uppercase text-muted-foreground leading-none">Créditos</span>
                            <span className="text-xs font-black">{unit.credits} pts</span>
                        </div>
                    </div>
                    <div className="p-2 rounded-xl bg-muted/30 border border-dashed flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-primary" />
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black uppercase text-muted-foreground leading-none">Horas</span>
                            <span className="text-xs font-black">{unit.totalHours} h/t</span>
                        </div>
                    </div>
                    <div className="p-2 rounded-xl bg-muted/30 border border-dashed flex items-center gap-2">
                        <GraduationCap className="h-3.5 w-3.5 text-primary" />
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black uppercase text-muted-foreground leading-none">Semestre</span>
                            <span className="text-xs font-black">{unit.semester}° Ciclo</span>
                        </div>
                    </div>
                    <div className="p-2 rounded-xl bg-muted/30 border border-dashed flex items-center gap-2">
                        <div className="p-1 bg-white rounded shadow-sm">
                            <span className="text-[9px] font-black text-primary uppercase">{unit.turno[0]}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black uppercase text-muted-foreground leading-none">Turno</span>
                            <span className="text-xs font-black uppercase">{unit.turno}</span>
                        </div>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="pt-0">
                <Link href={`/dashboard/docente/unidad/${unit.id}?year=${year}`} className="w-full">
                    <Button className={cn(
                        "w-full font-black uppercase text-xs tracking-widest h-11 shadow-lg",
                        isClosed && "bg-slate-700 hover:bg-slate-800"
                    )}>
                        {isClosed ? "VER REGISTRO CERRADO" : "GESTIONAR UNIDAD"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </Link>
            </CardFooter>
        </Card>
    );
}
