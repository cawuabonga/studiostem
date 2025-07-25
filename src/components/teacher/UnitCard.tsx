
"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Unit } from "@/types";
import { ArrowRight, BookOpen, Clock } from "lucide-react";
import Link from "next/link";

interface AssignedUnit extends Unit {
    programName: string;
}

interface UnitCardProps {
    unit: AssignedUnit;
}

export function UnitCard({ unit }: UnitCardProps) {
    return (
        <Card className="flex flex-col h-full">
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
