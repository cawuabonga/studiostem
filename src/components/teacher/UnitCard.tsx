
"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Unit } from "@/types";
import { ArrowRight, BookOpen, Clock, ImageIcon, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface AssignedUnit extends Unit {
    programName: string;
}

interface UnitCardProps {
    unit: AssignedUnit;
    onRegenerateImage: (unit: Unit) => void;
    isImageLoading: boolean;
}

export function UnitCard({ unit, onRegenerateImage, isImageLoading }: UnitCardProps) {
    return (
        <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-300 group">
             <div className="relative w-full h-40">
                {unit.imageUrl ? (
                    <Image
                        src={unit.imageUrl}
                        alt={`Imagen para ${unit.name}`}
                        fill
                        className="object-cover rounded-t-lg"
                        data-ai-hint="course image"
                    />
                ) : (
                    <div className="w-full h-40 bg-muted rounded-t-lg flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-muted-foreground" />
                    </div>
                )}
                 <Button 
                    size="sm"
                    variant="secondary"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onRegenerateImage(unit)}
                    disabled={isImageLoading}
                >
                    {isImageLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : <ImageIcon className="h-4 w-4" />}
                </Button>
            </div>
            <CardHeader>
                <Badge variant="secondary" className="w-fit mb-2">{unit.programName}</Badge>
                <CardTitle>{unit.name}</CardTitle>
                <CardDescription>Módulo: {unit.moduleId}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center">
                    <BookOpen className="h-4 w-4 mr-2" />
                    <span>{unit.credits} créditos</span>
                </div>
                <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>{unit.totalHours} horas totales</span>
                </div>
                 <div className="flex items-center">
                    <Badge variant="outline">{unit.turno}</Badge>
                </div>
            </CardContent>
            <CardFooter>
                <Link href={`/dashboard/docente/unidad/${unit.id}`} className="w-full">
                    <Button className="w-full">
                        Gestionar Unidad
                        <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                </Link>
            </CardFooter>
        </Card>
    );
}
