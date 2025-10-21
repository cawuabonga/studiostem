

"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getUnits, getPrograms, updateUnitImage, duplicateUnit, getStaffProfileByDocumentId } from '@/config/firebase';
import type { Unit, Program, ProgramModule, UnitPeriod, StaffProfile } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, Copy, MoreHorizontal, ImageIcon, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { EditUnitDialog } from './EditUnitDialog';
import { DeleteUnitDialog } from './DeleteUnitDialog';
import { Input } from '../ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { generateUnitImage } from '@/ai/flows/generate-unit-image-flow';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';

interface UnitsListProps {
    onDataChange: () => void;
}

const PAGE_SIZE = 10;
const periods: UnitPeriod[] = ['MAR-JUL', 'AGO-DIC'];

export function UnitsList({ onDataChange }: UnitsListProps) {
  const [units, setUnits] = useState<Unit[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [programMap, setProgramMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // State for filters
  const [textFilter, setTextFilter] = useState('');
  const [programFilter, setProgramFilter] = useState('all');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState<UnitPeriod | 'all'>('all');
  
  const [isCoordinatorView, setIsCoordinatorView] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [imageLoadingId, setImageLoadingId] = useState<string | null>(null);
  const { toast } = useToast();
  const { instituteId, user, hasPermission } = useAuth();
  
  const isFullAdmin = hasPermission('academic:program:manage');
  
  const fetchUnitsAndPrograms = useCallback(async () => {
    if (!instituteId) return;
    setLoading(true);

    try {
      let effectiveProgramFilter = 'all';

      // Determine user role and set program filter accordingly
      if (hasPermission('academic:unit:manage:own') && !isFullAdmin && user?.documentId) {
        setIsCoordinatorView(true);
        const profile = await getStaffProfileByDocumentId(instituteId, user.documentId);
        if (profile?.programId) {
          effectiveProgramFilter = profile.programId;
          setProgramFilter(profile.programId); // Set and lock the filter
        } else {
          toast({ title: 'Error de Coordinador', description: 'No se pudo determinar el programa para tu perfil.', variant: 'destructive'});
        }
      } else {
        setIsCoordinatorView(false);
      }

      const [fetchedUnits, fetchedPrograms] = await Promise.all([
          getUnits(instituteId),
          getPrograms(instituteId)
      ]);
      setUnits(fetchedUnits);
      setPrograms(fetchedPrograms);
      setProgramMap(new Map(fetchedPrograms.map(p => [p.id, p.name])));

    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [instituteId, toast, user, hasPermission, isFullAdmin]);

  useEffect(() => {
    fetchUnitsAndPrograms();
  }, [fetchUnitsAndPrograms]);
  
  const handleDialogClose = (updated?: boolean) => {
    setIsEditDialogOpen(false);
    setIsDeleteDialogOpen(false);
    setSelectedUnit(null);
    if (updated) {
      fetchUnitsAndPrograms();
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
        fetchUnitsAndPrograms(); // Refetch to get the new URL
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
        fetchUnitsAndPrograms();
    } catch (error: any) {
        toast({ title: 'Error', description: `No se pudo duplicar la unidad: ${error.message}`, variant: 'destructive' });
    }
  };

  const availableModules = useMemo(() => {
      if(programFilter === 'all') return [];
      const program = programs.find(p => p.id === programFilter);
      return program?.modules || [];
  }, [programFilter, programs]);

  const filteredUnits = useMemo(() => 
    units.filter(unit => {
        const program = programMap.get(unit.programId);
        const programData = programs.find(p => p.id === unit.programId);
        const module = programData?.modules.find(m => m.code === unit.moduleId);
        
        const matchesProgram = programFilter === 'all' || unit.programId === programFilter;
        const matchesModule = moduleFilter === 'all' || unit.moduleId === moduleFilter;
        const matchesPeriod = periodFilter === 'all' || unit.period === periodFilter;
        const matchesText = textFilter === '' || 
                            unit.name.toLowerCase().includes(textFilter.toLowerCase()) ||
                            unit.code.toLowerCase().includes(textFilter.toLowerCase()) ||
                            (program || '').toLowerCase().includes(textFilter.toLowerCase()) ||
                            (module?.name || '').toLowerCase().includes(textFilter.toLowerCase());

        return matchesProgram && matchesModule && matchesPeriod && matchesText;
    }), [units, textFilter, programFilter, moduleFilter, periodFilter, programMap, programs]);
  
  const paginatedUnits = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return filteredUnits.slice(start, end);
  }, [filteredUnits, currentPage]);

  const totalPages = Math.ceil(filteredUnits.length / PAGE_SIZE);
  
  useEffect(() => {
      setCurrentPage(1);
  }, [textFilter, programFilter, moduleFilter, periodFilter]);

  useEffect(() => {
    // Reset module filter when program filter changes
    setModuleFilter('all');
  }, [programFilter]);

  if (loading) {
    return (
      <div className="space-y-2">
         <Skeleton className="h-10 w-full mb-2" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }
  
  if (!instituteId) {
      return <p className="text-center text-muted-foreground">Seleccionando instituto...</p>;
  }
  
  if (!loading && !units.length) {
    return <p className="text-center text-muted-foreground">No hay unidades didácticas registradas.</p>;
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-2 mb-4 flex-wrap">
        <Input 
          placeholder="Buscar por nombre, código..."
          value={textFilter}
          onChange={(e) => setTextFilter(e.target.value)}
          className="max-w-sm"
        />
        <Select value={programFilter} onValueChange={setProgramFilter} disabled={isCoordinatorView}>
            <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filtrar por programa..." />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Todos los Programas</SelectItem>
                {programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
        </Select>
        <Select value={moduleFilter} onValueChange={setModuleFilter} disabled={availableModules.length === 0}>
            <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filtrar por módulo..." />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Todos los Módulos</SelectItem>
                {availableModules.map(m => <SelectItem key={m.code} value={m.code}>{m.name}</SelectItem>)}
            </SelectContent>
        </Select>
        <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as any)}>
            <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filtrar por período..." />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Todos los Períodos</SelectItem>
                {periods.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
        </Select>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
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
            {paginatedUnits.map((unit) => {
                const program = programs.find(p => p.id === unit.programId);
                return (
                  <TableRow key={unit.id}>
                    <TableCell className="font-medium">{unit.name} <br/><span className="text-xs text-muted-foreground font-mono">{unit.code}</span></TableCell>
                    {isFullAdmin && <TableCell><Badge variant="outline">{program?.abbreviation || 'N/A'}</Badge></TableCell>}
                    <TableCell className="text-center">{unit.semester}</TableCell>
                    <TableCell>{unit.period}</TableCell>
                    <TableCell>{unit.turno}</TableCell>
                    <TableCell className="text-center">{unit.credits}</TableCell>
                    <TableCell className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menú</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => {setSelectedUnit(unit); setIsEditDialogOpen(true);}}>
                                    <Edit2 className="mr-2 h-4 w-4" /> Editar
                                </DropdownMenuItem>
                                 <DropdownMenuItem onClick={() => handleDuplicate(unit.id)}>
                                    <Copy className="mr-2 h-4 w-4" /> Duplicar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleRegenerateImage(unit)} disabled={imageLoadingId === unit.id}>
                                    {imageLoadingId === unit.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-2 h-4 w-4" />}
                                    Regenerar Imagen
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => {setSelectedUnit(unit); setIsDeleteDialogOpen(true);}} className="text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
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

