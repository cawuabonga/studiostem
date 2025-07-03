"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getDidacticUnits, addDidacticUnit } from '@/config/firebase';
import type { DidacticUnit, UnitFilters } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, Copy } from 'lucide-react';
import { EditUnitDialog } from './EditUnitDialog';
import { DeleteUnitDialog } from './DeleteUnitDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

interface UnitsListProps {
    onDataChange: () => void;
    filters: UnitFilters;
}

export function UnitsList({ onDataChange, filters }: UnitsListProps) {
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

  const filteredUnits = useMemo(() => {
    return units.filter(unit => {
      const { studyProgram, period, module, name } = filters;
      if (studyProgram && unit.studyProgram !== studyProgram) return false;
      if (period && unit.period !== period) return false;
      if (module && unit.module !== module) return false;
      if (name && !unit.name.toLowerCase().includes(name.toLowerCase())) return false;
      return true;
    });
  }, [units, filters]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);


  const handleEditUnit = (unit: DidacticUnit) => {
    setSelectedUnit(unit);
    setIsEditDialogOpen(true);
  };
  
  const handleDeleteUnit = (unit: DidacticUnit) => {
    setSelectedUnit(unit);
    setIsDeleteDialogOpen(true);
  };

  const handleDuplicateUnit = async (unitToDuplicate: DidacticUnit) => {
    const { id, ...unitData } = unitToDuplicate;
    
    toast({
        title: 'Duplicando unidad...',
        description: `Creando una copia de "${unitData.name}".`,
    });

    try {
        await addDidacticUnit({
            ...unitData,
            name: `${unitData.name} (Copia)`,
        });
        toast({
            title: '¡Unidad Duplicada!',
            description: 'La lista se ha actualizado.',
        });
        fetchUnits();
        onDataChange();
    } catch (error) {
        console.error('Error duplicating unit:', error);
        toast({
            title: 'Error',
            description: 'No se pudo duplicar la unidad.',
            variant: 'destructive',
        });
    }
  };

  const handleDialogClose = (updated?: boolean) => {
    setIsEditDialogOpen(false);
    setIsDeleteDialogOpen(false);
    setSelectedUnit(null);
    if (updated) {
      fetchUnits();
      onDataChange();
    }
  };

  // Pagination logic
  const lastItemIndex = currentPage * itemsPerPage;
  const firstItemIndex = lastItemIndex - itemsPerPage;
  const currentItems = filteredUnits.slice(firstItemIndex, lastItemIndex);
  const totalPages = Math.ceil(filteredUnits.length / itemsPerPage);


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
    return <p className="text-center text-muted-foreground py-8">No hay unidades didácticas registradas.</p>;
  }
  
  if (filteredUnits.length === 0 && !loading) {
    return <p className="text-center text-muted-foreground py-8">No se encontraron unidades con los filtros aplicados.</p>;
  }

  return (
    <>
      <div className="rounded-md border relative">
        <Table className="text-xs">
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead className="min-w-[150px]">P. de Estudios</TableHead>
              <TableHead className="min-w-[150px]">Nombre</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Módulo</TableHead>
              <TableHead>Turno</TableHead>
              <TableHead>Total Horas</TableHead>
              <TableHead className="w-[100px] text-right sticky right-0 bg-background pr-4">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.map((unit) => (
              <TableRow key={unit.id}>
                <TableCell>{unit.studyProgram}</TableCell>
                <TableCell className="font-medium">{unit.name}</TableCell>
                <TableCell>{unit.period}</TableCell>
                <TableCell>{unit.module}</TableCell>
                <TableCell>{unit.shift || '---'}</TableCell>
                <TableCell className="font-semibold">{unit.totalHours}</TableCell>
                <TableCell className="text-right sticky right-0 bg-background pr-4">
                  <div className="inline-flex items-center">
                    <Button variant="ghost" size="icon" onClick={() => handleDuplicateUnit(unit)}>
                      <Copy className="h-4 w-4" />
                      <span className="sr-only">Duplicar Unidad</span>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleEditUnit(unit)}>
                      <Edit2 className="h-4 w-4" />
                      <span className="sr-only">Editar Unidad</span>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteUnit(unit)} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Eliminar Unidad</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between pt-4">
        <div className="text-sm text-muted-foreground">
          Mostrando {Math.min(firstItemIndex + 1, filteredUnits.length)} a {Math.min(lastItemIndex, filteredUnits.length)} de {filteredUnits.length} unidades.
        </div>
        <div className="flex items-center space-x-2">
           <span className="text-sm text-muted-foreground">
             Página {currentPage} de {totalPages > 0 ? totalPages : 1}
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
