

"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getStaffProfiles, getPrograms, getRoles, bulkDeleteStaff } from '@/config/firebase';
import type { StaffProfile, Program, Role } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit2, Trash2, Eye, KeyRound, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '../ui/input';
import Link from 'next/link';
import { EditStaffProfileDialog } from '../users/EditStaffProfileDialog';
import { DeleteStaffProfileDialog } from '../users/DeleteStaffProfileDialog';
import { Checkbox } from '../ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';


interface StaffTableProps {
    instituteId: string;
    onDataChange: () => void;
    isAttendanceReportMode?: boolean;
}

const PAGE_SIZE = 10;

export function StaffTable({ instituteId, onDataChange, isAttendanceReportMode = false }: StaffTableProps) {
  const [profiles, setProfiles] = useState<StaffProfile[]>([]);
  const [programs, setPrograms] = useState<Map<string, Program>>(new Map());
  const [roles, setRoles] = useState<Map<string, Role>>(new Map());
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<StaffProfile | null>(null);
  const [selectedProfileIds, setSelectedProfileIds] = useState<Set<string>>(new Set());

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [filter, setFilter] = useState('');
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
      setProfiles(fetchedStaff);
      setPrograms(new Map(fetchedPrograms.map(p => [p.id, p])));
      setRoles(new Map(fetchedRoles.map(r => [r.id, r])));
      setSelectedProfileIds(new Set());
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los perfiles del personal.",
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

  const filteredProfiles = useMemo(() =>
    profiles.filter(profile =>
        profile.displayName.toLowerCase().includes(filter.toLowerCase()) ||
        profile.documentId.toLowerCase().includes(filter.toLowerCase()) ||
        profile.email.toLowerCase().includes(filter.toLowerCase())
    ), [profiles, filter]);
  
  const paginatedProfiles = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return filteredProfiles.slice(start, end);
  }, [filteredProfiles, currentPage]);

  const totalPages = Math.ceil(filteredProfiles.length / PAGE_SIZE);

  const handleSelectAll = (checked: boolean | string) => {
    if (checked) {
        setSelectedProfileIds(new Set(profiles.map(p => p.documentId)));
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
        <Skeleton className="h-10 w-1/3 mb-2" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }
  
  if (!profiles.length) {
    return <p className="text-center text-muted-foreground py-8">No hay perfiles de personal registrados.</p>;
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
      <div className="mb-4">
        <Input 
          placeholder="Buscar por nombre, documento o email..."
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
               <TableHead className="w-[50px]">
                <Checkbox
                    checked={selectedProfileIds.size === profiles.length && profiles.length > 0}
                    onCheckedChange={handleSelectAll}
                    aria-label="Seleccionar todas las filas"
                 />
              </TableHead>
              <TableHead>N° Documento</TableHead>
              <TableHead>Nombre Completo</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>ID Tarjeta</TableHead>
              <TableHead>Vinculado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProfiles.map((profile) => (
              <TableRow key={`${profile.documentId}-${profile.email}`} data-state={selectedProfileIds.has(profile.documentId) && "selected"}>
                 <TableCell>
                    <Checkbox
                        checked={selectedProfileIds.has(profile.documentId)}
                        onCheckedChange={(checked) => handleSelectOne(profile.documentId, !!checked)}
                        aria-label={`Seleccionar fila para ${profile.displayName}`}
                    />
                </TableCell>
                <TableCell className="font-mono">{profile.documentId}</TableCell>
                <TableCell className="font-medium">{profile.displayName}</TableCell>
                <TableCell>{roles.get(profile.roleId)?.name || profile.role || 'N/A'}</TableCell>
                <TableCell>
                  {profile.rfidCardId ? (
                    <Badge variant="secondary"><KeyRound className="mr-2 h-3 w-3"/>{profile.rfidCardId}</Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">Sin Asignar</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={profile.linkedUserUid ? 'default' : 'secondary'}>
                    {profile.linkedUserUid ? 'Sí' : 'No'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                   {isAttendanceReportMode ? (
                       <Button asChild variant="outline" size="sm">
                            <Link href={`/dashboard/gestion-administrativa/reporte-asistencia/${profile.documentId}`}>
                                Ver Reporte <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                   ) : (
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
                   )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {totalPages > 1 && (
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
      )}

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
