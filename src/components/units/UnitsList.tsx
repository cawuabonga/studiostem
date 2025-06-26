
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { getDidacticUnits } from '@/config/firebase';
import type { DidacticUnit } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit2 } from 'lucide-react';
import { EditUnitDialog } from './EditUnitDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

interface UnitsListProps {
    onUnitUpdated: () => void;
}

export function UnitsList({ onUnitUpdated }: UnitsListProps) {
  const [units, setUnits] = useState<DidacticUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState<DidacticUnit | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchUnits = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedUnits = await getDidacticUnits();
      setUnits(fetchedUnits);
    } catch (error) {
      console.error("Error fetching units:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las unidades didácticas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  const handleEditUnit = (unit: DidacticUnit) => {
    setSelectedUnit(unit);
    setIsEditDialogOpen(true);
  };

  const handleDialogClose = (updated?: boolean) => {
    setIsEditDialogOpen(false);
    setSelectedUnit(null);
    if (updated) {
      fetchUnits();
      onUnitUpdated();
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }
  
  if (!units.length) {
    return <p className="text-center text-muted-foreground">No hay unidades didácticas registradas.</p>;
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Nombre</TableHead>
              <TableHead>Créditos</TableHead>
              <TableHead>H. Teóricas</TableHead>
              <TableHead>H. Prácticas</TableHead>
              <TableHead>Grupos</TableHead>
              <TableHead>Total Horas</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {units.map((unit) => (
              <TableRow key={unit.id}>
                <TableCell className="font-medium">{unit.name}</TableCell>
                <TableCell>{unit.credits}</TableCell>
                <TableCell>{unit.theoreticalHours}</TableCell>
                <TableCell>{unit.practicalHours}</TableCell>
                <TableCell>{unit.numberOfGroups}</TableCell>
                <TableCell className="font-semibold">{unit.totalHours}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleEditUnit(unit)}>
                    <Edit2 className="h-4 w-4" />
                    <span className="sr-only">Editar Unidad</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {selectedUnit && (
        <EditUnitDialog
          unit={selectedUnit}
          isOpen={isEditDialogOpen}
          onClose={handleDialogClose}
        />
      )}
    </>
  );
}
