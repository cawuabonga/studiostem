
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getUnits, getPrograms, updateUnitImage, duplicateUnit, bulkDeleteUnits } from '@/config/firebase';
import type { Unit, Program, UnitPeriod } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, Copy, MoreHorizontal, ImageIcon, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { EditUnitDialog } from './EditUnitDialog';
import { DeleteUnitDialog } from './DeleteUnitDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { generateUnitImage } from '@/ai/flows/generate-unit-image-flow';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';

interface UnitsListProps {
    instituteId: string;
    filters: {
        programFilter: string;
        moduleFilter: string;
        semesterFilter: string;
        periodFilter: UnitPeriod | 'all';
        textFilter: string;
    };
    onDataChange: () => void;
}

const PAGE_SIZE = 10;

export function UnitsList({ instituteId, filters, onDataChange }: UnitsListProps) {
  const [units, setUnits] = useState<Unit[]>([]);
  const [programMap, setProgramMap] = useState<Map<string, string>>(new Map());
  
  const [loading, setLoading] = useState(true);
  
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [selectedUnitIds, setSelectedUnitIds] = useState<Set<string>>(new Set());
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [imageLoadingId, setImageLoadingId] = useState<string | null>(null);
  const { toast } = useToast();
  const { hasPermission } = useAuth();
  
  const isFullAdmin = hasPermission('academic:program:manage');
  
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
        const [fetchedUnits, fetchedPrograms] = await Promise.all([
            getUnits(instituteId),
            getPrograms(instituteId)
        ]);

        setProgramMap(new Map(fetchedPrograms.map(p => [p.id, p.name])));
        
        // Apply filters here
        const filtered = fetchedUnits.filter(unit => {
            const program = fetchedPrograms.find(p => p.id === unit.programId);
            const module = program?.modules.find(m => m.code === unit.moduleId);
            
            const matchesProgram = filters.programFilter === 'all' || unit.programId === filters.programFilter;
            const matchesModule = filters.moduleFilter === 'all' || unit.moduleId === filters.moduleFilter;
            const matchesSemester = filters.semesterFilter === 'all' || String(unit.semester) === filters.semesterFilter;
            const matchesPeriod = filters.periodFilter === 'all' || unit.period === filters.periodFilter;
            const matchesText = filters.textFilter === '' || 
                                unit.name.toLowerCase().includes(filters.textFilter.toLowerCase()) ||
                                unit.code.toLowerCase().includes(filters.textFilter.toLowerCase()) ||
                                (program?.name || '').toLowerCase().includes(filters.textFilter.toLowerCase()) ||
                                (module?.name || '').toLowerCase().includes(filters.textFilter.toLowerCase());

            return matchesProgram && matchesModule && matchesSemester && matchesPeriod && matchesText;
        });

        setUnits(filtered);
        setSelectedUnitIds(new Set()); // Clear selection on data change
        setCurrentPage(1); // Reset to first page on new filter

    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las unidades.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [instituteId, toast, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = useCallback(() => {
     fetchData();
  }, [fetchData]);
  
  const handleDialogClose = (updated?: boolean) => {
    setIsEditDialogOpen(false);
    setIsDeleteDialogOpen(false);
    setSelectedUnit(null);
    if (updated) {
      handleRefresh();
      onDataChange();
    }
  };

  const handleRegenerateImage = async (unit: Unit) => {
    if (!instituteId) return;
    setImageLoadingId(unit.id);
    try {
        const imageUrl = await generateUnitImage({ unitName: unit.name });
        await updateUnitImage(instituteId, unit.id, imageUrl);
        toast({ title: 'Imagen Generada', description: `Se ha generado una nueva imagen para ${unit.name}`});
        handleRefresh();
    } catch (error) {
        toast({ title: 'Error', description: 'No se pudo generar la imagen.', variant: 'destructive' });
    } finally {
        setImageLoadingId(null);
    }
  }

  const handleDuplicate = async (unitId: string) => {
    if (!instituteId) return;
    try {
        await duplicateUnit(instituteId, unitId);
        toast({ title: 'Unidad Duplicada', description: 'La unidad didáctica se ha duplicado correctamente.' });
        handleRefresh();
    } catch (error: any) {
        toast({ title: 'Error', description: `No se pudo duplicar la unidad: ${error.message}`, variant: 'destructive' });
    }
  };
  
  const handleBulkDelete = async () => {
    if (!instituteId || selectedUnitIds.size === 0) return;
    try {
        await bulkDeleteUnits(instituteId, Array.from(selectedUnitIds));
        toast({
            title: "Eliminación Exitosa",
            description: `${selectedUnitIds.size} unidades han sido eliminadas.`,
        });
        handleRefresh();
    } catch (error) {
        toast({ title: "Error", description: "No se pudieron eliminar las unidades seleccionadas.", variant: "destructive"});
    }
  };

  const paginatedUnits = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return units.slice(start, end);
  }, [units, currentPage]);

  const totalPages = Math.ceil(units.length / PAGE_SIZE);

  const handleSelectAll = (checked: boolean | string) => {
    if (checked) {
        setSelectedUnitIds(new Set(units.map(u => u.id)));
    } else {
        setSelectedUnitIds(new Set());
    }
  };

  const handleSelectOne = (unitId: string, isSelected: boolean) => {
    const newSet = new Set(selectedUnitIds);
    if (isSelected) {
        newSet.add(unitId);
    } else {
        newSet.delete(unitId);
    }
    setSelectedUnitIds(newSet);
  };

  const isAllSelectedOnPage = paginatedUnits.length > 0 && paginatedUnits.every(u => selectedUnitIds.has(u.id));
  const isSomeSelectedOnPage = paginatedUnits.some(u => selectedUnitIds.has(u.id));

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }
  
  if (!units.length) {
    return <p className="text-center text-muted-foreground py-8">No se encontraron unidades didácticas con los filtros aplicados.</p>;
  }

  return (
    <>
      {selectedUnitIds.size > 0 && (
         <div className="mb-4 flex items-center justify-between bg-muted p-3 rounded-lg">
            <p className="text-sm font-medium">{selectedUnitIds.size} unidad(es) seleccionada(s)</p>
             <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                        <Trash2 className="mr-2 h-4 w-4"/>
                        Eliminar Seleccionadas
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminarán permanentemente {selectedUnitIds.size} unidades didácticas.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
      )}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                    checked={isAllSelectedOnPage}
                    onCheckedChange={(checked) => {
                        const newSet = new Set(selectedUnitIds);
                        paginatedUnits.forEach(u => {
                            if(checked) newSet.add(u.id);
                            else newSet.delete(u.id);
                        });
                        setSelectedUnitIds(newSet);
                    }}
                 />
              </TableHead>
              <TableHead>Nombre</TableHead>
              {isFullAdmin && <TableHead>Programa</TableHead>}
              <TableHead>Semestre</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Turno</TableHead>
              <TableHead>Créditos</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
             {paginatedUnits.map((unit) => (
                <TableRow key={unit.id} data-state={selectedUnitIds.has(unit.id) && "selected"}>
                    <TableCell>
                        <Checkbox
                            checked={selectedUnitIds.has(unit.id)}
                            onCheckedChange={(checked) => handleSelectOne(unit.id, !!checked)}
                        />
                    </TableCell>
                    <TableCell className="font-medium">{unit.name} <br/><span className="text-xs text-muted-foreground font-mono">{unit.code}</span></TableCell>
                    {isFullAdmin && <TableCell><Badge variant="outline">{programMap.get(unit.programId) || 'N/A'}</Badge></TableCell>}
                    <TableCell className="text-center">{unit.semester}</TableCell>
                    <TableCell>{unit.period}</TableCell>
                    <TableCell>{unit.turno}</TableCell>
                    <TableCell className="text-center">{unit.credits}</TableCell>
                    <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => {setSelectedUnit(unit); setIsEditDialogOpen(true);}}>
                            <Edit2 className="h-4 w-4" />
                        </Button>
                         <Button variant="ghost" size="icon" onClick={() => handleDuplicate(unit.id)}>
                            <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleRegenerateImage(unit)} disabled={imageLoadingId === unit.id}>
                            {imageLoadingId === unit.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                        </Button>
                         <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => {setSelectedUnit(unit); setIsDeleteDialogOpen(true);}}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </TableCell>
                </TableRow>
             ))}
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
