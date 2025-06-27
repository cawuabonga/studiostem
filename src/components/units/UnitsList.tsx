
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { getDidacticUnits } from '@/config/firebase';
import type { DidacticUnit } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2 } from 'lucide-react';
import { EditUnitDialog } from './EditUnitDialog';
import { DeleteUnitDialog } from './DeleteUnitDialog';
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
  
  const handleDeleteUnit = (unit: DidacticUnit) => {
    setSelectedUnit(unit);
    setIsDeleteDialogOpen(true);
  };

  const handleDialogClose = (updated?: boolean) => {
    setIsEditDialogOpen(false);
    setIsDeleteDialogOpen(false);
    setSelectedUnit(null);
    if (updated) {
      fetchUnits();
      onUnitUpdated();
    }
  };

  // Pagination logic
  const lastItemIndex = currentPage * itemsPerPage;
  const firstItemIndex = lastItemIndex - itemsPerPage;
  const currentItems = units.slice(firstItemIndex, lastItemIndex);
  const totalPages = Math.ceil(units.length / itemsPerPage);


  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(itemsPerPage)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }
  
  if (!units.length) {
    return <p className="text-center text-muted-foreground">No hay unidades didácticas registradas.</p>;
  }

  return (
    <>
      <div className="rounded-md border relative">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead className="min-w-[150px]">P. de Estudios</TableHead>
              <TableHead className="min-w-[150px]">Nombre</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Módulo</TableHead>
              <TableHead>Total Horas</TableHead>
              <TableHead className="text-right sticky right-0 bg-background pr-4">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.map((unit) => (
              <TableRow key={unit.id}>
                <TableCell>{unit.studyProgram}</TableCell>
                <TableCell className="font-medium">{unit.name}</TableCell>
                <TableCell>{unit.period}</TableCell>
                <TableCell>{unit.module}</TableCell>
                <TableCell className="font-semibold">{unit.totalHours}</TableCell>
                <TableCell className="text-right sticky right-0 bg-background pr-4">
                  <Button variant="ghost" size="icon" onClick={() => handleEditUnit(unit)}>
                    <Edit2 className="h-4 w-4" />
                    <span className="sr-only">Editar Unidad</span>
                  </Button>
                   <Button variant="ghost" size="icon" onClick={() => handleDeleteUnit(unit)} className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Eliminar Unidad</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between pt-4">
        <div className="text-sm text-muted-foreground">
          Mostrando {Math.min(firstItemIndex + 1, units.length)} a {Math.min(lastItemIndex, units.length)} de {units.length} unidades.
        </div>
        <div className="flex items-center space-x-2">
           <span className="text-sm text-muted-foreground">
             Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage >= totalPages}
          >
            Siguiente
          </Button>
        </div>
      </div>
      {selectedUnit && isEditDialogOpen && (
        <EditUnitDialog
          unit={selectedUnit}
          isOpen={isEditDialogOpen}
          onClose={handleDialogClose}
        />
      )}
       {selectedUnit && isDeleteDialogOpen && (
        <DeleteUnitDialog
          unit={selectedUnit}
          isOpen={isDeleteDialogOpen}
          onClose={handleDialogClose}
        />
      )}
    </>
  );
}
