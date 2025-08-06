

"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Unit } from "@/types";
import { ArrowRight, BookOpen, Clock } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface AssignedUnit extends Unit {
    programName: string;
}

interface UnitCardProps {
    unit: AssignedUnit;
}

export function UnitCard({ unit }: UnitCardProps) {
    return (
        <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-300">
             {unit.imageUrl ? (
                <div className="relative w-full h-40">
                    <Image
                        src={unit.imageUrl}
                        alt={`Imagen para ${unit.name}`}
                        fill
                        className="object-cover rounded-t-lg"
                        data-ai-hint="course image"
                    />
                </div>
            ) : (
                <div className="w-full h-40 bg-muted rounded-t-lg flex items-center justify-center">
                    <BookOpen className="h-12 w-12 text-muted-foreground" />
                </div>
            )}
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
