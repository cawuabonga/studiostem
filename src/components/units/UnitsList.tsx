
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getUnits, getPrograms, addUnit } from '@/config/firebase';
import type { Unit, Program } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, Copy } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { EditUnitDialog } from './EditUnitDialog';
import { DeleteUnitDialog } from './DeleteUnitDialog';
import { Input } from '../ui/input';

interface UnitsListProps {
    onDataChange: () => void;
}

const PAGE_SIZE = 10;

export function UnitsList({ onDataChange }: UnitsListProps) {
  const [units, setUnits] = useState<Unit[]>([]);
  const [programs, setPrograms] = useState<Map<string, Program>>(new Map());
  const [loading, setLoading] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const { instituteId } = useAuth();

  const fetchUnitsAndPrograms = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const [fetchedUnits, fetchedPrograms] = await Promise.all([
          getUnits(id),
          getPrograms(id)
      ]);
      const programMap = new Map(fetchedPrograms.map(p => [p.id, p]));
      setUnits(fetchedUnits);
      setPrograms(programMap);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (instituteId) {
      fetchUnitsAndPrograms(instituteId);
    } else {
      setLoading(false);
    }
  }, [instituteId, fetchUnitsAndPrograms]);
  
  const handleDialogClose = (updated?: boolean) => {
    setIsEditDialogOpen(false);
    setIsDeleteDialogOpen(false);
    setSelectedUnit(null);
    if (updated && instituteId) {
      fetchUnitsAndPrograms(instituteId);
      onDataChange();
    }
  };

  const handleDuplicate = async (unitToDuplicate: Unit) => {
    if (!instituteId) {
        toast({ title: 'Error', description: 'ID de instituto no encontrado.', variant: 'destructive'});
        return;
    }
    try {
        const { id, ...unitData } = unitToDuplicate;
        const newUnitData = {
            ...unitData,
            name: `${unitData.name} (Copia)`,
            code: `${unitData.code}-copia`
        };
        await addUnit(instituteId, newUnitData);
        toast({
            title: '¡Unidad Duplicada!',
            description: `Se creó una copia de "${unitToDuplicate.name}".`,
        });
        fetchUnitsAndPrograms(instituteId);
        onDataChange();
    } catch (error) {
        toast({
            title: 'Error',
            description: 'No se pudo duplicar la unidad.',
            variant: 'destructive',
        });
    }
  };

  const filteredUnits = useMemo(() => 
    units.filter(unit => 
        unit.name.toLowerCase().includes(filter.toLowerCase()) ||
        unit.code.toLowerCase().includes(filter.toLowerCase()) ||
        (programs.get(unit.programId)?.name || '').toLowerCase().includes(filter.toLowerCase())
    ), [units, filter, programs]);
  
  const paginatedUnits = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return filteredUnits.slice(start, end);
  }, [filteredUnits, currentPage]);

  const totalPages = Math.ceil(filteredUnits.length / PAGE_SIZE);

  if (loading) {
    return (
      <div className="space-y-2">
         <Skeleton className="h-10 w-1/3 mb-2" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }
  
  if (!instituteId) {
      return <p className="text-center text-muted-foreground">Seleccionando instituto...</p>;
  }
  
  if (!units.length) {
    return <p className="text-center text-muted-foreground">No hay unidades didácticas registradas.</p>;
  }

  return (
    <>
      <div className="mb-4">
        <Input 
          placeholder="Buscar por nombre, código o programa..."
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Programa</TableHead>
              <TableHead>Módulo</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Total Horas</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUnits.map((unit) => {
                const program = programs.get(unit.programId);
                const module = program?.modules.find(m => m.code === unit.moduleId);
                return (
                  <TableRow key={unit.id}>
                    <TableCell className="font-medium">{unit.name}</TableCell>
                    <TableCell>{program?.name || 'N/A'}</TableCell>
                    <TableCell>{module?.code || 'N/A'}</TableCell>
                    <TableCell>{unit.period}</TableCell>
                    <TableCell>{unit.totalHours}</TableCell>
                    <TableCell className="text-right space-x-2">
                       <Button variant="outline" size="icon" onClick={() => handleDuplicate(unit)}>
                        <Copy className="h-4 w-4" />
                        <span className="sr-only">Duplicar</span>
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => {setSelectedUnit(unit); setIsEditDialogOpen(true);}}>
                        <Edit2 className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => {setSelectedUnit(unit); setIsDeleteDialogOpen(true);}}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Eliminar</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
            })}
          </TableBody>
        </Table>
      </div>

       <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          Anterior
        </Button>
        <span className="text-sm">
            Página {currentPage} de {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Siguiente
        </Button>
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
