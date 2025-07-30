
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { getAchievementIndicators } from '@/config/firebase';
import type { AchievementIndicator, Unit } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { AddIndicatorForm } from './AddIndicatorForm';
import { IndicatorItem } from './IndicatorItem';
import { Separator } from '../ui/separator';

interface IndicatorsManagerProps {
  unit: Unit;
}

export function IndicatorsManager({ unit }: IndicatorsManagerProps) {
  const { instituteId } = useAuth();
  const { toast } = useToast();
  const [indicators, setIndicators] = useState<AchievementIndicator[]>([]);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);

  const fetchIndicators = useCallback(async () => {
    if (!instituteId || !unit.id) return;
    setLoading(true);
    try {
      const fetchedIndicators = await getAchievementIndicators(instituteId, unit.id);
      setIndicators(fetchedIndicators);
    } catch (error) {
      console.error("Error fetching indicators:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los indicadores de logro.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [instituteId, unit.id, toast]);

  useEffect(() => {
    fetchIndicators();
  }, [fetchIndicators, version]);

  const handleDataChanged = () => {
    setVersion(v => v + 1);
  };

  const handleEdit = (indicator: AchievementIndicator) => {
    // TODO: Implement edit functionality, likely opening a dialog
    toast({
        title: "Función no implementada",
        description: `La edición para "${indicator.name}" estará disponible pronto.`,
    })
  };

  return (
    <div className="space-y-6">
        <AddIndicatorForm unit={unit} onIndicatorAdded={handleDataChanged} />

        <Separator />
        
        <Card>
            <CardHeader>
                <CardTitle>Indicadores Registrados</CardTitle>
                <CardDescription>Lista de todos los indicadores de logro para esta unidad didáctica.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {loading ? (
                    <>
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                    </>
                ) : indicators.length > 0 ? (
                    indicators.map(indicator => (
                        <IndicatorItem
                            key={indicator.id}
                            indicator={indicator}
                            unitId={unit.id}
                            onIndicatorDeleted={handleDataChanged}
                            onEdit={handleEdit}
                        />
                    ))
                ) : (
                    <p className="text-center text-muted-foreground py-4">
                        Aún no se han registrado indicadores para esta unidad.
                    </p>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
