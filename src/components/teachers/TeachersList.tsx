

"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getStaffProfiles, getPrograms, getRoles, bulkDeleteStaff } from '@/config/firebase';
import type { Teacher, Program, StaffProfile, Role } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit2, Trash2, MoreHorizontal, Eye } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '../ui/input';
import Link from 'next/link';
import { EditStaffProfileDialog } from '../users/EditStaffProfileDialog';
import { DeleteStaffProfileDialog } from '../users/DeleteStaffProfileDialog';
import { Checkbox } from '../ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface TeachersListProps {
    instituteId: string;
    onDataChange: () => void;
}

const PAGE_SIZE = 10;
const conditions = ['NOMBRADO', 'CONTRATADO'];

export function TeachersList({ instituteId, onDataChange }: TeachersListProps) {
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<StaffProfile | null>(null);
  const [selectedProfileIds, setSelectedProfileIds] = useState<Set<string>>(new Set());
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const [textFilter, setTextFilter] = useState('');
  const [programFilter, setProgramFilter] = useState('all');
  const [conditionFilter, setConditionFilter] = useState('all');

  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const { hasPermission } = useAuth();

  const canEdit = hasPermission('users:staff:manage');

  const fetchData = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const [fetchedStaff, fetchedPrograms, fetchedRoles] = await Promise.all([
        getStaffProfiles(id),
        getPrograms(id),
        getRoles(id),
      ]);
      setStaff(fetchedStaff);
      setPrograms(fetchedPrograms);
      setRoles(fetchedRoles);
      setSelectedProfileIds(new Set());
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
      fetchData(instituteId);
    }
  }, [instituteId, fetchData, onDataChange]);
  
  const handleDialogClose = (updated?: boolean) => {
    setIsEditDialogOpen(false);
    setIsDeleteDialogOpen(false);
    setSelectedProfile(null);
    if (updated) {
      onDataChange();
    }
  };

  const teachersAndCoordinators = useMemo(() => {
    const programMap = new Map(programs.map(p => [p.id, p.name]));
    const targetRoleIds = roles
        .filter(role => role.name.toLowerCase() === 'docente' || role.name.toLowerCase() === 'coordinador')
        .map(role => role.id);

    return staff
      .filter(s => targetRoleIds.includes(s.roleId) || s.role === 'Teacher' || s.role === 'Coordinator')
      .map(s => ({
            ...s,
            id: s.documentId,
            programName: programMap.get(s.programId) || 'N/A'
      } as StaffProfile & { programName: string }));
  }, [staff, programs, roles]);

  const filteredData = useMemo(() => {
    return teachersAndCoordinators.filter(profile => {
        const textMatch = profile.displayName.toLowerCase().includes(textFilter.toLowerCase()) ||
                          profile.documentId.toLowerCase().includes(textFilter.toLowerCase()) ||
                          profile.email.toLowerCase().includes(textFilter.toLowerCase());
        const programMatch = programFilter === 'all' || profile.programId === programFilter;
        const conditionMatch = conditionFilter === 'all' || profile.condition === conditionFilter;

        return textMatch && programMatch && conditionMatch;
    });
  }, [teachersAndCoordinators, textFilter, programFilter, conditionFilter]);
  
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return filteredData.slice(start, end);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);

  const handleSelectAll = (checked: boolean | string) => {
    if (checked) {
        setSelectedProfileIds(new Set(teachersAndCoordinators.map(p => p.documentId)));
    } else {
        setSelectedProfileIds(new Set());
    }
  };

  const handleSelectOne = (profileId: string, isSelected: boolean) => {
    const newSet = new Set(selectedProfileIds);
    if (isSelected) {
        newSet.add(profileId);
    } else {
        newSet.delete(profileId);
    }
    setSelectedProfileIds(newSet);
  };
  
   const handleBulkDelete = async () => {
    if (!instituteId || selectedProfileIds.size === 0) return;
    try {
        await bulkDeleteStaff(instituteId, Array.from(selectedProfileIds));
        toast({
            title: "Eliminación Exitosa",
            description: `${selectedProfileIds.size} perfiles han sido eliminados.`,
        });
        onDataChange();
    } catch (error) {
        toast({ title: "Error", description: "No se pudieron eliminar los perfiles seleccionados.", variant: "destructive"});
    }
  };

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
  
  if (!teachersAndCoordinators.length) {
    return <p className="text-center text-muted-foreground">No hay docentes o coordinadores registrados.</p>;
  }

  return (
    <>
       {canEdit && selectedProfileIds.size > 0 && (
         <div className="mb-4 flex items-center justify-between bg-muted p-3 rounded-lg">
            <p className="text-sm font-medium">{selectedProfileIds.size} perfil(es) seleccionado(s)</p>
             <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                        <Trash2 className="mr-2 h-4 w-4"/>
                        Eliminar Seleccionados
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Confirmar eliminación masiva?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminarán permanentemente {selectedProfileIds.size} perfiles.
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
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <Input 
          placeholder="Buscar por nombre, documento o email..."
          value={textFilter}
          onChange={(e) => {
            setTextFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="max-w-sm"
        />
        <Select value={programFilter} onValueChange={(value) => {setProgramFilter(value); setCurrentPage(1);}}>
            <SelectTrigger className="w-full sm:w-[240px]">
                <SelectValue placeholder="Filtrar por programa..." />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Todos los Programas</SelectItem>
                {programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
        </Select>
        <Select value={conditionFilter} onValueChange={(value) => {setConditionFilter(value); setCurrentPage(1);}}>
            <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filtrar por condición..." />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Todas las Condiciones</SelectItem>
                {conditions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
        </Select>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                    checked={selectedProfileIds.size === teachersAndCoordinators.length && teachersAndCoordinators.length > 0}
                    onCheckedChange={handleSelectAll}
                    aria-label="Seleccionar todas las filas"
                 />
              </TableHead>
              <TableHead>Nombre Completo</TableHead>
              <TableHead>N° Documento</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Programa</TableHead>
              <TableHead>Condición</TableHead>
              <TableHead>Vinculado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((profile) => (
              <TableRow key={profile.documentId} data-state={selectedProfileIds.has(profile.documentId) && "selected"}>
                 <TableCell>
                    <Checkbox
                        checked={selectedProfileIds.has(profile.documentId)}
                        onCheckedChange={(checked) => handleSelectOne(profile.documentId, !!checked)}
                        aria-label={`Seleccionar fila para ${profile.displayName}`}
                    />
                </TableCell>
                <TableCell className="font-medium">{profile.displayName}</TableCell>
                <TableCell>{profile.documentId}</TableCell>
                <TableCell>{profile.email}</TableCell>
                <TableCell>{profile.programName || 'N/A'}</TableCell>
                <TableCell><Badge variant="outline">{profile.condition || 'N/A'}</Badge></TableCell>
                <TableCell>
                  <Badge variant={profile.linkedUserUid ? 'default' : 'secondary'}>
                    {profile.linkedUserUid ? 'Sí' : 'No'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                    <div className="inline-flex items-center gap-1">
                        <Button asChild variant="ghost" size="icon" title="Ver Perfil Público">
                           <Link href={`/profile/${profile.documentId}`} target="_blank">
                                <Eye className="h-4 w-4" />
                            </Link>
                        </Button>
                        {canEdit && (
                            <>
                            <Button variant="ghost" size="icon" onClick={() => {setSelectedProfile(profile); setIsEditDialogOpen(true);}} title="Editar">
                                <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => {setSelectedProfile(profile); setIsDeleteDialogOpen(true);}} title="Eliminar">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                            </>
                        )}
                    </div>
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

      {selectedProfile && isEditDialogOpen && (
        <EditStaffProfileDialog 
          profile={selectedProfile}
          isOpen={isEditDialogOpen}
          onClose={handleDialogClose}
        />
      )}
       {selectedProfile && isDeleteDialogOpen && (
        <DeleteStaffProfileDialog
          profile={selectedProfile}
          isOpen={isDeleteDialogOpen}
          onClose={handleDialogClose}
        />
       )}
    </>
  );
}
