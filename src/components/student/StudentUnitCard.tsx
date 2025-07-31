
"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { EnrolledUnit } from "@/types";
import { ArrowRight, BookOpen, Clock } from "lucide-react";
import Link from "next/link";

interface StudentUnitCardProps {
    unit: EnrolledUnit;
}

export function StudentUnitCard({ unit }: StudentUnitCardProps) {
    return (
        <Card className="flex flex-col h-full hover:border-primary transition-colors">
            <CardHeader>
                <Badge variant="secondary" className="w-fit mb-2">{unit.programName}</Badge>
                <CardTitle>{unit.name}</CardTitle>
                <CardDescription>Período: {unit.period}</CardDescription>
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
            </CardContent>
            <CardFooter>
                <Link href={`/dashboard/academic/unidad/${unit.id}`} className="w-full">
                    <Button className="w-full">
                        Ver Contenido del Curso
                        <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                </Link>
            </CardFooter>
        </Card>
    );
}
