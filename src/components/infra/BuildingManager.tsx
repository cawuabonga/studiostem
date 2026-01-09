
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion } from '@/components/ui/accordion';

export function BuildingManager({ instituteId }: { instituteId: string }) {
    
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Gestión de Infraestructura</CardTitle>
                        <CardDescription>
                            Administre los edificios, ambientes y activos de su instituto.
                        </CardDescription>
                    </div>
                     <Button onClick={() => {}}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Añadir Edificio
                    </Button>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                        <p className="text-muted-foreground text-center py-10">El módulo de gestión de edificios y activos se implementará próximamente.</p>
                    </Accordion>
                </CardContent>
            </Card>
        </div>
    );
}
